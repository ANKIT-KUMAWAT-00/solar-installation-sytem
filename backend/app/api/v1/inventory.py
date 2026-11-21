from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.erp_models import Product, Inventory, InventoryTransaction, User, ProductCategory, UserRole
from app.schemas.erp_schemas import ProductOut

router = APIRouter(prefix="/inventory", tags=["Warehouse & Inventory"])

@router.get("", response_model=List[ProductOut])
async def list_inventory(
    category: Optional[ProductCategory] = Query(None),
    low_stock_only: bool = Query(False),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Product).options(selectinload(Product.inventory))

    if category:
        query = query.filter(Product.category == category)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_fmt)) |
            (Product.sku.ilike(search_fmt)) |
            (Product.manufacturer.ilike(search_fmt))
        )

    result = await db.execute(query.order_by(Product.category.asc(), Product.name.asc()))
    products = result.scalars().all()

    out = []
    for p in products:
        phys = p.inventory.physical_quantity if p.inventory else 0
        res = p.inventory.reserved_quantity if p.inventory else 0
        avail = p.inventory.available_quantity if p.inventory else 0

        if low_stock_only and avail > p.min_stock_threshold:
            continue

        out.append({
            "id": p.id,
            "sku": p.sku,
            "name": p.name,
            "category": p.category,
            "manufacturer": p.manufacturer,
            "model": p.model,
            "specifications": p.specifications,
            "unit_purchase_cost": p.unit_purchase_cost,
            "selling_price": p.selling_price,
            "warranty_years": p.warranty_years,
            "min_stock_threshold": p.min_stock_threshold,
            "unit": p.unit,
            "physical_quantity": phys,
            "reserved_quantity": res,
            "available_quantity": avail
        })
    return out

@router.post("/adjust")
async def adjust_stock(
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.DIRECTOR]))
):
    """
    Stock in/out / purchase receipt adjustment.
    """
    product_id = payload.get("product_id")
    quantity = payload.get("quantity", 0)
    tx_type = payload.get("transaction_type", "PURCHASE_RECEIPT")
    notes = payload.get("notes", "Warehouse adjustment")

    res = await db.execute(select(Inventory).filter(Inventory.product_id == product_id))
    inv = res.scalars().first()
    if not inv:
        inv = Inventory(product_id=product_id, physical_quantity=0, reserved_quantity=0, available_quantity=0)
        db.add(inv)

    inv.physical_quantity += quantity
    inv.available_quantity = max(0, inv.physical_quantity - inv.reserved_quantity)

    # Log transaction
    db.add(InventoryTransaction(
        product_id=product_id,
        transaction_type=tx_type,
        quantity=quantity,
        notes=notes
    ))

    await db.commit()
    return {
        "status": "success",
        "message": "Stock adjusted successfully",
        "product_id": product_id,
        "new_physical": inv.physical_quantity,
        "new_available": inv.available_quantity
    }
