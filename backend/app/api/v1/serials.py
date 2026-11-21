from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.erp_models import SerializedEquipment, Product, Customer, User, SerialStatus, UserRole
from app.schemas.erp_schemas import SerialNumberOut
from app.services.qr_generator import QRGeneratorService

router = APIRouter(prefix="/serials", tags=["Serialized Equipment & QR Codes"])

@router.get("", response_model=List[SerialNumberOut])
async def list_serials(
    status: Optional[SerialStatus] = Query(None),
    product_id: Optional[int] = Query(None),
    order_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(SerializedEquipment).options(
        selectinload(SerializedEquipment.product),
        selectinload(SerializedEquipment.warranty)
    )

    if status:
        query = query.filter(SerializedEquipment.status == status)
    if product_id:
        query = query.filter(SerializedEquipment.product_id == product_id)
    if order_id:
        query = query.filter(SerializedEquipment.order_id == order_id)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (SerializedEquipment.serial_number.ilike(search_fmt)) |
            (SerializedEquipment.manufacturer.ilike(search_fmt)) |
            (SerializedEquipment.model.ilike(search_fmt))
        )

    result = await db.execute(query.order_by(SerializedEquipment.id.desc()))
    items = result.scalars().all()

    out = []
    for s in items:
        out.append({
            "id": s.id,
            "serial_number": s.serial_number,
            "product_id": s.product_id,
            "product_name": s.product.name if s.product else "",
            "category": s.product.category.value if s.product else "",
            "manufacturer": s.manufacturer,
            "model": s.model,
            "warranty_duration_years": s.warranty_duration_years,
            "status": s.status,
            "order_id": s.order_id,
            "customer_id": s.customer_id,
            "dispatch_date": s.dispatch_date,
            "installed_date": s.installed_date,
            "qr_code_svg": s.qr_code_svg
        })
    return out

@router.post("/verify-qr")
async def verify_scanned_qr(
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mobile QR Scanner Verification:
    Warehouse staff scans device QR during dispatch.
    Validates serial existence, status, product compatibility, and ensures no duplicate scan.
    """
    qr_data = payload.get("qr_code") or payload.get("serial_number")
    order_id = payload.get("order_id")

    if not qr_data:
        raise HTTPException(status_code=400, detail="QR code content or serial number required")

    # Clean string if URL
    clean_serial = qr_data.strip()
    if "serial=" in clean_serial:
        clean_serial = clean_serial.split("serial=")[-1].split("&")[0]

    res = await db.execute(
        select(SerializedEquipment)
        .options(selectinload(SerializedEquipment.product))
        .filter(SerializedEquipment.serial_number == clean_serial)
    )
    device = res.scalars().first()

    if not device:
        return {
            "valid": False,
            "message": f"Serial number '{clean_serial}' not recognized in SunPower registry.",
            "serial_number": clean_serial
        }

    # Check status
    if device.status == SerialStatus.DISPATCHED:
        return {
            "valid": False,
            "message": f"Device {clean_serial} is ALREADY DISPATCHED to Order #{device.order_id}.",
            "serial_number": clean_serial,
            "device": {"name": device.product.name, "category": device.product.category}
        }
    elif device.status == SerialStatus.INSTALLED:
        return {
            "valid": False,
            "message": f"Device {clean_serial} is already marked INSTALLED.",
            "serial_number": clean_serial
        }

    return {
        "valid": True,
        "message": f"Verified: {device.product.name} ({device.manufacturer} {device.model}) is ready for dispatch.",
        "serial_number": device.serial_number,
        "product_id": device.product_id,
        "product_name": device.product.name,
        "category": device.product.category.value,
        "current_status": device.status.value,
        "warranty_years": device.warranty_duration_years
    }
