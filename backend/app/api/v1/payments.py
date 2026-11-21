from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.erp_models import Payment, Order, Customer, User, OrderStatus, PaymentStatus, UserRole
from app.schemas.erp_schemas import PaymentCreate, PaymentOut

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("", response_model=List[PaymentOut])
async def list_payments(
    order_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Payment).options(
        selectinload(Payment.order),
        selectinload(Payment.customer)
    )

    if order_id:
        query = query.filter(Payment.order_id == order_id)
    if customer_id:
        query = query.filter(Payment.customer_id == customer_id)

    result = await db.execute(query.order_by(Payment.id.desc()))
    payments = result.scalars().all()

    out = []
    for p in payments:
        out.append({
            "id": p.id,
            "receipt_number": p.receipt_number,
            "order_id": p.order_id,
            "order_number": p.order.order_number if p.order else "",
            "customer_id": p.customer_id,
            "customer_name": p.customer.full_name if p.customer else "",
            "amount": p.amount,
            "payment_type": p.payment_type,
            "payment_method": p.payment_method,
            "transaction_reference": p.transaction_reference,
            "payment_date": p.payment_date,
            "status": p.status,
            "notes": p.notes
        })
    return out

@router.post("", response_model=PaymentOut)
async def record_payment(
    payment_in: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res_order = await db.execute(
        select(Order).options(selectinload(Order.customer)).filter(Order.id == payment_in.order_id)
    )
    order = res_order.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Generate receipt number
    res_count = await db.execute(select(func.count(Payment.id)))
    p_count = (res_count.scalar() or 0) + 1
    receipt_no = f"REC-2026-{p_count:04d}"

    payment = Payment(
        receipt_number=receipt_no,
        order_id=order.id,
        customer_id=order.customer_id,
        amount=payment_in.amount,
        payment_type=payment_in.payment_type,
        payment_method=payment_in.payment_method,
        transaction_reference=payment_in.transaction_reference,
        status=PaymentStatus.VERIFIED,
        notes=payment_in.notes
    )
    db.add(payment)

    # Update order financial balance
    order.advance_paid += payment_in.amount
    order.remaining_balance = max(0.0, order.total_amount - order.advance_paid)

    # CRITICAL AUTOMATION RULE:
    # "Installation dispatch must be blocked until the configured minimum payment requirement has been satisfied."
    # If advance requirements met, mark READY_FOR_DISPATCH
    if order.advance_paid >= order.advance_required and order.status in [OrderStatus.CONFIRMED, OrderStatus.PAYMENT_PENDING]:
        order.status = OrderStatus.READY_FOR_DISPATCH

    await db.commit()
    await db.refresh(payment)

    return {
        "id": payment.id,
        "receipt_number": payment.receipt_number,
        "order_id": order.id,
        "order_number": order.order_number,
        "customer_id": order.customer_id,
        "customer_name": order.customer.full_name if order.customer else "",
        "amount": payment.amount,
        "payment_type": payment.payment_type,
        "payment_method": payment.payment_method,
        "transaction_reference": payment.transaction_reference,
        "payment_date": payment.payment_date,
        "status": payment.status,
        "notes": payment.notes
    }
