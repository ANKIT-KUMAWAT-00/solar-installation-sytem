from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.erp_models import (
    Installation, InstallationTask, InstallationPhoto, Order, Customer,
    Technician, SerializedEquipment, Warranty, User,
    InstallationStatus, SerialStatus, WarrantyStatus, OrderStatus
)
from app.schemas.erp_schemas import InstallationOut

router = APIRouter(prefix="/installations", tags=["Field Installations"])

@router.get("", response_model=List[InstallationOut])
async def list_installations(
    status: Optional[InstallationStatus] = Query(None),
    customer_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Installation).options(
        selectinload(Installation.order),
        selectinload(Installation.customer),
        selectinload(Installation.tasks)
    )

    if status:
        query = query.filter(Installation.status == status)
    if customer_id:
        query = query.filter(Installation.customer_id == customer_id)
    if search:
        search_fmt = f"%{search}%"
        query = query.join(Customer).filter(
            (Customer.full_name.ilike(search_fmt)) |
            (Installation.installation_code.ilike(search_fmt)) |
            (Customer.city.ilike(search_fmt))
        )

    result = await db.execute(query.order_by(Installation.id.desc()))
    installations = result.scalars().all()

    out = []
    for inst in installations:
        task_list = [
            {
                "id": t.id,
                "step_order": t.step_order,
                "step_name": t.step_name,
                "status": t.status,
                "assigned_technician_name": "Field Crew",
                "completed_at": t.completed_at,
                "notes": t.notes
            }
            for t in inst.tasks
        ]
        out.append({
            "id": inst.id,
            "installation_code": inst.installation_code,
            "order_id": inst.order_id,
            "order_number": inst.order.order_number if inst.order else "",
            "customer_id": inst.customer_id,
            "customer_name": inst.customer.full_name if inst.customer else "",
            "customer_phone": inst.customer.phone if inst.customer else "",
            "customer_address": f"{inst.customer.address}, {inst.customer.city}" if inst.customer else "",
            "system_capacity_kw": inst.system_capacity_kw,
            "system_type": inst.system_type,
            "scheduled_date": inst.scheduled_date,
            "actual_completion_date": inst.actual_completion_date,
            "status": inst.status,
            "team_leader_name": "Marcus Vance (Lead)",
            "customer_signature_svg": inst.customer_signature_svg,
            "customer_acceptance_notes": inst.customer_acceptance_notes,
            "commissioning_certificate_no": inst.commissioning_certificate_no,
            "gps_latitude": inst.gps_latitude,
            "gps_longitude": inst.gps_longitude,
            "tasks": task_list
        })
    return out

@router.get("/{id}")
async def get_installation_detail(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Installation)
        .options(
            selectinload(Installation.order),
            selectinload(Installation.customer),
            selectinload(Installation.tasks),
            selectinload(Installation.photos)
        )
        .filter(Installation.id == id)
    )
    inst = result.scalars().first()
    if not inst:
        raise HTTPException(status_code=404, detail="Installation not found")

    # Get installed serialized equipment
    serials_res = await db.execute(
        select(SerializedEquipment)
        .options(selectinload(SerializedEquipment.product))
        .filter(SerializedEquipment.order_id == inst.order_id)
    )
    serials = serials_res.scalars().all()

    return {
        "id": inst.id,
        "installation_code": inst.installation_code,
        "order_number": inst.order.order_number if inst.order else "",
        "customer": {
            "id": inst.customer.id,
            "name": inst.customer.full_name,
            "phone": inst.customer.phone,
            "address": inst.customer.address,
            "city": inst.customer.city
        } if inst.customer else None,
        "system_capacity_kw": inst.system_capacity_kw,
        "system_type": inst.system_type.value,
        "scheduled_date": inst.scheduled_date,
        "actual_completion_date": inst.actual_completion_date,
        "status": inst.status.value,
        "customer_signature_svg": inst.customer_signature_svg,
        "customer_acceptance_notes": inst.customer_acceptance_notes,
        "commissioning_certificate_no": inst.commissioning_certificate_no,
        "tasks": [
            {
                "id": t.id,
                "step_order": t.step_order,
                "step_name": t.step_name,
                "status": t.status,
                "completed_at": t.completed_at,
                "notes": t.notes
            }
            for t in inst.tasks
        ],
        "photos": [
            {
                "id": p.id,
                "photo_type": p.photo_type,
                "photo_url": p.photo_url,
                "caption": p.caption
            }
            for p in inst.photos
        ],
        "installed_equipment": [
            {
                "id": s.id,
                "serial_number": s.serial_number,
                "product_name": s.product.name if s.product else "",
                "category": s.product.category.value if s.product else "",
                "manufacturer": s.manufacturer,
                "model": s.model,
                "warranty_years": s.warranty_duration_years
            }
            for s in serials
        ]
    }

