import asyncio
from datetime import datetime, timedelta
import random
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.erp_models import (
    User, Customer, Lead, SiteSurvey, SurveyPhoto, Product, Inventory,
    InventoryTransaction, ProductPackage, PackageBOM, Quotation, QuotationItem,
    Order, Payment, SerializedEquipment, Dispatch, DispatchItem,
    Technician, Installation, InstallationTask, InstallationPhoto,
    TechnicianAssignment, Warranty, WarrantyClaim, ServiceTicket,
    SubsidyApplication, SubsidyDocument, ProjectCost, Notification,
    UserRole, CustomerCategory, SystemType, LeadSource, LeadStatus,
    SurveyStatus, ProductCategory, QuotationStatus, OrderStatus,
    PaymentMethod, PaymentType, PaymentStatus, SerialStatus, WarrantyStatus,
    InstallationStatus, TicketStatus, SubsidyStatus, PriorityLevel
)
from app.services.qr_generator import QRGeneratorService

async def seed_erp_database():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).filter(User.email == "director@sunpower.com"))
        if res.scalars().first():
            print("SunPower Solutions ERP database is already seeded.")
            return

        print("Seeding SunPower Solutions Enterprise Solar ERP database...")

        # 1. Users across all 10 ERP roles
        users_data = [
            User(email="director@sunpower.com", hashed_password=get_password_hash("SunPower2026!"), full_name="Rajesh Sharma (Director)", role=UserRole.DIRECTOR, phone="+91 98200 11111"),
            User(email="admin@sunpower.com", hashed_password=get_password_hash("SunPower2026!"), full_name="System Administrator", role=UserRole.ADMIN, phone="+91 98200 22222"),
            User(email="sales@sunpower.com", hashed_password=get_password_hash("SunPower2026!"), full_name="Amit Verma (Sales Head)", role=UserRole.SALES_EXECUTIVE, phone="+91 98200 33333"),
            User(email="survey@sunpower.com", hashed_password=get_password_hash("SunPower2026!"), full_name="Vikas Patil (Survey Engineer)", role=UserRole.SURVEY_TECHNICIAN, phone="+91 98200 44444"),
            User(email="warehouse@sunpower.com", hashed_password=get_password_hash("SunPower2026!"), full_name="Sanjay Kulkarni (Warehouse Mgr)", role=UserRole.WAREHOUSE_MANAGER, phone="+91 98200 55555"),
            User(email="install@sunpower.com", hashed_password=get_password_hash("SunPower2026!"), full_name="Mahesh Deshmukh (Install Mgr)", role=UserRole.INSTALLATION_MANAGER, phone="+91 98200 66666"),
            User(email="tech@sunpower.com", hashed_password=get_password_hash("SunPower2026!"), full_name="Ramesh Yadav (Lead Technician)", role=UserRole.FIELD_TECHNICIAN, phone="+91 98200 77777"),
            User(email="finance@sunpower.com", hashed_password=get_password_hash("SunPower2026!"), full_name="Pooja Mehta (Finance Head)", role=UserRole.FINANCE_EXECUTIVE, phone="+91 98200 88888"),
            User(email="support@sunpower.com", hashed_password=get_password_hash("SunPower2026!"), full_name="Kavita Nair (Support Desk)", role=UserRole.SUPPORT_EXECUTIVE, phone="+91 98200 99999"),
            User(email="customer@sunpower.com", hashed_password=get_password_hash("SunPower2026!"), full_name="Dr. Anil Joshi (Customer)", role=UserRole.CUSTOMER, phone="+91 98199 12345")
        ]
        db.add_all(users_data)
        await db.flush()

        # 2. 15 Field Technicians
        tech_names = [
            ("Ramesh Yadav", "Master Solar Electrician", "Pune City"),
            ("Ganesh Shinde", "Structural GI Stand Specialist", "Pune West"),
            ("Sachin Pawar", "AC/DC Inverter Wiring Expert", "Pune East"),
            ("Nitin More", "Earthing & Safety Inspector", "Pimpri-Chinchwad"),
            ("Sunil Jadhav", "Commissioning & Testing Lead", "Pune North"),
            ("Pravin Gaikwad", "Solar Module Mounting Lead", "Pune South"),
            ("Ajay Kamble", "High Voltage Interconnection", "Hadapsar"),
            ("Santosh Bhosale", "Battery Storage Specialist", "Kothrud"),
            ("Dipak Salunke", "Solar Cable Routing Technician", "Baner"),
            ("Vijay Thorat", "Field Service & Maintenance", "Wakad"),
            ("Aniket Mane", "Shadow Survey & SunEye Tech", "Viman Nagar"),
            ("Amol Shinde", "Inverter Firmware Diagnostics", "Hinjewadi"),
            ("Prashant Kadam", "Civil & Waterproofing Lead", "Kalyani Nagar"),
            ("Rahul Chavan", "Net Metering Liaison Tech", "Aundh"),
            ("Kiran Jagtap", "Field Apprentice & QC Helper", "Camp District")
        ]
        technicians = []
        for idx, (t_name, t_skill, t_reg) in enumerate(tech_names):
            emp_id = f"TECH-2026-{idx+1:03d}"
            t = Technician(
                employee_id=emp_id,
                name=t_name,
                phone=f"+91 9820{idx:02d} {1000+idx}",
                email=f"{t_name.lower().replace(' ', '.')}@sunpower.com",
                skills=t_skill,
                assigned_region=t_reg,
                is_available=True,
                active_jobs_count=random.randint(1, 3)
            )
            technicians.append(t)
        db.add_all(technicians)
        await db.flush()

        # 3. Products
        products_data = [
            Product(sku="MOD-WAAR-540", name="Waaree 540W Mono PERC Bifacial Solar Panel", category=ProductCategory.SOLAR_PANEL, manufacturer="Waaree Energies", model="WXS-540", unit_purchase_cost=9500.0, selling_price=13500.0, warranty_years=25, min_stock_threshold=20, specifications={"wattage": 540, "bifacial": True, "efficiency": 21.2}),
            Product(sku="MOD-ADAN-545", name="Adani 545W Mono PERC Half-Cut Module", category=ProductCategory.SOLAR_PANEL, manufacturer="Adani Solar", model="Elan-545", unit_purchase_cost=9600.0, selling_price=13800.0, warranty_years=25, min_stock_threshold=20, specifications={"wattage": 545, "bifacial": True}),
            Product(sku="INV-GROW-3K", name="Growatt 3kW Single Phase On-Grid Inverter", category=ProductCategory.INVERTER, manufacturer="Growatt", model="MIN 3000TL-X", unit_purchase_cost=29000.0, selling_price=38000.0, warranty_years=5, min_stock_threshold=6, specifications={"rated_kw": 3.0, "mppt_count": 2, "wifi": True}),
            Product(sku="INV-GROW-5K", name="Growatt 5kW 3-Phase On-Grid Inverter", category=ProductCategory.INVERTER, manufacturer="Growatt", model="MOD 5000TL3-X", unit_purchase_cost=42000.0, selling_price=54000.0, warranty_years=5, min_stock_threshold=4, specifications={"rated_kw": 5.0, "phases": 3}),
            Product(sku="INV-HYBR-3K", name="SunPower 3.5kW 48V Off-Grid Hybrid MPPT Inverter", category=ProductCategory.INVERTER, manufacturer="SunPower", model="SP-HYB-3500", unit_purchase_cost=38000.0, selling_price=49000.0, warranty_years=3, min_stock_threshold=4, specifications={"rated_kw": 3.5, "battery_v": 48}),
            Product(sku="BAT-EXID-150", name="Exide Solar C10 Tall Tubular Battery 150Ah / 12V", category=ProductCategory.BATTERY, manufacturer="Exide", model="6LMS150", unit_purchase_cost=14500.0, selling_price=18500.0, warranty_years=3, min_stock_threshold=8, specifications={"capacity_ah": 150, "voltage_v": 12}),
            Product(sku="BAT-LUMI-200", name="Luminous Solar C10 Tubular Battery 200Ah / 12V", category=ProductCategory.BATTERY, manufacturer="Luminous", model="LPT12200", unit_purchase_cost=18500.0, selling_price=23500.0, warranty_years=3, min_stock_threshold=6, specifications={"capacity_ah": 200, "voltage_v": 12}),
            Product(sku="RACK-GI-ELEV", name="Hot-Dip Galvanized (GI 80u) Elevated Module Stand", category=ProductCategory.MOUNTING_STRUCTURE, manufacturer="SunPower Racking", model="GI-80U-ELEV", unit_purchase_cost=1400.0, selling_price=2200.0, warranty_years=15, min_stock_threshold=40, specifications={"wind_rating_kmh": 150, "tilt_deg": 15}),
            Product(sku="CABLE-DC-4MM", name="Solar DC 4mm² UV Resistant Copper Cable (100m Drum)", category=ProductCategory.DC_CABLE, manufacturer="Polycab", model="SolarX-4MM", unit_purchase_cost=3600.0, selling_price=5200.0, warranty_years=25, min_stock_threshold=15, specifications={"size_sqmm": 4, "voltage_rating_v": 1500}),
            Product(sku="BOX-ACDC-PRO", name="IP65 ACDB & DCDB Box Set with Type-II SPD & MCB", category=ProductCategory.PROTECTION_SWITCH, manufacturer="Schneider/Havells", model="PRO-BOX-SET", unit_purchase_cost=5500.0, selling_price=7800.0, warranty_years=5, min_stock_threshold=10, specifications={"spd_type": "Type II", "ip_rating": "IP65"}),
            Product(sku="EARTH-CHEM-SET", name="Dual Copper-Bonded Chemical Earthing Rods + BFC", category=ProductCategory.EARTHING, manufacturer="Ashlok", model="SafeEarth-CHEM", unit_purchase_cost=4200.0, selling_price=6500.0, warranty_years=10, min_stock_threshold=12, specifications={"rods": 2, "resistance_target": "<5 Ohms"})
        ]
        db.add_all(products_data)
        await db.flush()

        # 4. Inventory records (Physical, Reserved, Available)
        for idx, prod in enumerate(products_data):
            phys = random.randint(45, 120) if prod.category == ProductCategory.SOLAR_PANEL else random.randint(15, 35)
            reserved = random.randint(6, 18)
            db.add(Inventory(
                product_id=prod.id,
                physical_quantity=phys,
                reserved_quantity=reserved,
                available_quantity=phys - reserved
            ))
        await db.flush()

        # 5. Predefined Solar Packages
        packages = [
            ProductPackage(code="ON_GRID_1KW", name="SunPower 1 kW On-Grid Rooftop System", system_type=SystemType.ON_GRID, capacity_kw=1.0, base_material_cost=45000.0, default_installation_charge=10000.0, selling_price=68000.0, description="Compact 1 kW On-Grid system for small homes (Generates ~4 units/day)."),
            ProductPackage(code="ON_GRID_2KW", name="SunPower 2 kW On-Grid Rooftop System", system_type=SystemType.ON_GRID, capacity_kw=2.0, base_material_cost=78000.0, default_installation_charge=14000.0, selling_price=118000.0, description="2 kW On-Grid system with Growatt Inverter (Generates ~8 units/day)."),
            ProductPackage(code="ON_GRID_3KW", name="SunPower 3 kW On-Grid Rooftop System (PM Surya Ghar)", system_type=SystemType.ON_GRID, capacity_kw=3.0, base_material_cost=112000.0, default_installation_charge=18000.0, selling_price=168000.0, description="Our most popular 3 kW residential system eligible for ₹78,000 PM Surya Ghar subsidy!"),
            ProductPackage(code="ON_GRID_4KW", name="SunPower 4 kW On-Grid Rooftop System", system_type=SystemType.ON_GRID, capacity_kw=4.0, base_material_cost=148000.0, default_installation_charge=22000.0, selling_price=220000.0, description="4 kW On-Grid system for medium to large villas (Generates ~16 units/day)."),
            ProductPackage(code="ON_GRID_5KW", name="SunPower 5 kW On-Grid Rooftop System", system_type=SystemType.ON_GRID, capacity_kw=5.0, base_material_cost=185000.0, default_installation_charge=26000.0, selling_price=275000.0, description="5 kW 3-Phase On-Grid system for high electricity consumption homes & offices."),
            ProductPackage(code="OFF_GRID_1KW", name="SunPower 1 kW Off-Grid Battery System", system_type=SystemType.OFF_GRID, capacity_kw=1.0, base_material_cost=62000.0, default_installation_charge=12000.0, selling_price=92000.0, description="1 kW Off-Grid with 1x 150Ah Battery for zero-grid areas."),
            ProductPackage(code="OFF_GRID_3KW", name="SunPower 3 kW Off-Grid Hybrid Battery System", system_type=SystemType.OFF_GRID, capacity_kw=3.0, base_material_cost=165000.0, default_installation_charge=20000.0, selling_price=235000.0, description="3 kW Off-Grid with 4x 150Ah Tubular Battery bank (48V) for 100% power backup."),
            ProductPackage(code="OFF_GRID_5KW", name="SunPower 5 kW Off-Grid Heavy Duty System", system_type=SystemType.OFF_GRID, capacity_kw=5.0, base_material_cost=26000.0, default_installation_charge=28000.0, selling_price=365000.0, description="5 kW Off-Grid with 4x 200Ah Battery bank for commercial establishments.")
        ]
        db.add_all(packages)
        await db.flush()

        # Link Package BOM for 3 kW On-Grid (Package index 2)
        pkg_3kw = packages[2]
        db.add(PackageBOM(package_id=pkg_3kw.id, product_id=products_data[0].id, quantity=6, unit="Panels")) # 6x 540W = 3.24 kWp
        db.add(PackageBOM(package_id=pkg_3kw.id, product_id=products_data[2].id, quantity=1, unit="Unit"))   # 3kW Inverter
        db.add(PackageBOM(package_id=pkg_3kw.id, product_id=products_data[7].id, quantity=6, unit="Stands")) # 6x GI Stands
        db.add(PackageBOM(package_id=pkg_3kw.id, product_id=products_data[8].id, quantity=1, unit="Drum"))   # Cable
        db.add(PackageBOM(package_id=pkg_3kw.id, product_id=products_data[9].id, quantity=1, unit="Set"))    # ACDB/DCDB
        db.add(PackageBOM(package_id=pkg_3kw.id, product_id=products_data[10].id, quantity=2, unit="Sets")) # Chemical Earthing
        await db.flush()

        # 6. Serialized Equipment with QR Codes
        serials_list = []
        for i in range(1, 26):
            s_no = f"INV-GROW-2026-{1000+i}"
            qr_data = f"https://sunpower.energy/verify?serial={s_no}"
            qr_svg = QRGeneratorService.generate_qr_svg(qr_data)
            serials_list.append(SerializedEquipment(
                serial_number=s_no,
                product_id=products_data[2].id,
                manufacturer="Growatt",
                model="MIN 3000TL-X",
                warranty_duration_years=5,
                status=SerialStatus.IN_WAREHOUSE,
                qr_code_svg=qr_svg
            ))

        for i in range(1, 41):
            s_no = f"PANEL-WAAR-2026-{5000+i}"
            qr_data = f"https://sunpower.energy/verify?serial={s_no}"
            qr_svg = QRGeneratorService.generate_qr_svg(qr_data)
            serials_list.append(SerializedEquipment(
                serial_number=s_no,
                product_id=products_data[0].id,
                manufacturer="Waaree",
                model="WXS-540",
                warranty_duration_years=25,
                status=SerialStatus.IN_WAREHOUSE,
                qr_code_svg=qr_svg
            ))
        db.add_all(serials_list)
        await db.flush()

        # 7. Customers across Maharashtra
        customers = [
            Customer(customer_code="CUST-0001", full_name="Dr. Anil Joshi", phone="+91 98199 12345", email="anil.joshi@gmail.com", address="Bungalow 14, Prabhat Road", city="Pune", state="Maharashtra", postal_code="411004", avg_monthly_bill_inr=5200.0, roof_area_sqft=650.0, roof_type="RCC Flat Concrete"),
            Customer(customer_code="CUST-0002", full_name="Smt. Meera Deshpande", phone="+91 98199 23456", email="meera.d@yahoo.com", address="Flat 402, Rohan Tarang, Wakad", city="Pune", state="Maharashtra", postal_code="411057", avg_monthly_bill_inr=3400.0, roof_area_sqft=420.0, roof_type="RCC Flat"),
            Customer(customer_code="CUST-0003", full_name="Vikramaditya Solanki", phone="+91 98199 34567", email="v.solanki@solankigroup.in", address="Solanki Agro Cold Storage, MIDC", city="Baramati", state="Maharashtra", postal_code="413133", avg_monthly_bill_inr=28500.0, roof_area_sqft=3200.0, customer_category=CustomerCategory.COMMERCIAL, roof_type="Tin Metal Shed"),
            Customer(customer_code="CUST-0004", full_name="Arjun Rao Patil", phone="+91 98199 45678", email="arjun.patil@rediffmail.com", address="Row House 7, Nyati Estate, Mohammadwadi", city="Pune", state="Maharashtra", postal_code="411060", avg_monthly_bill_inr=4800.0, roof_area_sqft=550.0, roof_type="RCC Flat Concrete"),
            Customer(customer_code="CUST-0005", full_name="Pooja & Sachin Agarwal", phone="+91 98199 56789", email="agarwal.sachin@outlook.com", address="Villa 22, Lodha Belmondo", city="Pune", state="Maharashtra", postal_code="412101", avg_monthly_bill_inr=8200.0, roof_area_sqft=1100.0, roof_type="Tile Pitched & RCC"),
            Customer(customer_code="CUST-0006", full_name="Nikhil Sawant", phone="+91 98199 67890", email="nikhil.sawant@techfirm.co", address="303 Shantiniketan, Baner Pashan Link Rd", city="Pune", state="Maharashtra", postal_code="411045", avg_monthly_bill_inr=3100.0, roof_area_sqft=380.0, roof_type="RCC Flat Concrete"),
            Customer(customer_code="CUST-0007", full_name="Omkar Enterprises (Kishore Jain)", phone="+91 98199 78901", email="kishore@omkarenterprises.net", address="Gala 18, Electronic Zone, Bhosari MIDC", city="Pimpri-Chinchwad", state="Maharashtra", postal_code="411026", avg_monthly_bill_inr=19500.0, roof_area_sqft=1800.0, customer_category=CustomerCategory.INDUSTRIAL, roof_type="Industrial Metal Sheet"),
            Customer(customer_code="CUST-0008", full_name="Col. R.K. Nair (Retd.)", phone="+91 98199 89012", email="rknair.retd@gmail.com", address="5 Defense Enclave, Wanowrie", city="Pune", state="Maharashtra", postal_code="411040", avg_monthly_bill_inr=4200.0, roof_area_sqft=600.0, roof_type="RCC Flat Concrete")
        ]
        db.add_all(customers)
        await db.flush()

        # 8. Leads & Pipeline
        now = datetime.utcnow()
        leads = [
            Lead(enquiry_number="ENQ-2026-0001", customer_id=customers[0].id, requested_capacity_kw=3.0, preferred_system_type=SystemType.ON_GRID, subsidy_required=True, lead_source=LeadSource.WEBSITE, status=LeadStatus.CONVERTED, priority=PriorityLevel.HIGH, contact_notes="Customer wants PM Surya Ghar subsidy benefit."),
            Lead(enquiry_number="ENQ-2026-0002", customer_id=customers[1].id, requested_capacity_kw=2.0, preferred_system_type=SystemType.ON_GRID, subsidy_required=True, lead_source=LeadSource.WHATSAPP, status=LeadStatus.CONVERTED, priority=PriorityLevel.MEDIUM, contact_notes="Apartment terrace area approved by society."),
            Lead(enquiry_number="ENQ-2026-0003", customer_id=customers[2].id, requested_capacity_kw=5.0, preferred_system_type=SystemType.OFF_GRID, subsidy_required=False, lead_source=LeadSource.PHONE, status=LeadStatus.CONVERTED, priority=PriorityLevel.HIGH, contact_notes="Cold storage needs hybrid battery backup."),
            Lead(enquiry_number="ENQ-2026-0004", customer_id=customers[3].id, requested_capacity_kw=3.0, preferred_system_type=SystemType.ON_GRID, subsidy_required=True, lead_source=LeadSource.REFERRAL, status=LeadStatus.QUOTATION_PREPARED, priority=PriorityLevel.HIGH, contact_notes="Site survey approved. Quotation under review."),
            Lead(enquiry_number="ENQ-2026-0005", customer_id=customers[4].id, requested_capacity_kw=5.0, preferred_system_type=SystemType.ON_GRID, subsidy_required=True, lead_source=LeadSource.WEBSITE, status=LeadStatus.SURVEY_SCHEDULED, priority=PriorityLevel.HIGH, contact_notes="Large villa, survey scheduled for Saturday."),
            Lead(enquiry_number="ENQ-2026-0006", customer_id=customers[5].id, requested_capacity_kw=3.0, preferred_system_type=SystemType.ON_GRID, subsidy_required=True, lead_source=LeadSource.WEBSITE, status=LeadStatus.NEW, priority=PriorityLevel.MEDIUM, contact_notes="Submitted via website enquiry form."),
            Lead(enquiry_number="ENQ-2026-0007", customer_id=customers[6].id, requested_capacity_kw=5.0, preferred_system_type=SystemType.ON_GRID, subsidy_required=False, lead_source=LeadSource.PHONE, status=LeadStatus.QUALIFIED, priority=PriorityLevel.HIGH, contact_notes="Commercial meter 3-phase connection verified.")
        ]
        db.add_all(leads)
        await db.flush()

        # 9. Site Surveys
        surveys = [
            SiteSurvey(survey_number="SRV-2026-0001", lead_id=leads[0].id, customer_id=customers[0].id, assigned_technician_id=technicians[0].id, visit_date=now - timedelta(days=25), roof_dimensions="12m x 8m", shadow_free_area_sqft=550.0, roof_direction="South-15-West", roof_tilt_deg=12.0, recommended_capacity_kw=3.0, status=SurveyStatus.APPROVED, approved_at=now - timedelta(days=24)),
            SiteSurvey(survey_number="SRV-2026-0002", lead_id=leads[1].id, customer_id=customers[1].id, assigned_technician_id=technicians[1].id, visit_date=now - timedelta(days=20), roof_dimensions="8m x 6m", shadow_free_area_sqft=380.0, roof_direction="South", roof_tilt_deg=15.0, recommended_capacity_kw=2.0, status=SurveyStatus.APPROVED, approved_at=now - timedelta(days=19)),
            SiteSurvey(survey_number="SRV-2026-0003", lead_id=leads[2].id, customer_id=customers[2].id, assigned_technician_id=technicians[2].id, visit_date=now - timedelta(days=18), roof_dimensions="25m x 15m", shadow_free_area_sqft=2200.0, roof_direction="South", roof_tilt_deg=10.0, recommended_capacity_kw=5.0, status=SurveyStatus.APPROVED, approved_at=now - timedelta(days=17)),
            SiteSurvey(survey_number="SRV-2026-0004", lead_id=leads[3].id, customer_id=customers[3].id, assigned_technician_id=technicians[3].id, visit_date=now - timedelta(days=5), roof_dimensions="11m x 7m", shadow_free_area_sqft=490.0, roof_direction="South", roof_tilt_deg=14.0, recommended_capacity_kw=3.0, status=SurveyStatus.APPROVED, approved_at=now - timedelta(days=4)),
            SiteSurvey(survey_number="SRV-2026-0005", lead_id=leads[4].id, customer_id=customers[4].id, assigned_technician_id=technicians[4].id, visit_date=now + timedelta(days=2), roof_dimensions="Pending Survey Visit", shadow_free_area_sqft=0.0, status=SurveyStatus.SCHEDULED)
        ]
        db.add_all(surveys)
        await db.flush()

        # Add Survey Photos
        db.add(SurveyPhoto(survey_id=surveys[0].id, photo_type="ROOFTOP_VIEW", photo_url="https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=600", caption="RCC Flat Rooftop South Facing"))
        db.add(SurveyPhoto(survey_id=surveys[0].id, photo_type="ELECTRICAL_PANEL", photo_url="https://images.unsplash.com/photo-1544717305-2782549b5136?w=600", caption="Main Service Panel & Breakers"))
        await db.flush()

        # 10. Quotations
        quotes = [
            Quotation(quotation_number="QT-2026-0001", lead_id=leads[0].id, customer_id=customers[0].id, survey_id=surveys[0].id, package_id=packages[2].id, system_capacity_kw=3.0, system_type=SystemType.ON_GRID, hardware_cost=168000.0, installation_labour_cost=18000.0, accessories_cost=8000.0, subtotal=194000.0, tax_rate_pct=12.0, tax_amount=23280.0, total_amount=217280.0, advance_required_amount=65184.0, status=QuotationStatus.ACCEPTED),
            Quotation(quotation_number="QT-2026-0002", lead_id=leads[1].id, customer_id=customers[1].id, survey_id=surveys[1].id, package_id=packages[1].id, system_capacity_kw=2.0, system_type=SystemType.ON_GRID, hardware_cost=118000.0, installation_labour_cost=14000.0, accessories_cost=6000.0, subtotal=138000.0, tax_rate_pct=12.0, tax_amount=16560.0, total_amount=154560.0, advance_required_amount=46368.0, status=QuotationStatus.ACCEPTED),
            Quotation(quotation_number="QT-2026-0003", lead_id=leads[2].id, customer_id=customers[2].id, survey_id=surveys[2].id, package_id=packages[7].id, system_capacity_kw=5.0, system_type=SystemType.OFF_GRID, hardware_cost=365000.0, installation_labour_cost=28000.0, accessories_cost=15000.0, subtotal=408000.0, tax_rate_pct=12.0, tax_amount=48960.0, total_amount=456960.0, advance_required_amount=137088.0, status=QuotationStatus.ACCEPTED),
            Quotation(quotation_number="QT-2026-0004", lead_id=leads[3].id, customer_id=customers[3].id, survey_id=surveys[3].id, package_id=packages[2].id, system_capacity_kw=3.0, system_type=SystemType.ON_GRID, hardware_cost=168000.0, installation_labour_cost=18000.0, accessories_cost=8000.0, subtotal=194000.0, tax_rate_pct=12.0, tax_amount=23280.0, total_amount=217280.0, advance_required_amount=65184.0, status=QuotationStatus.SENT)
        ]
        db.add_all(quotes)
        await db.flush()

        # 11. Orders & Payments
        orders = [
            Order(order_number="ORD-2026-0001", quotation_id=quotes[0].id, customer_id=customers[0].id, package_id=packages[2].id, system_capacity_kw=3.0, system_type=SystemType.ON_GRID, total_amount=217280.0, advance_required=65184.0, advance_paid=217280.0, remaining_balance=0.0, status=OrderStatus.COMPLETED),
            Order(order_number="ORD-2026-0002", quotation_id=quotes[1].id, customer_id=customers[1].id, package_id=packages[1].id, system_capacity_kw=2.0, system_type=SystemType.ON_GRID, total_amount=154560.0, advance_required=46368.0, advance_paid=75000.0, remaining_balance=79560.0, status=OrderStatus.DISPATCHED),
            Order(order_number="ORD-2026-0003", quotation_id=quotes[2].id, customer_id=customers[2].id, package_id=packages[7].id, system_capacity_kw=5.0, system_type=SystemType.OFF_GRID, total_amount=456960.0, advance_required=137088.0, advance_paid=150000.0, remaining_balance=306960.0, status=OrderStatus.READY_FOR_DISPATCH)
        ]
        db.add_all(orders)
        await db.flush()

        # Payments for orders
        payments = [
            Payment(receipt_number="REC-2026-0001", order_id=orders[0].id, customer_id=customers[0].id, amount=65184.0, payment_type=PaymentType.ADVANCE, payment_method=PaymentMethod.UPI, transaction_reference="UPI/2026/894124501", status=PaymentStatus.VERIFIED, notes="30% Advance for warehouse dispatch"),
            Payment(receipt_number="REC-2026-0002", order_id=orders[0].id, customer_id=customers[0].id, amount=152096.0, payment_type=PaymentType.FINAL_SETTLEMENT, payment_method=PaymentMethod.BANK_TRANSFER, transaction_reference="NEFT/HDFC/20260214", status=PaymentStatus.VERIFIED, notes="Final settlement upon commissioning"),
            Payment(receipt_number="REC-2026-0003", order_id=orders[1].id, customer_id=customers[1].id, amount=75000.0, payment_type=PaymentType.ADVANCE, payment_method=PaymentMethod.UPI, transaction_reference="UPI/2026/911245781", status=PaymentStatus.VERIFIED, notes="Mobilization advance"),
            Payment(receipt_number="REC-2026-0004", order_id=orders[2].id, customer_id=customers[2].id, amount=150000.0, payment_type=PaymentType.ADVANCE, payment_method=PaymentMethod.BANK_TRANSFER, transaction_reference="RTGS/ICICI/994112", status=PaymentStatus.VERIFIED, notes="Advance for 5kW Off-Grid battery package")
        ]
        db.add_all(payments)
        await db.flush()

        # Project Costs for Job-Wise Profitability
        costs = [
            ProjectCost(order_id=orders[0].id, category="MATERIAL_BOM", description="6x 540W Panels, 3kW Inverter, GI stands & cables", amount_inr=112000.0),
            ProjectCost(order_id=orders[0].id, category="TECHNICIAN_LABOUR", description="Technician installation & wiring man-hours", amount_inr=12500.0),
            ProjectCost(order_id=orders[0].id, category="CRANE_TRANSPORT", description="Warehouse freight delivery & roof lift", amount_inr=3200.0),
            ProjectCost(order_id=orders[0].id, category="DISCOM_FEES", description="MSEDCL net metering processing fee", amount_inr=2500.0),
            
            ProjectCost(order_id=orders[1].id, category="MATERIAL_BOM", description="4x 540W Panels, 2kW Inverter & racking", amount_inr=78000.0),
            ProjectCost(order_id=orders[1].id, category="TECHNICIAN_LABOUR", description="On-site crew hours", amount_inr=9500.0),
            ProjectCost(order_id=orders[1].id, category="CRANE_TRANSPORT", description="Logistics tempo delivery", amount_inr=2200.0),
            
            ProjectCost(order_id=orders[2].id, category="MATERIAL_BOM", description="10x Panels, 5kW Hybrid Inverter, 4x 200Ah Batteries", amount_inr=260000.0),
            ProjectCost(order_id=orders[2].id, category="TECHNICIAN_LABOUR", description="Heavy duty electrical wiring", amount_inr=18000.0)
        ]
        db.add_all(costs)
        await db.flush()

        # 12. Field Installations
        inst_1 = Installation(
            installation_code="INST-2026-0001",
            order_id=orders[0].id,
            customer_id=customers[0].id,
            system_capacity_kw=3.0,
            system_type=SystemType.ON_GRID,
            scheduled_date=now - timedelta(days=12),
            actual_completion_date=now - timedelta(days=9),
            status=InstallationStatus.CUSTOMER_ACCEPTED,
            customer_signature_svg="<svg viewBox='0 0 100 40'><path d='M10 20 Q 30 5, 50 20 T 90 20' fill='none' stroke='#059669' stroke-width='3'/></svg>",
            customer_acceptance_notes="System testing verified. Inverter producing 3.1 kW peak. Net meter synchronization completed.",
            commissioning_certificate_no="CERT-COMM-2026-0001"
        )
        db.add(inst_1)
        await db.flush()

        # Installation tasks
        steps_text = [
            "1. Job Assigned & Material Verification", "2. Materials Dispatched & Staged",
            "3. Site Reached & Customer Briefing", "4. Work Started & Roof Safety Rigging",
            "5. Mounting Structure & GI Stand Assembly", "6. Solar PV Panels Mounted & Torqued",
            "7. DC Cabling, Conduit & MC4 Connections", "8. Inverter & ACDB/DCDB Wall Mounting",
            "9. Dual Chemical Earthing Pit Resistance Testing (<5 Ohms)", "10. System Electrical Safety & Polarity Testing",
            "11. Inverter Power On & Grid Interconnection Commissioning", "12. Customer Acceptance & Digital Signature Signoff",
            "13. Job Completed & Handover Certificate Issued"
        ]
        for idx, s in enumerate(steps_text):
            db.add(InstallationTask(
                installation_id=inst_1.id,
                step_order=idx + 1,
                step_name=s,
                status="COMPLETED",
                completed_at=now - timedelta(days=9)
            ))

        # 13. Map Serialized Items to Order 1 and Assign Warranties
        inv_serial = serials_list[0]
        inv_serial.order_id = orders[0].id
        inv_serial.customer_id = customers[0].id
        inv_serial.status = SerialStatus.INSTALLED
        inv_serial.installed_date = now - timedelta(days=9)

        w1 = Warranty(
            warranty_code=f"WAR-{inv_serial.serial_number}",
            serialized_equipment_id=inv_serial.id,
            customer_id=customers[0].id,
            installation_id=inst_1.id,
            start_date=now - timedelta(days=9),
            end_date=now - timedelta(days=9) + timedelta(days=5*365),
            duration_years=5,
            status=WarrantyStatus.ACTIVE
        )
        db.add(w1)

        # 14. Service Ticket
        db.add(ServiceTicket(
            ticket_number="TCK-2026-0001",
            customer_id=customers[0].id,
            installation_id=inst_1.id,
            serialized_equipment_id=inv_serial.id,
            fault_category="INVERTER_ERROR_CODE",
            fault_code="E04 - Transient Grid Surge",
            description="Inverter tripped momentarily during MSEDCL grid fluctuation. Self-cleared in 10 mins.",
            priority=PriorityLevel.LOW,
            status=TicketStatus.CLOSED,
            assigned_technician_id=technicians[0].id,
            is_covered_under_warranty=True,
            estimated_repair_cost=0.0,
            customer_charge_inr=0.0,
            resolution_notes="Inspected logs. Voltage stabilizer parameter adjusted. Working at nominal efficiency.",
            reported_at=now - timedelta(days=3),
            resolved_at=now - timedelta(days=2)
        ))

        # 15. PM Surya Ghar Subsidy Application
        db.add(SubsidyApplication(
            application_number="SUB-2026-0001",
            order_id=orders[0].id,
            customer_id=customers[0].id,
            discom_name="MSEDCL (Maharashtra State Electricity)",
            consumer_number="015520448191",
            scheme_name="PM Surya Ghar Muft Bijli Yojana",
            capacity_kw=3.0,
            subsidy_amount_eligible_inr=78000.0,
            status=SubsidyStatus.APPROVED,
            submission_date=now - timedelta(days=15),
            approval_date=now - timedelta(days=5)
        ))

        await db.commit()
        print("SunPower Solutions ERP database seeded successfully with full enterprise data!")

if __name__ == "__main__":
    asyncio.run(seed_erp_database())
