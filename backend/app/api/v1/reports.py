import io
import csv
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.erp_models import Order, Customer, Quotation, User
from app.services.profit_engine import ProfitEngine

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])

@router.get("/export-csv")
async def export_csv(
    report_type: str = Query("profitability", description="profitability, orders, inventory"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "profitability":
        writer.writerow(["Order Number", "Customer", "City", "Capacity kW", "System Type", "Revenue (INR)", "Material Cost", "Labour Cost", "Other Cost", "Gross Profit", "Gross Margin %", "Status"])
        jobs = await ProfitEngine.get_job_profitability(db)
        for j in jobs:
            writer.writerow([
                j["order_number"], j["customer_name"], j["city"], j["capacity_kw"],
                j["system_type"], j["revenue_inr"], j["material_cost_inr"],
                j["labour_cost_inr"], j["other_cost_inr"], j["gross_profit_inr"],
                f"{j['gross_margin_pct']}%", j["status"]
            ])
        filename = "SunPower_Job_Profitability_Report.csv"

    else:
        # Default orders report
        writer.writerow(["Order Number", "Customer", "System Type", "Capacity kW", "Total Amount (INR)", "Advance Paid", "Balance", "Status"])
        res = await db.execute(select(Order).options())
        orders = res.scalars().all()
        for o in orders:
            writer.writerow([
                o.order_number, f"Customer #{o.customer_id}", o.system_type.value,
                o.system_capacity_kw, o.total_amount, o.advance_paid, o.remaining_balance, o.status.value
            ])
        filename = "SunPower_Orders_Report.csv"

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