@router.put("/{id}/tasks/{task_id}")
async def update_task_progress(
    id: int,
    task_id: int,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mobile Field Form: Updates 13-step checklist tasks.
    """
    res = await db.execute(
        select(InstallationTask).filter(
            InstallationTask.id == task_id,
            InstallationTask.installation_id == id
        )
    )
    task = res.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    new_status = payload.get("status", "COMPLETED")
    task.status = new_status
    if new_status == "COMPLETED":
        task.completed_at = datetime.utcnow()
    if "notes" in payload:
        task.notes = payload["notes"]

    # Update overall installation status progress
    res_inst = await db.execute(
        select(Installation).options(selectinload(Installation.tasks)).filter(Installation.id == id)
    )
    inst = res_inst.scalars().first()
    if inst:
        completed_count = sum(1 for t in inst.tasks if t.status == "COMPLETED")
        if completed_count >= 11:
            inst.status = InstallationStatus.COMMISSIONED
        elif completed_count >= 5:
            inst.status = InstallationStatus.WORK_STARTED

    await db.commit()
    return {"status": "success", "task_id": task_id, "new_status": new_status}

@router.post("/{id}/customer-acceptance")
async def record_customer_acceptance(
    id: int,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    CRITICAL BUSINESS AUTOMATION:
    1. Records Customer Digital Signature SVG and Commissioning Certificate.
    2. Marks installation as CUSTOMER_ACCEPTED and COMPLETED.
    3. Automatically starts Warranties for all installed equipment starting from today!
    """
    signature_svg = payload.get("signature_svg")
    acceptance_notes = payload.get("notes", "Customer confirmed successful commissioning & testing.")

    res_inst = await db.execute(
        select(Installation).options(selectinload(Installation.order)).filter(Installation.id == id)
    )
    inst = res_inst.scalars().first()
    if not inst:
        raise HTTPException(status_code=404, detail="Installation not found")

    now = datetime.utcnow()
    cert_no = f"CERT-COMM-{inst.installation_code[-4:]}-{now.strftime('%Y%m%d')}"

    inst.customer_signature_svg = signature_svg or "<svg>Digital Signature</svg>"
    inst.customer_acceptance_notes = acceptance_notes
    inst.commissioning_certificate_no = cert_no
    inst.actual_completion_date = now
    inst.status = InstallationStatus.CUSTOMER_ACCEPTED

    # Update Order
    if inst.order:
        inst.order.status = OrderStatus.COMPLETED

    # AUTOMATIC WARRANTY ACTIVATION
    # "Warranty should start automatically on the actual delivery/commissioning date according to the company's configured warranty policy."
    serials_res = await db.execute(
        select(SerializedEquipment)
        .options(selectinload(SerializedEquipment.product))
        .filter(SerializedEquipment.order_id == inst.order_id)
    )
    serials = serials_res.scalars().all()

    for s in serials:
        s.status = SerialStatus.INSTALLED
        s.installed_date = now
        s.installation_id = inst.id
        
        # Check if warranty already registered
        res_war = await db.execute(select(Warranty).filter(Warranty.serialized_equipment_id == s.id))
        war = res_war.scalars().first()
        if not war:
            dur = s.warranty_duration_years or 5
            w_code = f"WAR-{s.serial_number}"
            new_war = Warranty(
                warranty_code=w_code,
                serialized_equipment_id=s.id,
                customer_id=inst.customer_id,
                installation_id=inst.id,
                start_date=now,
                end_date=now + timedelta(days=dur * 365),
                duration_years=dur,
                status=WarrantyStatus.ACTIVE
            )
            db.add(new_war)

    await db.commit()

    return {
        "status": "success",
        "message": f"Customer acceptance confirmed! Certificate {cert_no} issued. Equipment warranties are now active.",
        "commissioning_certificate_no": cert_no,
        "installation_id": id
    }
