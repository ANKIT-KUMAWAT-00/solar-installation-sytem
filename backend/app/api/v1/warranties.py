from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.erp_models import Warranty, SerializedEquipment, Customer, Installation, Product, User, WarrantyStatus, UserRole
from app.schemas.erp_schemas import WarrantyOut
from app.services.pdf_generator import PDFGeneratorService

router = APIRouter(prefix="/warranties", tags=["Automatic Warranty Register"])

@router.get("", response_model=List[WarrantyOut])
async def list_warranties(
    status: Optional[WarrantyStatus] = Query(None),
    customer_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Warranty).options(
        selectinload(Warranty.serialized_equipment).selectinload(SerializedEquipment.product),
        selectinload(Warranty.customer),
        selectinload(Warranty.installation)
    )

    if current_user.role == UserRole.CUSTOMER:
        query = query.join(Customer).filter(Customer.email == current_user.email)
    if status:
        query = query.filter(Warranty.status == status)
    if customer_id:
        query = query.filter(Warranty.customer_id == customer_id)
    if search:
        search_fmt = f"%{search}%"
        query = query.join(Customer).filter(
            (Customer.full_name.ilike(search_fmt)) |
            (Customer.phone.ilike(search_fmt)) |
            (Warranty.warranty_code.ilike(search_fmt))
        )

    result = await db.execute(query.order_by(Warranty.id.desc()))
    warranties = result.scalars().all()

    out = []
    for w in warranties:
        out.append({
            "id": w.id,
            "warranty_code": w.warranty_code,
            "serial_number": w.serialized_equipment.serial_number if w.serialized_equipment else "",
            "product_name": w.serialized_equipment.product.name if (w.serialized_equipment and w.serialized_equipment.product) else "Solar Component",
            "customer_id": w.customer_id,
            "customer_name": w.customer.full_name if w.customer else "",
            "customer_phone": w.customer.phone if w.customer else "",
            "installation_code": w.installation.installation_code if w.installation else "",
            "start_date": w.start_date,
            "end_date": w.end_date,
            "duration_years": w.duration_years,
            "status": w.status
        })
    return out

@router.get("/lookup")
async def lookup_warranty(
    query: str = Query(..., description="Serial Number, Customer Phone, or Order ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Instant Warranty Lookup:
    Enables support executive or customer to check exact coverage by entering serial or phone.
    """
    clean_q = query.strip()
    res = await db.execute(
        select(Warranty)
        .options(
            selectinload(Warranty.serialized_equipment).selectinload(SerializedEquipment.product),
            selectinload(Warranty.customer),
            selectinload(Warranty.installation)
        )
        .join(SerializedEquipment)
        .join(Customer)
        .filter(
            (SerializedEquipment.serial_number == clean_q) |
            (Customer.phone == clean_q) |
            (Warranty.warranty_code == clean_q)
        )
    )
    warranties = res.scalars().all()

    if not warranties:
        return {
            "found": False,
            "message": f"No active warranty record found for '{query}'. Please check the serial number.",
            "results": []
        }

    now = datetime.utcnow()
    results = []
    for w in warranties:
        is_active = (w.start_date <= now <= w.end_date)
        days_left = (w.end_date - now).days
        results.append({
            "warranty_code": w.warranty_code,
            "serial_number": w.serialized_equipment.serial_number,
            "product_name": w.serialized_equipment.product.name,
            "customer_name": w.customer.full_name,
            "customer_phone": w.customer.phone,
            "start_date": w.start_date.strftime('%d-%b-%Y'),
            "end_date": w.end_date.strftime('%d-%b-%Y'),
            "duration_years": w.duration_years,
            "is_valid_today": is_active,
            "days_remaining": max(0, days_left),
            "status": w.status.value
        })

    return {
        "found": True,
        "count": len(results),
        "results": results
    }

@router.get("/{id}/certificate")
async def download_warranty_certificate(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(
        select(Warranty)
        .options(
            selectinload(Warranty.serialized_equipment).selectinload(SerializedEquipment.product),
            selectinload(Warranty.customer)
        )
        .filter(Warranty.id == id)
    )
    w = res.scalars().first()
    if not w:
        raise HTTPException(status_code=404, detail="Warranty not found")

    w_dict = {
        "warranty_code": w.warranty_code,
        "serial_number": w.serialized_equipment.serial_number if w.serialized_equipment else "",
        "product_name": w.serialized_equipment.product.name if (w.serialized_equipment and w.serialized_equipment.product) else "Solar Equipment",
        "customer_name": w.customer.full_name if w.customer else "",
        "start_date": w.start_date,
        "end_date": w.end_date,
        "duration_years": w.duration_years
    }
    pdf_bytes = PDFGeneratorService.generate_warranty_certificate_pdf(w_dict)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=SunPower_Warranty_{w.warranty_code}.pdf"}
    )
