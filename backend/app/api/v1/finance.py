from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.erp_models import User
from app.services.profit_engine import ProfitEngine

router = APIRouter(prefix="/finance", tags=["Business Profitability & Finance"])

@router.get("/job-profitability")
async def get_job_profitability(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    CRITICAL ERP PROFITABILITY REQUIREMENT:
    Calculates job-wise profitability for every solar installation:
    Project ID | Customer | Capacity | Revenue | Material Cost | Labour Cost | Other Cost | Profit | Margin %
    """
    return await ProfitEngine.get_job_profitability(db)

@router.get("/overview")
async def get_financial_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    metrics = await ProfitEngine.get_financial_dashboard_metrics(db)
    return metrics
