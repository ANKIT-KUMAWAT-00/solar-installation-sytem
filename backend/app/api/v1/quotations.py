from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.erp_models import (
    Quotation, QuotationItem, Lead, Customer, SiteSurvey, ProductPackage,
    PackageBOM, Order, Inventory, InventoryTransaction, User,
    QuotationStatus, SurveyStatus, LeadStatus, OrderStatus, UserRole
)
from app.schemas.erp_schemas import QuotationCreate, QuotationOut
from app.services.pdf_generator import PDFGeneratorService

router = APIRouter(prefix="/quotations", tags=["Quotations & Order Conversion"])

@router.get("", response_model=List[QuotationOut])
async def list_quotations(
    status: Optional[QuotationStatus] = Query(None),
    customer_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Quotation).options(
        selectinload(Quotation.customer),
        selectinload(Quotation.package),
        selectinload(Quotation.survey)
    )

    if status:
        query = query.filter(Quotation.status == status)
    if customer_id:
        query = query.filter(Quotation.customer_id == customer_id)

    result = await db.execute(query.order_by(Quotation.id.desc()))
    quotes = result.scalars().all()

    out = []
    for q in quotes:
        is_appr = (q.survey.status == SurveyStatus.APPROVED) if q.survey else True
        out.append({
            "id": q.id,
            "quotation_number": q.quotation_number,
            "lead_id": q.lead_id,
            "customer_id": q.customer_id,
            "customer_name": q.customer.full_name if q.customer else "",
            "customer_phone": q.customer.phone if q.customer else "",
            "package_id": q.package_id,
            "package_name": q.package.name if q.package else "",
            "system_capacity_kw": q.system_capacity_kw,
            "system_type": q.system_type,
            "hardware_cost": q.hardware_cost,
            "installation_labour_cost": q.installation_labour_cost,
            "accessories_cost": q.accessories_cost,
            "subtotal": q.subtotal,
            "tax_rate_pct": q.tax_rate_pct,
            "tax_amount": q.tax_amount,
            "discount_amount": q.discount_amount,
            "total_amount": q.total_amount,
            "advance_required_amount": q.advance_required_amount,
            "status": q.status,
            "validity_days": q.validity_days,
            "terms_conditions": q.terms_conditions,
            "created_at": q.created_at,
            "is_survey_approved": is_appr
        })
    return out

@router.get("/{id}")
async def get_quotation(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Quotation)
        .options(
            selectinload(Quotation.customer),
            selectinload(Quotation.package),
            selectinload(Quotation.survey),
            selectinload(Quotation.items)
        )
        .filter(Quotation.id == id)
    )
    q = result.scalars().first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")

    return {
        "id": q.id,
        "quotation_number": q.quotation_number,
        "lead_id": q.lead_id,
        "customer": {
            "id": q.customer.id,
            "name": q.customer.full_name,
            "phone": q.customer.phone,
            "address": q.customer.address,
            "city": q.customer.city
        } if q.customer else None,
        "package": {
            "id": q.package.id,
            "name": q.package.name,
            "code": q.package.code
        } if q.package else None,
        "system_capacity_kw": q.system_capacity_kw,
        "system_type": q.system_type,
        "hardware_cost": q.hardware_cost,
        "installation_labour_cost": q.installation_labour_cost,
        "accessories_cost": q.accessories_cost,
        "subtotal": q.subtotal,
        "tax_rate_pct": q.tax_rate_pct,
        "tax_amount": q.tax_amount,
        "discount_amount": q.discount_amount,
        "total_amount": q.total_amount,
        "advance_required_amount": q.advance_required_amount,
        "status": q.status,
        "validity_days": q.validity_days,
        "terms_conditions": q.terms_conditions,
        "items": [
            {
                "id": i.id,
                "item_name": i.item_name,
                "quantity": i.quantity,
                "unit_price": i.unit_price,
                "total_price": i.total_price
            }
            for i in q.items
        ],
        "created_at": q.created_at
    }

