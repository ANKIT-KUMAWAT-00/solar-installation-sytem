from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.erp_models import Customer, Lead, User, LeadStatus, LeadSource, PriorityLevel, SystemType
from app.schemas.erp_schemas import LeadCreate, LeadUpdate, LeadOut, PublicEnquiryCreate, CustomerOut

router = APIRouter(prefix="/crm", tags=["CRM & Customer Enquiries"])

@router.get("/leads", response_model=List[LeadOut])
async def list_leads(
    status: Optional[LeadStatus] = Query(None),
    priority: Optional[PriorityLevel] = Query(None),
    source: Optional[LeadSource] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Lead).options(selectinload(Lead.customer))

    if status:
        query = query.filter(Lead.status == status)
    if priority:
        query = query.filter(Lead.priority == priority)
    if source:
        query = query.filter(Lead.lead_source == source)
    if search:
        search_fmt = f"%{search}%"
        query = query.join(Customer).filter(
            (Customer.full_name.ilike(search_fmt)) |
            (Customer.phone.ilike(search_fmt)) |
            (Customer.city.ilike(search_fmt)) |
            (Lead.enquiry_number.ilike(search_fmt))
        )

    result = await db.execute(query.order_by(Lead.id.desc()))
    leads = result.scalars().all()

    out = []
    for l in leads:
        out.append({
            "id": l.id,
            "enquiry_number": l.enquiry_number,
            "customer_id": l.customer_id,
            "customer_name": l.customer.full_name if l.customer else "Unknown",
            "customer_phone": l.customer.phone if l.customer else "",
            "customer_city": l.customer.city if l.customer else "",
            "requested_capacity_kw": l.requested_capacity_kw,
            "preferred_system_type": l.preferred_system_type,
            "subsidy_required": l.subsidy_required,
            "lead_source": l.lead_source,
            "status": l.status,
            "priority": l.priority,
            "follow_up_date": l.follow_up_date,
            "contact_notes": l.contact_notes,
            "lost_reason": l.lost_reason,
            "created_at": l.created_at
        })
    return out

@router.post("/leads", response_model=LeadOut)
async def create_lead(
    lead_in: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if customer exists by phone
    res_cust = await db.execute(select(Customer).filter(Customer.phone == lead_in.phone))
    cust = res_cust.scalars().first()

    if not cust:
        # Generate customer code
        res_count = await db.execute(select(func.count(Customer.id)))
        c_count = (res_count.scalar() or 0) + 1
        cust = Customer(
            customer_code=f"CUST-{c_count:04d}",
            full_name=lead_in.customer_name,
            phone=lead_in.phone,
            email=lead_in.email,
            address=lead_in.address,
            city=lead_in.city,
            state=lead_in.state,
            postal_code=lead_in.postal_code,
            notes=lead_in.contact_notes
        )
        db.add(cust)
        await db.flush()

    # Generate enquiry number
    res_l_count = await db.execute(select(func.count(Lead.id)))
    l_count = (res_l_count.scalar() or 0) + 1
    enquiry_no = f"ENQ-2026-{l_count:04d}"

    new_lead = Lead(
        enquiry_number=enquiry_no,
        customer_id=cust.id,
        requested_capacity_kw=lead_in.requested_capacity_kw,
        preferred_system_type=lead_in.preferred_system_type,
        subsidy_required=lead_in.subsidy_required,
        lead_source=lead_in.lead_source,
        status=LeadStatus.NEW,
        priority=lead_in.priority,
        contact_notes=lead_in.contact_notes,
        assigned_sales_id=current_user.id
    )
    db.add(new_lead)
    await db.commit()
    await db.refresh(new_lead)

    return {
        "id": new_lead.id,
        "enquiry_number": new_lead.enquiry_number,
        "customer_id": cust.id,
        "customer_name": cust.full_name,
        "customer_phone": cust.phone,
        "customer_city": cust.city,
        "requested_capacity_kw": new_lead.requested_capacity_kw,
        "preferred_system_type": new_lead.preferred_system_type,
        "subsidy_required": new_lead.subsidy_required,
        "lead_source": new_lead.lead_source,
        "status": new_lead.status,
        "priority": new_lead.priority,
        "follow_up_date": new_lead.follow_up_date,
        "contact_notes": new_lead.contact_notes,
        "lost_reason": new_lead.lost_reason,
        "created_at": new_lead.created_at
    }

@router.post("/public-enquiry")
async def submit_public_enquiry(
    enquiry: PublicEnquiryCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Public API: Ingestion from website enquiry form.
    Creates persistent customer and lead automatically.
    """
    res_cust = await db.execute(select(Customer).filter(Customer.phone == enquiry.phone))
    cust = res_cust.scalars().first()

    if not cust:
        res_count = await db.execute(select(func.count(Customer.id)))
        c_count = (res_count.scalar() or 0) + 1
        cust = Customer(
            customer_code=f"CUST-{c_count:04d}",
            full_name=enquiry.full_name,
            phone=enquiry.phone,
            email=enquiry.email,
            address="Website Online Submission",
            city=enquiry.city,
            state="Maharashtra",
            postal_code="411001",
            avg_monthly_bill_inr=enquiry.avg_monthly_bill_inr,
            notes=enquiry.notes
        )
        db.add(cust)
        await db.flush()

    res_l_count = await db.execute(select(func.count(Lead.id)))
    l_count = (res_l_count.scalar() or 0) + 1
    enquiry_no = f"ENQ-WEB-{l_count:04d}"

    new_lead = Lead(
        enquiry_number=enquiry_no,
        customer_id=cust.id,
        requested_capacity_kw=enquiry.requested_capacity_kw,
        preferred_system_type=enquiry.system_type,
        subsidy_required=True,
        lead_source=LeadSource.WEBSITE,
        status=LeadStatus.NEW,
        priority=PriorityLevel.HIGH,
        contact_notes=f"Web Enquiry: Avg Bill Rs.{enquiry.avg_monthly_bill_inr}. Notes: {enquiry.notes or 'None'}"
    )
    db.add(new_lead)
    await db.commit()

    return {
        "status": "success",
        "message": "Thank you! Your solar quotation request has been received. Our sales engineer will contact you shortly.",
        "enquiry_number": enquiry_no
    }

@router.put("/leads/{id}")
async def update_lead(
    id: int,
    lead_update: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(Lead).filter(Lead.id == id))
    lead = res.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for k, v in lead_update.dict(exclude_unset=True).items():
        setattr(lead, k, v)

    await db.commit()
    return {"status": "success", "message": "Lead updated successfully", "lead_id": id}

@router.get("/customers", response_model=List[CustomerOut])
async def list_customers(
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Customer)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Customer.full_name.ilike(search_fmt)) |
            (Customer.phone.ilike(search_fmt)) |
            (Customer.city.ilike(search_fmt))
        )
    res = await db.execute(query.order_by(Customer.id.desc()))
    return res.scalars().all()
