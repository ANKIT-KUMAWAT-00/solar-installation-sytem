from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.erp_models import SubsidyApplication, SubsidyDocument, Order, Customer, User, SubsidyStatus
from app.schemas.erp_schemas import SubsidyOut

router = APIRouter(prefix="/subsidies", tags=["Government Subsidy Management"])

@router.get("", response_model=List[SubsidyOut])
async def list_subsidies(
    status: Optional[SubsidyStatus] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(SubsidyApplication).options(
        selectinload(SubsidyApplication.order),
        selectinload(SubsidyApplication.customer)
    )

    if status:
        query = query.filter(SubsidyApplication.status == status)

    result = await db.execute(query.order_by(SubsidyApplication.id.desc()))
    apps = result.scalars().all()

    out = []
    for a in apps:
        out.append({
            "id": a.id,
            "application_number": a.application_number,
            "order_id": a.order_id,
            "order_number": a.order.order_number if a.order else "",
            "customer_name": a.customer.full_name if a.customer else "",
            "customer_phone": a.customer.phone if a.customer else "",
            "consumer_number": a.consumer_number,
            "discom_name": a.discom_name,
            "scheme_name": a.scheme_name,
            "capacity_kw": a.capacity_kw,
            "subsidy_amount_eligible_inr": a.subsidy_amount_eligible_inr,
            "status": a.status,
            "submission_date": a.submission_date,
            "approval_date": a.approval_date,
            "disbursement_date": a.disbursement_date,
            "rejection_reason": a.rejection_reason
        })
    return out

@router.put("/{id}")
async def update_subsidy_status(
    id: int,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(SubsidyApplication).filter(SubsidyApplication.id == id))
    app = res.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Subsidy application not found")

    if "status" in payload:
        app.status = payload["status"]
    if "rejection_reason" in payload:
        app.rejection_reason = payload["rejection_reason"]

    await db.commit()
    return {"status": "success", "application_id": id, "new_status": app.status}