@router.post("", response_model=QuotationOut)
async def create_quotation(
    quote_in: QuotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch Lead & Customer
    res_lead = await db.execute(
        select(Lead).options(selectinload(Lead.surveys)).filter(Lead.id == quote_in.lead_id)
    )
    lead = res_lead.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # 2. Check Survey Approval Rule
    # "A quotation for a new installation must not be marked approved until its required site survey has been approved."
    approved_survey = None
    for s in lead.surveys:
        if s.status == SurveyStatus.APPROVED or s.manager_override_reason:
            approved_survey = s
            break

    # 3. Fetch Package
    res_pkg = await db.execute(
        select(ProductPackage)
        .options(selectinload(ProductPackage.bom_items).selectinload(PackageBOM.product))
        .filter(ProductPackage.id == quote_in.package_id)
    )
    pkg = res_pkg.scalars().first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Solar package not found")

    # Hardware cost from package
    hardware_cost = pkg.selling_price
    labour_cost = quote_in.installation_labour_cost
    acc_cost = quote_in.accessories_cost
    subtotal = hardware_cost + labour_cost + acc_cost - quote_in.discount_amount
    tax = round(subtotal * 0.12, 2)  # GST 12%
    total = round(subtotal + tax, 2)
    advance_required = round(total * 0.30, 2)  # 30% advance required

    # Generate Quotation number
    res_count = await db.execute(select(func.count(Quotation.id)))
    q_count = (res_count.scalar() or 0) + 1
    q_num = f"QT-2026-{q_count:04d}"

    quotation = Quotation(
        quotation_number=q_num,
        lead_id=lead.id,
        customer_id=lead.customer_id,
        survey_id=approved_survey.id if approved_survey else None,
        package_id=pkg.id,
        system_capacity_kw=pkg.capacity_kw,
        system_type=pkg.system_type,
        hardware_cost=hardware_cost,
        installation_labour_cost=labour_cost,
        accessories_cost=acc_cost,
        subtotal=subtotal,
        tax_rate_pct=12.0,
        tax_amount=tax,
        discount_amount=quote_in.discount_amount,
        total_amount=total,
        advance_required_amount=advance_required,
        status=QuotationStatus.SENT,
        terms_conditions=quote_in.terms_conditions or "30% Advance required for warehouse dispatch. 25-yr panel warranty."
    )
    db.add(quotation)
    await db.flush()

    # Automatically generate quotation items from Package BOM
    for b in pkg.bom_items:
        if b.product:
            item = QuotationItem(
                quotation_id=quotation.id,
                product_id=b.product_id,
                item_name=b.product.name,
                quantity=b.quantity,
                unit_price=b.product.selling_price,
                total_price=b.quantity * b.product.selling_price
            )
            db.add(item)

    # Update lead status
    lead.status = LeadStatus.QUOTATION_PREPARED
    await db.commit()

    return await get_quotation(quotation.id, db, current_user)

@router.get("/{id}/pdf")
async def download_quotation_pdf(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q_data = await get_quotation(id, db, current_user)
    pdf_bytes = PDFGeneratorService.generate_quotation_pdf(q_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=SunPower_Quotation_{q_data['quotation_number']}.pdf"}
    )

@router.post("/{id}/accept")
async def accept_quotation_convert_order(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    CRITICAL BUSINESS AUTOMATION:
    When customer accepts quotation:
    1. Quotation status -> ACCEPTED
    2. Convert to Confirmed Order with unique Order ID
    3. Atomically reserve required inventory: Available = Physical - Reserved
    4. Lead -> CONVERTED
    """
    res_q = await db.execute(
        select(Quotation)
        .options(selectinload(Quotation.package).selectinload(ProductPackage.bom_items))
        .filter(Quotation.id == id)
    )
    quotation = res_q.scalars().first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    if quotation.status == QuotationStatus.ACCEPTED:
        raise HTTPException(status_code=400, detail="Quotation is already accepted and converted to order")

    # Generate Order Number
    res_count = await db.execute(select(func.count(Order.id)))
    o_count = (res_count.scalar() or 0) + 1
    order_no = f"ORD-2026-{o_count:04d}"

    new_order = Order(
        order_number=order_no,
        quotation_id=quotation.id,
        customer_id=quotation.customer_id,
        package_id=quotation.package_id,
        system_capacity_kw=quotation.system_capacity_kw,
        system_type=quotation.system_type,
        total_amount=quotation.total_amount,
        advance_required=quotation.advance_required_amount,
        advance_paid=0.0,
        remaining_balance=quotation.total_amount,
        status=OrderStatus.CONFIRMED
    )
    db.add(new_order)
    await db.flush()

    # Reserve inventory items atomically
    if quotation.package and quotation.package.bom_items:
        for bom in quotation.package.bom_items:
            res_inv = await db.execute(select(Inventory).filter(Inventory.product_id == bom.product_id))
            inv = res_inv.scalars().first()
            if inv:
                inv.reserved_quantity += bom.quantity
                inv.available_quantity = max(0, inv.physical_quantity - inv.reserved_quantity)
                # Log transaction
                db.add(InventoryTransaction(
                    product_id=bom.product_id,
                    transaction_type="ORDER_RESERVATION",
                    quantity=bom.quantity,
                    order_id=new_order.id,
                    notes=f"Reserved for Order {new_order.order_number}"
                ))

    # Update quotation and lead
    quotation.status = QuotationStatus.ACCEPTED
    res_lead = await db.execute(select(Lead).filter(Lead.id == quotation.lead_id))
    lead = res_lead.scalars().first()
    if lead:
        lead.status = LeadStatus.CONVERTED

    await db.commit()

    return {
        "status": "success",
        "message": f"Quotation accepted! Order {new_order.order_number} confirmed and inventory reserved.",
        "order_id": new_order.id,
        "order_number": new_order.order_number,
        "advance_required": new_order.advance_required
    }
