from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.erp_models import Technician, User
from app.schemas.erp_schemas import TechnicianOut

router = APIRouter(prefix="/technicians", tags=["Technicians & Team Management"])

@router.get("", response_model=List[TechnicianOut])
async def list_technicians(
    available_only: bool = Query(False),
    region: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Technician)
    if available_only:
        query = query.filter(Technician.is_available == True)
    if region:
        query = query.filter(Technician.assigned_region == region)

    result = await db.execute(query.order_by(Technician.id.asc()))
    return result.scalars().all()
