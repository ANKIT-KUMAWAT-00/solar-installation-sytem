from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.erp_models import (
    ServiceTicket, Customer, Installation, SerializedEquipment, Warranty,
    Technician, User, TicketStatus, PriorityLevel, WarrantyStatus, UserRole
)
from app.schemas.erp_schemas import ServiceTicketCreate, ServiceTicketOut

router = APIRouter(prefix="/service", tags=["After-Sales Service & Complaints"])

@router.get("/tickets", response_model=List[ServiceTicketOut])
async def list_service_tickets(
    status: Optional[TicketStatus] = Query(None),
    priority: Optional[PriorityLevel] = Query(None),
    customer_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ServiceTicket).options(
        selectinload(ServiceTicket.customer),
        selectinload(ServiceTicket.assigned_technician)
    )

    if current_user.role == UserRole.CUSTOMER:
        query = query.join(Customer).filter(Customer.email == current_user.email)
    if status:
        query = query.filter(ServiceTicket.status == status)
    if priority:
        query = query.filter(ServiceTicket.priority == priority)
    if customer_id:
        query = query.filter(ServiceTicket.customer_id == customer_id)
    if search:
        search_fmt = f"%{search}%"
        query = query.join(Customer).filter(
            (Customer.full_name.ilike(search_fmt)) |
            (Customer.phone.ilike(search_fmt)) |
            (ServiceTicket.ticket_number.ilike(search_fmt))
        )

    result = await db.execute(query.order_by(ServiceTicket.id.desc()))
    tickets = result.scalars().all()

    out = []
    for t in tickets:
        out.append({
            "id": t.id,
            "ticket_number": t.ticket_number,
            "customer_id": t.customer_id,
            "customer_name": t.customer.full_name if t.customer else "",
            "customer_phone": t.customer.phone if t.customer else "",
            "installation_id": t.installation_id,
            "fault_category": t.fault_category,
            "fault_code": t.fault_code,
            "description": t.description,
            "priority": t.priority,
            "status": t.status,
            "assigned_technician_name": t.assigned_technician.name if t.assigned_technician else "Pending Dispatch",
            "is_covered_under_warranty": t.is_covered_under_warranty,
            "estimated_repair_cost": t.estimated_repair_cost,
            "actual_repair_cost": t.actual_repair_cost,
            "customer_charge_inr": t.customer_charge_inr,
            "resolution_notes": t.resolution_notes,
            "reported_at": t.reported_at,
            "resolved_at": t.resolved_at
        })
    return out

@router.post("/tickets", response_model=ServiceTicketOut)
async def create_service_ticket(
    ticket_in: ServiceTicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    CRITICAL AFTER-SALES AUTOMATION:
    1. Finds customer installation and affected serialized equipment.
    2. Validates warranty coverage automatically.
    3. If warranty is valid: customer charge = ₹0.
    4. If expired: calculates replacement part cost + labour.
    """
    res_inst = await db.execute(
        select(Installation).options(selectinload(Installation.customer)).filter(Installation.id == ticket_in.installation_id)
    )
    inst = res_inst.scalars().first()
    if not inst:
        raise HTTPException(status_code=404, detail="Installation not found")

    # Generate ticket number
    res_count = await db.execute(select(func.count(ServiceTicket.id)))
    t_count = (res_count.scalar() or 0) + 1
    t_num = f"TCK-2026-{t_count:04d}"

    # Warranty verification logic
    is_covered = True
    customer_charge = 0.0
    est_cost = 4500.0  # internal technician visit & repair cost

    if ticket_in.serialized_equipment_id:
        res_war = await db.execute(
            select(Warranty).filter(Warranty.serialized_equipment_id == ticket_in.serialized_equipment_id)
        )
        war = res_war.scalars().first()
        now = datetime.utcnow()
        if war:
            if now > war.end_date or war.status == WarrantyStatus.EXPIRED:
                is_covered = False
                customer_charge = 12500.0  # Out of warranty component replacement + service
        else:
            is_covered = False
            customer_charge = 8500.0

    ticket = ServiceTicket(
        ticket_number=t_num,
        customer_id=inst.customer_id,
        installation_id=inst.id,
        serialized_equipment_id=ticket_in.serialized_equipment_id,
        fault_category=ticket_in.fault_category,
        fault_code=ticket_in.fault_code,
        description=ticket_in.description,
        priority=ticket_in.priority,
        status=TicketStatus.NEW,
        is_covered_under_warranty=is_covered,
        estimated_repair_cost=est_cost,
        customer_charge_inr=customer_charge
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    return {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "customer_id": inst.customer_id,
        "customer_name": inst.customer.full_name if inst.customer else "",
        "customer_phone": inst.customer.phone if inst.customer else "",
        "installation_id": inst.id,
        "fault_category": ticket.fault_category,
        "fault_code": ticket.fault_code,
        "description": ticket.description,
        "priority": ticket.priority,
        "status": ticket.status,
        "assigned_technician_name": "Pending Dispatch",
        "is_covered_under_warranty": ticket.is_covered_under_warranty,
        "estimated_repair_cost": ticket.estimated_repair_cost,
        "actual_repair_cost": 0.0,
        "customer_charge_inr": ticket.customer_charge_inr,
        "resolution_notes": None,
        "reported_at": ticket.reported_at,
        "resolved_at": None
    }

@router.put("/tickets/{id}")
async def update_ticket(
    id: int,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(ServiceTicket).filter(ServiceTicket.id == id))
    ticket = res.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Service ticket not found")

    if "status" in payload:
        ticket.status = payload["status"]
        if payload["status"] in [TicketStatus.CLOSED, TicketStatus.CUSTOMER_CONFIRMATION]:
            ticket.resolved_at = datetime.utcnow()
    if "assigned_technician_id" in payload:
        ticket.assigned_technician_id = payload["assigned_technician_id"]
    if "resolution_notes" in payload:
        ticket.resolution_notes = payload["resolution_notes"]
    if "actual_repair_cost" in payload:
        ticket.actual_repair_cost = payload["actual_repair_cost"]

    await db.commit()
    return {"status": "success", "ticket_id": id, "new_status": ticket.status}
