from typing import Dict, Any, List
from app.models.erp_models import SystemType

class BOMEngine:
    """
    Automated Bill of Materials (BOM) Calculation Engine for SunPower Solutions.
    Standardized configurations for 1 kW, 2 kW, 3 kW, 4 kW, and 5 kW systems.
    """

    @staticmethod
    def get_package_bom_template(system_type: SystemType, capacity_kw: float) -> Dict[str, Any]:
        """
        Dynamically calculates exact components, quantities, purchase costs and selling prices.
        """
        cap = round(capacity_kw, 1)
        panel_count = int(round(cap * 1000 / 540))  # 540W Mono PERC Bifacial Modules
        panel_count = max(2, panel_count)
        
        # 1. Solar Panels
        panel_purchase_unit = 9500.0   # ₹9,500 per 540W panel
        panel_sell_unit = 13500.0

        # 2. Inverter
        is_off_grid = (system_type == SystemType.OFF_GRID)
        if cap <= 1.5:
            inv_name = "SunPower 1.5kW Off-Grid Pure Sine MPPT" if is_off_grid else "Growatt 1.5kW Single Phase On-Grid Inverter"
            inv_cost = 22000.0 if is_off_grid else 18000.0
            inv_sell = 28000.0 if is_off_grid else 24000.0
        elif cap <= 2.5:
            inv_name = "SunPower 2.5kW Off-Grid Hybrid MPPT" if is_off_grid else "Growatt 2.5kW Single Phase On-Grid Inverter"
            inv_cost = 28000.0 if is_off_grid else 24000.0
            inv_sell = 36000.0 if is_off_grid else 31000.0
        elif cap <= 3.5:
            inv_name = "SunPower 3.5kW 48V Off-Grid MPPT" if is_off_grid else "Solis 3.3kW Dual MPPT On-Grid Inverter"
            inv_cost = 38000.0 if is_off_grid else 31000.0
            inv_sell = 48000.0 if is_off_grid else 39000.0
        elif cap <= 4.5:
            inv_name = "SunPower 5kW 48V Off-Grid Hybrid" if is_off_grid else "Solis 4.2kW Dual MPPT On-Grid Inverter"
            inv_cost = 46000.0 if is_off_grid else 36000.0
            inv_sell = 58000.0 if is_off_grid else 46000.0
        else:
            inv_name = "SunPower 5.5kW Off-Grid Hybrid 48V" if is_off_grid else "Growatt 5kW 3-Phase On-Grid Inverter"
            inv_cost = 52000.0 if is_off_grid else 42000.0
            inv_sell = 66000.0 if is_off_grid else 54000.0

        items = [
            {
                "item_name": f"540W Monocrystalline Half-Cut Bifacial Solar Panels ({panel_count} Nos)",
                "category": "SOLAR_PANEL",
                "quantity": panel_count,
                "unit": "Panels",
                "unit_cost": panel_purchase_unit,
                "total_cost": panel_count * panel_purchase_unit,
                "unit_price": panel_sell_unit,
                "total_price": panel_count * panel_sell_unit
            },
            {
                "item_name": inv_name,
                "category": "INVERTER",
                "quantity": 1,
                "unit": "Unit",
                "unit_cost": inv_cost,
                "total_cost": inv_cost,
                "unit_price": inv_sell,
                "total_price": inv_sell
            }
        ]

        # 3. Battery Bank (Only for Off-Grid)
        if is_off_grid:
            battery_count = 1 if cap <= 1.5 else (2 if cap <= 2.5 else (4 if cap <= 4.0 else 4))
            bat_ah = 150 if cap <= 3.5 else 200
            bat_cost = 14500.0 if bat_ah == 150 else 18500.0
            bat_sell = 18500.0 if bat_ah == 150 else 23500.0
            items.append({
                "item_name": f"Solar Tall Tubular C10 Battery {bat_ah}Ah / 12V ({battery_count} Nos)",
                "category": "BATTERY",
                "quantity": battery_count,
                "unit": "Units",
                "unit_cost": bat_cost,
                "total_cost": battery_count * bat_cost,
                "unit_price": bat_sell,
                "total_price": battery_count * bat_sell
            })

        # 4. Mounting Structure
        structure_cost_per_panel = 1400.0
        structure_sell_per_panel = 2200.0
        items.append({
            "item_name": f"Hot Dip Galvanized (GI 80 Micron) Elevated Rooftop Stand",
            "category": "MOUNTING_STRUCTURE",
            "quantity": panel_count,
            "unit": "Module Mounts",
            "unit_cost": structure_cost_per_panel,
            "total_cost": panel_count * structure_cost_per_panel,
            "unit_price": structure_sell_per_panel,
            "total_price": panel_count * structure_sell_per_panel
        })

        # 5. DC & AC Cabling & Protection Switchgear
        cables_cost = round(3500.0 + cap * 1800.0, 2)
        cables_sell = round(5200.0 + cap * 2600.0, 2)
        items.append({
            "item_name": "Solar DC 4mm² UV-Resistant Cable + 3-Core AC Armoured Cable",
            "category": "DC_CABLE",
            "quantity": int(30 + cap * 15),
            "unit": "Meters",
            "unit_cost": round(cables_cost / (30 + cap * 15), 2),
            "total_cost": cables_cost,
            "unit_price": round(cables_sell / (30 + cap * 15), 2),
            "total_price": cables_sell
        })

        # 6. Protection Distribution Boxes & Earthing
        box_cost = 4500.0 + (3000.0 if cap >= 3.0 else 1500.0)
        box_sell = 6800.0 + (4200.0 if cap >= 3.0 else 2200.0)
        items.append({
            "item_name": "ACDB & DCDB IP65 Protection Boxes with Type-II SPD & MCB Disconnects",
            "category": "PROTECTION_SWITCH",
            "quantity": 1,
            "unit": "Set",
            "unit_cost": box_cost,
            "total_cost": box_cost,
            "unit_price": box_sell,
            "total_price": box_sell
        })

        # 7. Chemical Earthing & Lightning Arrester
        earthing_cost = 4800.0
        earthing_sell = 7500.0
        items.append({
            "item_name": "Dual Copper Bonded Chemical Earthing Rods with BFC Compound & ESE Lightning Arrester",
            "category": "EARTHING",
            "quantity": 2,
            "unit": "Sets",
            "unit_cost": 2400.0,
            "total_cost": earthing_cost,
            "unit_price": 3750.0,
            "total_price": earthing_sell
        })

        total_material_cost = sum(i["total_cost"] for i in items)
        total_hardware_sell = sum(i["total_price"] for i in items)
        default_labour = round(8000.0 + cap * 3000.0, 2)

        return {
            "capacity_kw": cap,
            "system_type": system_type,
            "items": items,
            "total_material_cost": round(total_material_cost, 2),
            "total_hardware_sell": round(total_hardware_sell, 2),
            "default_labour_cost": default_labour,
            "suggested_selling_price": round(total_hardware_sell + default_labour, 2)
        }
