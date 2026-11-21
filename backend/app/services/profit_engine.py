from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.erp_models import Order, Quotation, ProjectCost, Payment, Customer, Product, Inventory

class ProfitEngine:

    @staticmethod
    async def get_job_profitability(db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Computes accurate job-wise profit and margin for every order.
        """
        orders_res = await db.execute(
            select(Order, Customer, Quotation)
            .join(Customer, Order.customer_id == Customer.id)
            .join(Quotation, Order.quotation_id == Quotation.id)
            .order_by(Order.id.desc())
        )
        rows = orders_res.all()

        job_records = []
        for o, c, q in rows:
            # Get recorded direct costs for this project
            costs_res = await db.execute(
                select(ProjectCost.category, func.sum(ProjectCost.amount_inr))
                .filter(ProjectCost.order_id == o.id)
                .group_by(ProjectCost.category)
            )
            cost_map = dict(costs_res.fetchall())
            
            material_cost = cost_map.get("MATERIAL_BOM", q.hardware_cost * 0.72)
            labour_cost = cost_map.get("TECHNICIAN_LABOUR", q.installation_labour_cost * 0.55)
            other_cost = sum(v for k, v in cost_map.items() if k not in ["MATERIAL_BOM", "TECHNICIAN_LABOUR"])
            if other_cost == 0:
                other_cost = 4500.0  # transport + discom fee baseline

            total_costs = material_cost + labour_cost + other_cost
            revenue = o.total_amount
            gross_profit = round(revenue - total_costs, 2)
            gross_margin_pct = round((gross_profit / max(1.0, revenue)) * 100.0, 1)

            job_records.append({
                "order_id": o.id,
                "order_number": o.order_number,
                "customer_name": c.full_name,
                "city": c.city,
                "capacity_kw": o.system_capacity_kw,
                "system_type": o.system_type.value,
                "revenue_inr": revenue,
                "material_cost_inr": round(material_cost, 2),
                "labour_cost_inr": round(labour_cost, 2),
                "other_cost_inr": round(other_cost, 2),
                "total_cost_inr": round(total_costs, 2),
                "gross_profit_inr": gross_profit,
                "gross_margin_pct": gross_margin_pct,
                "advance_paid_inr": o.advance_paid,
                "remaining_balance_inr": o.remaining_balance,
                "status": o.status.value
            })

        return job_records

    @staticmethod
    async def get_financial_dashboard_metrics(db: AsyncSession) -> Dict[str, Any]:
        """
        High-level business profitability and cash collections.
        """
        jobs = await ProfitEngine.get_job_profitability(db)
        
        total_rev = sum(j["revenue_inr"] for j in jobs)
        total_costs = sum(j["total_cost_inr"] for j in jobs)
        total_profit = sum(j["gross_profit_inr"] for j in jobs)
        avg_margin = round((total_profit / max(1.0, total_rev)) * 100.0, 1)
        total_advances = sum(j["advance_paid_inr"] for j in jobs)
        total_outstanding = sum(j["remaining_balance_inr"] for j in jobs)

        # Inventory valuation
        inv_res = await db.execute(
            select(func.sum(Inventory.physical_quantity * Product.unit_purchase_cost))
            .join(Product, Inventory.product_id == Product.id)
        )
        inv_val = inv_res.scalar() or 0.0

        return {
            "total_revenue_inr": round(total_rev, 2),
            "total_costs_inr": round(total_costs, 2),
            "total_profit_inr": round(total_profit, 2),
            "average_gross_margin_pct": avg_margin,
            "total_advances_collected_inr": round(total_advances, 2),
            "total_outstanding_inr": round(total_outstanding, 2),
            "inventory_valuation_inr": round(inv_val, 2),
            "job_count": len(jobs)
        }
