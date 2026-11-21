from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.erp_models import Order, Customer, ProductPackage, Payment, Dispatch, Installation, User, OrderStatus, UserRole
from app.schemas.erp_schemas import OrderOut

router = APIRouter(prefix="/orders", tags=["Orders Management"])

@router.get("", response_model=List[OrderOut])
async def list_orders(
    status: Optional[OrderStatus] = Query(None),
    customer_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Order).options(
        selectinload(Order.customer),
        selectinload(Order.package)
    )

    if current_user.role == UserRole.CUSTOMER:
        query = query.join(Customer).filter(Customer.email == current_user.email)
    if status:
        query = query.filter(Order.status == status)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    if search:
        search_fmt = f"%{search}%"
        query = query.join(Customer).filter(
            (Customer.full_name.ilike(search_fmt)) |
            (Customer.phone.ilike(search_fmt)) |
            (Order.order_number.ilike(search_fmt))
        )

    result = await db.execute(query.order_by(Order.id.desc()))
    orders = result.scalars().all()

    out = []
    for o in orders:
        is_ready = (o.advance_paid >= o.advance_required) or (o.credit_override_reason is not None)
        out.append({
            "id": o.id,
            "order_number": o.order_number,
            "quotation_id": o.quotation_id,
            "customer_id": o.customer_id,
            "customer_name": o.customer.full_name if o.customer else "",
            "customer_phone": o.customer.phone if o.customer else "",
            "customer_address": o.customer.address if o.customer else "",
            "customer_city": o.customer.city if o.customer else "",
            "package_id": o.package_id,
            "package_name": o.package.name if o.package else "",
            "system_capacity_kw": o.system_capacity_kw,
            "system_type": o.system_type,
            "order_date": o.order_date,
            "total_amount": o.total_amount,
            "advance_required": o.advance_required,
            "advance_paid": o.advance_paid,
            "remaining_balance": o.remaining_balance,
            "status": o.status,
            "credit_override_reason": o.credit_override_reason,
            "is_dispatch_ready": is_ready,
            "created_at": o.created_at
        })
    return out

@router.get("/{id}")
async def get_order_details(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.customer),
            selectinload(Order.package),
            selectinload(Order.payments),
            selectinload(Order.dispatches),
            selectinload(Order.installation),
            selectinload(Order.project_costs)
        )
        .filter(Order.id == id)
    )
    o = result.scalars().first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")

    is_ready = (o.advance_paid >= o.advance_required) or (o.credit_override_reason is not None)

    return {
        "id": o.id,
        "order_number": o.order_number,
        "quotation_id": o.quotation_id,
        "customer": {
            "id": o.customer.id,
            "name": o.customer.full_name,
            "phone": o.customer.phone,
            "address": o.customer.address,
            "city": o.customer.city
        } if o.customer else None,
        "package": {
            "id": o.package.id,
            "name": o.package.name,
            "capacity_kw": o.package.capacity_kw
        } if o.package else None,
        "system_capacity_kw": o.system_capacity_kw,
        "system_type": o.system_type,
        "order_date": o.order_date,
        "total_amount": o.total_amount,
        "advance_required": o.advance_required,
        "advance_paid": o.advance_paid,
        "remaining_balance": o.remaining_balance,
        "status": o.status,
        "is_dispatch_ready": is_ready,
        "credit_override_reason": o.credit_override_reason,
        "payments": [
            {
                "id": p.id,
                "receipt_number": p.receipt_number,
                "amount": p.amount,
                "payment_type": p.payment_type,
                "payment_method": p.payment_method,
                "transaction_ref": p.transaction_reference,
                "date": p.payment_date,
                "status": p.status
            }
            for p in o.payments
        ],
        "installation": {
            "id": o.installation.id,
            "code": o.installation.installation_code,
            "status": o.installation.status,
            "scheduled_date": o.installation.scheduled_date
        } if o.installation else None,
        "costs": [
            {
                "category": c.category,
                "description": c.description,
                "amount": c.amount_inr,
                "date": c.recorded_date
            }
            for c in o.project_costs
        ]
    }

@router.post("/{id}/credit-override")
async def approve_credit_override(
    id: int,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.DIRECTOR]))
):
    """
    CRITICAL BUSINESS RULE:
    Installation dispatch is blocked until required minimum advance payment has been satisfied.
    Authorized Manager/Director can approve credit exception with mandatory audit reason.
    """
    reason = payload.get("reason")
    if not reason:
        raise HTTPException(status_code=400, detail="Mandatory manager credit override reason required")

    res = await db.execute(select(Order).filter(Order.id == id))
    order = res.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.credit_override_approved_by = current_user.id
    order.credit_override_reason = reason
    if order.status in [OrderStatus.CONFIRMED, OrderStatus.PAYMENT_PENDING]:
        order.status = OrderStatus.READY_FOR_DISPATCH

    await db.commit()
    return {
        "status": "success",
        "message": "Credit override approved. Order is now released for warehouse dispatch.",
        "order_id": id,
        "override_reason": reason
    }
