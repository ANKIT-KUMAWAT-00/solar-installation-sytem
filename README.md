# SUNPOWER SOLUTIONS — Solar Installation Management System (ERP)

An enterprise-grade, full-lifecycle **Business ERP & Solar Intelligence System** built for high-growth commercial and residential rooftop solar installation companies (~40 installations/month, 15 field technicians, 1 kW to 5 kW On-Grid & Off-Grid systems).

---

## 🌟 System Overview & Business Architecture

SunPower Solutions ERP replaces fragmented spreadsheets, manual quotation PDFs, untracked inventory, and paper surveys with **one centralized, automated source of truth**.

```
Customer Enquiry / Web Form
            ↓
Rooftop Site Survey & Shadow Analysis (Feasibility Score & Tilt Verification)
            ↓
Dynamic Package Selection & Automated Bill of Materials (BOM) Engine
            ↓
Automated Quotation Generation (ReportLab PDF & Pricing Breakdowns)
            ↓
Order Conversion & Atomic Stock Reservation (Physical - Reserved = Available)
            ↓
Payment Gateway / Verification (30% Advance Gate or Manager Credit Override)
            ↓
Warehouse Dispatch Station & Handheld QR Serial Number Manifest Scanning
            ↓
Field Installation Operations (15-Technician Roster, 13-Step SOP Checklist)
            ↓
Customer Commissioning Handover (Digital Signature SVG & Handover Certificate)
            ↓
Automatic Warranty Policy Activation (Serial Number Register & PDF Certificates)
            ↓
After-Sales Service Desk (RMA Diagnostic, Warranty Lookup: ₹0 Covered vs Chargeable)
            ↓
Government PM Surya Ghar Subsidy DBT Pipeline (Consumer No, Joint Inspection, DBT)
            ↓
Job-Wise Profitability Engine (Project Revenue - Direct Costs = Gross Profit & Margin %)
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom Solar Grid & Emerald/Gold color palette
- **3D Digital Twins**: Three.js interactive 3D Rooftop Solar Model, 3D Exploded BOM Model, and 3D Inverter Telemetry Device
- **Charts & Visualizations**: Recharts & Apache ECharts (Sales Funnel, P&L Revenue vs Direct Costs, Capacity Mix, RMA Failure Diagnostics)
- **Icons & Animation**: Lucide React, Framer Motion, Canvas Confetti

### Backend
- **Framework**: Python FastAPI (REST APIs & WebSockets)
- **ORM & Database**: SQLAlchemy 2.0 (AsyncIO), PostgreSQL & SQLite (aiosqlite)
- **Validation**: Pydantic v2
- **Security**: JWT authentication (`python-jose`), direct `bcrypt` password hashing, Role-Based Access Control (RBAC) across 10 distinct company personas
- **Engines & Document Services**:
  - `BOMEngine`: Dynamic material and quantity calculator for 1kW-5kW systems
  - `PDFGeneratorService`: ReportLab vector PDF generator for Quotations and Official Warranty Certificates
  - `QRGeneratorService`: Scalable SVG QR code generator with embedded serial numbers
  - `ProfitEngine`: Job-wise revenue, BOM material, technician labour, freight, and gross profit calculation

---

## 👥 10-Role RBAC Persona Switcher

The top navigation bar features an **Instant Role Persona Switcher** for full live demonstration of company access permissions:

| Persona | Name | Role ID | Primary Responsibilities |
|---|---|---|---|
| **Company Director** | Rajesh Sharma | `DIRECTOR` | Executive Command Center, 12 KPIs, P&L, BI analytics |
| **System Admin** | Admin | `ADMIN` | User accounts, system configuration, master audits |
| **Sales Executive** | Amit Verma | `SALES_EXECUTIVE` | CRM leads, site survey scheduling, quotation negotiation |
| **Site Surveyor** | Vikas Patil | `SURVEY_TECHNICIAN` | Rooftop measurements, shadow analysis, feasibility gate |
| **Warehouse Manager**| Sanjay Kulkarni | `WAREHOUSE_MANAGER`| Stock receipts, serial QR tagging, dispatch packing gate |
| **Installation Manager**| Mahesh Deshmukh | `INSTALLATION_MANAGER`| 15-technician scheduling, dispatch authorization |
| **Field Technician** | Ramesh Yadav | `FIELD_TECHNICIAN` | 13-step SOP checklist, photo uploads, customer signature |
| **Finance Executive** | Pooja Mehta | `FINANCE_EXECUTIVE` | Advance payments, job profitability, balance recovery |
| **Support Executive** | Kavita Nair | `SUPPORT_EXECUTIVE` | Service tickets, RMA complaints, warranty verification |
| **Solar Customer** | Dr. Anil Joshi | `CUSTOMER` | Customer portal, warranty certificate vault, generation stats |

---

## 🚀 Quickstart Guide

### Option 1: Running Locally (Development Mode)

#### 1. Start the FastAPI Backend
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server (automatically initializes DB schema & seeds realistic ERP data)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API Docs will be live at `http://localhost:8000/docs`.*

