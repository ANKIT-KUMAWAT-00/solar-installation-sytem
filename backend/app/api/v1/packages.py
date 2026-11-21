from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.erp_models import ProductPackage, PackageBOM, Product, User, SystemType
from app.schemas.erp_schemas import PackageOut
from app.services.bom_engine import BOMEngine

router = APIRouter(prefix="/packages", tags=["Packages & Bill of Materials (BOM)"])

@router.get("", response_model=List[PackageOut])
async def list_packages(
    system_type: Optional[SystemType] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ProductPackage).options(
        selectinload(ProductPackage.bom_items).selectinload(PackageBOM.product)
    )
    if system_type:
        query = query.filter(ProductPackage.system_type == system_type)

    result = await db.execute(query.order_by(ProductPackage.capacity_kw.asc()))
    packages = result.scalars().all()

    out = []
    for p in packages:
        bom_list = []
        for b in p.bom_items:
            if b.product:
                bom_list.append({
                    "product_id": b.product_id,
                    "product_name": b.product.name,
                    "sku": b.product.sku,
                    "category": b.product.category.value,
                    "quantity": b.quantity,
                    "unit": b.unit,
                    "unit_purchase_cost": b.product.unit_purchase_cost,
                    "total_cost": b.quantity * b.product.unit_purchase_cost
                })

        out.append({
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "system_type": p.system_type,
            "capacity_kw": p.capacity_kw,
            "base_material_cost": p.base_material_cost,
            "default_installation_charge": p.default_installation_charge,
            "selling_price": p.selling_price,
            "description": p.description,
            "bom_items": bom_list
        })
    return out

@router.get("/calculate-bom")
async def calculate_dynamic_bom(
    system_type: SystemType = Query(SystemType.ON_GRID),
    capacity_kw: float = Query(3.0, ge=1.0, le=10.0),
    current_user: User = Depends(get_current_user)
):
    """
    Dynamic Bill of Materials (BOM) calculation endpoint.
    Automatically computes exact panels, inverters, racking, cables, switchgear, and labour.
    """
    bom_data = BOMEngine.get_package_bom_template(system_type, capacity_kw)
    return {
        "status": "success",
        "data": bom_data
    }