#### 2. Start the Next.js Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
*Web application will be live at `http://localhost:3000`.*

---

### Option 2: Docker Compose (Production Stack)

Start the entire multi-container stack (PostgreSQL 16, Redis 7, FastAPI backend, and Next.js frontend):

```bash
docker-compose up --build
```

Access services:
- **ERP Web Application**: `http://localhost:3000`
- **FastAPI REST API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **PostgreSQL**: `localhost:5432` (`user: sunpower_user`, `db: sunpower_erp`)
- **Redis**: `localhost:6379`

---

## 📊 Database Schema (32 Normalized Tables)

1. `users` — 10-role user accounts with password hashing
2. `customers` — Residential and commercial rooftop clients
3. `leads` — Lead pipeline (Contacted → Survey Scheduled → Converted)
4. `site_surveys` — Roof area, shadow-free calculation, tilt angle, approval gate
5. `survey_photos` — Inspection photo records
6. `products` — Catalog items with min stock and warranty policies
7. `inventories` — Physical stock, reserved stock, available stock
8. `inventory_transactions` — Goods receipt, dispatch deductions, audits
9. `product_packages` — 1kW-5kW standard rooftop packages
10. `package_bom` — Bill of materials mapping for packages
11. `quotations` — Commercial quotes with hardware, labour, subsidy breakdown
12. `quotation_items` — Detailed BOM items within quotation
13. `orders` — Orders with payment thresholds & dispatch flags
14. `payments` — Advance & milestone payments via UPI, NEFT, Cheque
15. `serialized_equipments` — Serial numbers, QR codes, warranty duration
16. `dispatches` — Warehouse dispatch memos with driver & vehicle
17. `dispatch_items` — Items dispatched per order
18. `technicians` — 15 field technicians with skills & territories
19. `installations` — Field installation projects & commissioning certs
20. `installation_tasks` — 13-step SOP checklist execution
21. `installation_photos` — Installation progress photo evidence
22. `technician_assignments` — Crew assignments per project
23. `warranties` — Active warranty register with start/end dates
24. `warranty_claims` — RMA claims with free vs chargeable determination
25. `service_tickets` — Customer complaints & diagnostic error codes
26. `subsidy_applications` — PM Surya Ghar portal applications
27. `subsidy_documents` — Compliance document verification checklist
28. `project_costs` — Job-wise direct costs (BOM, labour, transport)
29. `notifications` — Real-time event notifications
30. `audit_logs` — Security and role audit trail

---

## 🛡️ Key Automated Business Rules Verified

1. **Survey Approval Gate**: Quotations can only be generated for site surveys that have been marked `APPROVED` (or via manager override with explicit justification).
2. **Atomic Inventory Reservation**: Accepting a quotation automatically creates a `CONFIRMED` order and reserves physical stock atomically (`available = physical - reserved`).
3. **Dispatch Gate**: Orders cannot be dispatched until `advance_paid >= 30%` (or manager credit override).
4. **Automated Field Launch**: Warehouse dispatch verification against BOM serial numbers deducts physical & reserved stock and launches the 13-step installation project.
5. **Digital Handover & Auto-Warranties**: Capturing customer digital signature marks installation `CUSTOMER_ACCEPTED`, issues the Commissioning Certificate (`CERT-COMM-XXXX-YYYYMMDD`), and activates warranty policies for all installed serials.
6. **Smart After-Sales Diagnosis**: Service tickets automatically look up the equipment serial in the warranty register:
   - Valid Warranty: Customer fee = ₹0.
   - Expired Warranty: Replacement component + service fees calculated transparently.
7. **Job Profitability Engine**: Every project dynamically calculates:
   $$\text{Gross Profit} = \text{Order Revenue} - (\text{BOM Hardware Cost} + \text{Technician Labour} + \text{Freight/DISCOM})$$
   $$\text{Gross Margin \%} = \frac{\text{Gross Profit}}{\text{Order Revenue}} \times 100$$

---
# solar-installation-sytem
