import enum
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, 
    ForeignKey, Text, Enum, JSON, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

# Enums
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DIRECTOR = "DIRECTOR"
    SALES_EXECUTIVE = "SALES_EXECUTIVE"
    SURVEY_TECHNICIAN = "SURVEY_TECHNICIAN"
    WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER"
    INSTALLATION_MANAGER = "INSTALLATION_MANAGER"
    FIELD_TECHNICIAN = "FIELD_TECHNICIAN"
    FINANCE_EXECUTIVE = "FINANCE_EXECUTIVE"
    SUPPORT_EXECUTIVE = "SUPPORT_EXECUTIVE"
    CUSTOMER = "CUSTOMER"

class CustomerCategory(str, enum.Enum):
    RESIDENTIAL = "RESIDENTIAL"
    COMMERCIAL = "COMMERCIAL"
    INDUSTRIAL = "INDUSTRIAL"

class SystemType(str, enum.Enum):
    ON_GRID = "ON_GRID"
    OFF_GRID = "OFF_GRID"
    HYBRID = "HYBRID"

class LeadSource(str, enum.Enum):
    WEBSITE = "WEBSITE"
    WHATSAPP = "WHATSAPP"
    PHONE = "PHONE"
    MANUAL = "MANUAL"
    REFERRAL = "REFERRAL"

class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    SURVEY_SCHEDULED = "SURVEY_SCHEDULED"
    SURVEY_COMPLETED = "SURVEY_COMPLETED"
    QUOTATION_PREPARED = "QUOTATION_PREPARED"
    NEGOTIATION = "NEGOTIATION"
    CONVERTED = "CONVERTED"
    LOST = "LOST"

class SurveyStatus(str, enum.Enum):
    PENDING = "PENDING"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REVISIT_REQUIRED = "REVISIT_REQUIRED"

class ProductCategory(str, enum.Enum):
    SOLAR_PANEL = "SOLAR_PANEL"
    INVERTER = "INVERTER"
    BATTERY = "BATTERY"
    CHARGE_CONTROLLER = "CHARGE_CONTROLLER"
    MOUNTING_STRUCTURE = "MOUNTING_STRUCTURE"
    DC_CABLE = "DC_CABLE"
    AC_CABLE = "AC_CABLE"
    CONNECTOR = "CONNECTOR"
    JUNCTION_BOX = "JUNCTION_BOX"
    PROTECTION_SWITCH = "PROTECTION_SWITCH"
    EARTHING = "EARTHING"

class QuotationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    ACCEPTED = "ACCEPTED"
    REVISED = "REVISED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"

class OrderStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    INVENTORY_RESERVED = "INVENTORY_RESERVED"
    READY_FOR_DISPATCH = "READY_FOR_DISPATCH"
    DISPATCHED = "DISPATCHED"
    INSTALLATION_SCHEDULED = "INSTALLATION_SCHEDULED"
    INSTALLATION_IN_PROGRESS = "INSTALLATION_IN_PROGRESS"
    COMMISSIONED = "COMMISSIONED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class PaymentMethod(str, enum.Enum):
    UPI = "UPI"
    BANK_TRANSFER = "BANK_TRANSFER"
    CASH = "CASH"
    CARD = "CARD"
    CHEQUE = "CHEQUE"

class PaymentType(str, enum.Enum):
    ADVANCE = "ADVANCE"
    PARTIAL = "PARTIAL"
    FINAL_SETTLEMENT = "FINAL_SETTLEMENT"
    REFUND = "REFUND"

class PaymentStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    PENDING = "PENDING"
    FAILED = "FAILED"

class SerialStatus(str, enum.Enum):
    IN_WAREHOUSE = "IN_WAREHOUSE"
    RESERVED = "RESERVED"
    DISPATCHED = "DISPATCHED"
    INSTALLED = "INSTALLED"
    UNDER_CLAIM = "UNDER_CLAIM"
    REPLACED = "REPLACED"

class WarrantyStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    ACTIVE = "ACTIVE"
    EXPIRING_SOON = "EXPIRING_SOON"
    EXPIRED = "EXPIRED"
    UNDER_CLAIM = "UNDER_CLAIM"
    REPLACED = "REPLACED"

class InstallationStatus(str, enum.Enum):
    JOB_ASSIGNED = "JOB_ASSIGNED"
    MATERIALS_PREPARED = "MATERIALS_PREPARED"
    DISPATCHED = "DISPATCHED"
    SITE_REACHED = "SITE_REACHED"
    WORK_STARTED = "WORK_STARTED"
    MOUNTING_COMPLETED = "MOUNTING_COMPLETED"
    PANELS_INSTALLED = "PANELS_INSTALLED"
    ELECTRICAL_DONE = "ELECTRICAL_DONE"
    EARTHING_DONE = "EARTHING_DONE"
    SYSTEM_TESTING = "SYSTEM_TESTING"
    COMMISSIONED = "COMMISSIONED"
    CUSTOMER_ACCEPTED = "CUSTOMER_ACCEPTED"
    COMPLETED = "COMPLETED"

class TicketStatus(str, enum.Enum):
    NEW = "NEW"
    ASSIGNED = "ASSIGNED"
    INSPECTION_SCHEDULED = "INSPECTION_SCHEDULED"
    TECHNICIAN_VISIT = "TECHNICIAN_VISIT"
    DIAGNOSIS = "DIAGNOSIS"
    REPAIR_REPLACEMENT = "REPAIR_REPLACEMENT"
    TESTING = "TESTING"
    CUSTOMER_CONFIRMATION = "CUSTOMER_CONFIRMATION"
    CLOSED = "CLOSED"

class SubsidyStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    DOCUMENTS_PENDING = "DOCUMENTS_PENDING"
    READY_FOR_SUBMISSION = "READY_FOR_SUBMISSION"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISBURSED = "DISBURSED"

class PriorityLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


# 1. Users
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.DIRECTOR, nullable=False)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


# 2. Customers
class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    customer_category = Column(Enum(CustomerCategory), default=CustomerCategory.RESIDENTIAL)
    avg_monthly_bill_inr = Column(Float, default=2500.0)
    roof_area_sqft = Column(Float, default=450.0)
    roof_type = Column(String(100), default="RCC Concrete Flat")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    leads = relationship("Lead", back_populates="customer")
    surveys = relationship("SiteSurvey", back_populates="customer")
    quotations = relationship("Quotation", back_populates="customer")
    orders = relationship("Order", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")
    service_tickets = relationship("ServiceTicket", back_populates="customer")
    warranties = relationship("Warranty", back_populates="customer")
    subsidy_applications = relationship("SubsidyApplication", back_populates="customer")


# 3. Customer Leads / Enquiries
class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    enquiry_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    requested_capacity_kw = Column(Float, nullable=False)
    preferred_system_type = Column(Enum(SystemType), default=SystemType.ON_GRID)
    subsidy_required = Column(Boolean, default=True)
    lead_source = Column(Enum(LeadSource), default=LeadSource.WEBSITE)
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW, index=True)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM)
    assigned_sales_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    contact_notes = Column(Text, nullable=True)
    lost_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    customer = relationship("Customer", back_populates="leads")
    surveys = relationship("SiteSurvey", back_populates="lead")


# 4. Site Surveys
class SiteSurvey(Base):
    __tablename__ = "site_surveys"

    id = Column(Integer, primary_key=True, index=True)
    survey_number = Column(String(50), unique=True, index=True, nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    assigned_technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=True)
    visit_date = Column(DateTime, nullable=True)
    
    # Roof measurements
    roof_dimensions = Column(String(100), default="12m x 8m")
    shadow_free_area_sqft = Column(Float, default=400.0)
    roof_direction = Column(String(50), default="South")
    roof_tilt_deg = Column(Float, default=15.0)
    roof_condition = Column(String(50), default="Good")
    cable_distance_meters = Column(Float, default=22.0)
    grid_connection_phase = Column(String(50), default="Single Phase")
    existing_sanctioned_load_kw = Column(Float, default=5.0)
    technician_observations = Column(Text, nullable=True)
    recommended_capacity_kw = Column(Float, default=3.0)
    
    # Approval State
    status = Column(Enum(SurveyStatus), default=SurveyStatus.PENDING, index=True)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    manager_override_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="surveys")
    customer = relationship("Customer", back_populates="surveys")
    assigned_technician = relationship("Technician", back_populates="surveys")
    photos = relationship("SurveyPhoto", back_populates="survey", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="survey")


class SurveyPhoto(Base):
    __tablename__ = "survey_photos"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("site_surveys.id"), nullable=False, index=True)
    photo_type = Column(String(100), default="ROOFTOP_VIEW")
    photo_url = Column(String(500), nullable=False)
    caption = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    survey = relationship("SiteSurvey", back_populates="photos")


# 5. Products & Inventory
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(Enum(ProductCategory), nullable=False, index=True)
    manufacturer = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    specifications = Column(JSON, nullable=True)
    unit_purchase_cost = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    warranty_years = Column(Integer, default=5)
    min_stock_threshold = Column(Integer, default=5)
    unit = Column(String(50), default="Nos")
    created_at = Column(DateTime, default=datetime.utcnow)

    inventory = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")
    serialized_items = relationship("SerializedEquipment", back_populates="product")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False, index=True)
    physical_quantity = Column(Integer, default=0, nullable=False)
    reserved_quantity = Column(Integer, default=0, nullable=False)
    available_quantity = Column(Integer, default=0, nullable=False)  # Physical - Reserved
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="inventory")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    transaction_type = Column(String(50), nullable=False)  # PURCHASE_RECEIPT, ORDER_RESERVE, DISPATCH, ADJUSTMENT
    quantity = Column(Integer, nullable=False)
    order_id = Column(Integer, nullable=True)
    reference_no = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# 6. Predefined Solar Packages & Bill of Materials (BOM)
class ProductPackage(Base):
    __tablename__ = "product_packages"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. ON_GRID_3KW
    name = Column(String(255), nullable=False)
    system_type = Column(Enum(SystemType), default=SystemType.ON_GRID)
    capacity_kw = Column(Float, nullable=False)
    base_material_cost = Column(Float, nullable=False)
    default_installation_charge = Column(Float, default=15000.0)
    selling_price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    bom_items = relationship("PackageBOM", back_populates="package", cascade="all, delete-orphan")


class PackageBOM(Base):
    __tablename__ = "package_bom"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("product_packages.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit = Column(String(50), default="Nos")
    is_mandatory = Column(Boolean, default=True)

    package = relationship("ProductPackage", back_populates="bom_items")
    product = relationship("Product")


# 7. Quotations
class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    quotation_number = Column(String(50), unique=True, index=True, nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    survey_id = Column(Integer, ForeignKey("site_surveys.id"), nullable=True)
    package_id = Column(Integer, ForeignKey("product_packages.id"), nullable=False)
    system_capacity_kw = Column(Float, nullable=False)
    system_type = Column(Enum(SystemType), default=SystemType.ON_GRID)
    
    # Financial breakdown
    hardware_cost = Column(Float, nullable=False)
    installation_labour_cost = Column(Float, default=15000.0)
    accessories_cost = Column(Float, default=8000.0)
    subtotal = Column(Float, nullable=False)
    tax_rate_pct = Column(Float, default=12.0)  # GST 12% on solar
    tax_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    advance_required_amount = Column(Float, nullable=False)
    
    status = Column(Enum(QuotationStatus), default=QuotationStatus.SENT, index=True)
    validity_days = Column(Integer, default=15)
    terms_conditions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="quotations")
    survey = relationship("SiteSurvey", back_populates="quotations")
    package = relationship("ProductPackage")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")
    order = relationship("Order", back_populates="quotation", uselist=False)


class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    item_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    quotation = relationship("Quotation", back_populates="items")


# 8. Orders
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    package_id = Column(Integer, ForeignKey("product_packages.id"), nullable=False)
    system_capacity_kw = Column(Float, nullable=False)
    system_type = Column(Enum(SystemType), default=SystemType.ON_GRID)
    order_date = Column(DateTime, default=datetime.utcnow)
    
    # Financials
    total_amount = Column(Float, nullable=False)
    advance_required = Column(Float, nullable=False)
    advance_paid = Column(Float, default=0.0)
    remaining_balance = Column(Float, nullable=False)
    
    status = Column(Enum(OrderStatus), default=OrderStatus.CONFIRMED, index=True)
    
    # Manager Override for dispatch before advance payment
    credit_override_approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    credit_override_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
    quotation = relationship("Quotation", back_populates="order")
    package = relationship("ProductPackage")
    payments = relationship("Payment", back_populates="order")
    dispatches = relationship("Dispatch", back_populates="order")
    installation = relationship("Installation", back_populates="order", uselist=False)
    project_costs = relationship("ProjectCost", back_populates="order")
    subsidy_application = relationship("SubsidyApplication", back_populates="order", uselist=False)


# 9. Payments
class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_type = Column(Enum(PaymentType), default=PaymentType.ADVANCE)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.UPI)
    transaction_reference = Column(String(100), nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.VERIFIED)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="payments")
    customer = relationship("Customer", back_populates="payments")


# 10. Serialized Equipment & QR Codes
class SerializedEquipment(Base):
    __tablename__ = "serialized_equipment"

    id = Column(Integer, primary_key=True, index=True)
    serial_number = Column(String(100), unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    manufacturer = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    warranty_duration_years = Column(Integer, default=5)
    
    status = Column(Enum(SerialStatus), default=SerialStatus.IN_WAREHOUSE, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    installation_id = Column(Integer, ForeignKey("installations.id"), nullable=True, index=True)
    
    dispatch_date = Column(DateTime, nullable=True)
    installed_date = Column(DateTime, nullable=True)
    qr_code_svg = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="serialized_items")
    warranty = relationship("Warranty", back_populates="serialized_equipment", uselist=False)


# 11. Dispatch & Warehouse Pick
class Dispatch(Base):
    __tablename__ = "dispatches"

    id = Column(Integer, primary_key=True, index=True)
    dispatch_number = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    dispatch_date = Column(DateTime, default=datetime.utcnow)
    driver_name = Column(String(100), default="SunPower Logistics Fleet #4")
    vehicle_number = Column(String(50), default="MH-12-SP-2026")
    delivery_status = Column(String(50), default="IN_TRANSIT")
    dispatched_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="dispatches")
    dispatch_items = relationship("DispatchItem", back_populates="dispatch", cascade="all, delete-orphan")


class DispatchItem(Base):
    __tablename__ = "dispatch_items"

    id = Column(Integer, primary_key=True, index=True)
    dispatch_id = Column(Integer, ForeignKey("dispatches.id"), nullable=False, index=True)
    serialized_equipment_id = Column(Integer, ForeignKey("serialized_equipment.id"), nullable=False)
    scanned_at = Column(DateTime, default=datetime.utcnow)
    is_verified = Column(Boolean, default=True)

    dispatch = relationship("Dispatch", back_populates="dispatch_items")
    serialized_equipment = relationship("SerializedEquipment")


# 12. Technicians
class Technician(Base):
    __tablename__ = "technicians"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    skills = Column(String(255), default="Solar PV, Inverters, AC/DC Wiring")
    assigned_region = Column(String(100), default="Central District")
    is_available = Column(Boolean, default=True)
    active_jobs_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    surveys = relationship("SiteSurvey", back_populates="assigned_technician")
    assignments = relationship("TechnicianAssignment", back_populates="technician")
    service_tickets = relationship("ServiceTicket", back_populates="assigned_technician")


# 13. Installations & Field Workflow
class Installation(Base):
    __tablename__ = "installations"

    id = Column(Integer, primary_key=True, index=True)
    installation_code = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    system_capacity_kw = Column(Float, nullable=False)
    system_type = Column(Enum(SystemType), default=SystemType.ON_GRID)
    
    scheduled_date = Column(DateTime, nullable=False)
    actual_completion_date = Column(DateTime, nullable=True)
    status = Column(Enum(InstallationStatus), default=InstallationStatus.JOB_ASSIGNED, index=True)
    team_leader_id = Column(Integer, ForeignKey("technicians.id"), nullable=True)
    
    # Customer Acceptance & Evidence
    customer_signature_svg = Column(Text, nullable=True)
    customer_acceptance_notes = Column(Text, nullable=True)
    commissioning_certificate_no = Column(String(100), nullable=True)
    gps_latitude = Column(Float, default=18.5204)
    gps_longitude = Column(Float, default=73.8567)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="installation")
    customer = relationship("Customer")
    tasks = relationship("InstallationTask", back_populates="installation", cascade="all, delete-orphan")
    photos = relationship("InstallationPhoto", back_populates="installation", cascade="all, delete-orphan")
    technicians = relationship("TechnicianAssignment", back_populates="installation")
    warranties = relationship("Warranty", back_populates="installation")
    service_tickets = relationship("ServiceTicket", back_populates="installation")


class InstallationTask(Base):
    __tablename__ = "installation_tasks"

    id = Column(Integer, primary_key=True, index=True)
    installation_id = Column(Integer, ForeignKey("installations.id"), nullable=False, index=True)
    step_order = Column(Integer, nullable=False)  # 1 to 13
    step_name = Column(String(255), nullable=False)
    status = Column(String(50), default="PENDING")  # PENDING, IN_PROGRESS, COMPLETED
    assigned_technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    installation = relationship("Installation", back_populates="tasks")


class InstallationPhoto(Base):
    __tablename__ = "installation_photos"

    id = Column(Integer, primary_key=True, index=True)
    installation_id = Column(Integer, ForeignKey("installations.id"), nullable=False, index=True)
    photo_type = Column(String(100), nullable=False)  # BEFORE_WORK, STRUCTURE, PANELS, INVERTER, EARTHING, AFTER_WORK
    photo_url = Column(String(500), nullable=False)
    caption = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    installation = relationship("Installation", back_populates="photos")


class TechnicianAssignment(Base):
    __tablename__ = "technician_assignments"

    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False, index=True)
    installation_id = Column(Integer, ForeignKey("installations.id"), nullable=False, index=True)
    role_in_team = Column(String(50), default="Lead Electrician")

    technician = relationship("Technician", back_populates="assignments")
    installation = relationship("Installation", back_populates="technicians")


# 14. Automatic Warranty Register
class Warranty(Base):
    __tablename__ = "warranties"

    id = Column(Integer, primary_key=True, index=True)
    warranty_code = Column(String(50), unique=True, index=True, nullable=False)
    serialized_equipment_id = Column(Integer, ForeignKey("serialized_equipment.id"), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    installation_id = Column(Integer, ForeignKey("installations.id"), nullable=False, index=True)
    
    start_date = Column(DateTime, nullable=False)  # Commences on actual delivery/commissioning
    end_date = Column(DateTime, nullable=False)
    duration_years = Column(Integer, nullable=False)
    status = Column(Enum(WarrantyStatus), default=WarrantyStatus.ACTIVE, index=True)
    certificate_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    serialized_equipment = relationship("SerializedEquipment", back_populates="warranty")
    customer = relationship("Customer", back_populates="warranties")
    installation = relationship("Installation", back_populates="warranties")
    claims = relationship("WarrantyClaim", back_populates="warranty")


class WarrantyClaim(Base):
    __tablename__ = "warranty_claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String(50), unique=True, index=True, nullable=False)
    warranty_id = Column(Integer, ForeignKey("warranties.id"), nullable=False, index=True)
    service_ticket_id = Column(Integer, ForeignKey("service_tickets.id"), nullable=True)
    claim_date = Column(DateTime, default=datetime.utcnow)
    defect_description = Column(Text, nullable=False)
    mfr_rma_number = Column(String(100), nullable=True)
    status = Column(String(50), default="SUBMITTED")  # SUBMITTED, APPROVED_BY_MFR, REPLACED, REJECTED
    warranty_cost_inr = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    warranty = relationship("Warranty", back_populates="claims")


# 15. After-Sales Service Tickets & Fault Complaints
class ServiceTicket(Base):
    __tablename__ = "service_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    installation_id = Column(Integer, ForeignKey("installations.id"), nullable=False, index=True)
    serialized_equipment_id = Column(Integer, ForeignKey("serialized_equipment.id"), nullable=True)
    
    fault_category = Column(String(100), default="INVERTER_ERROR_CODE")
    fault_code = Column(String(50), default="E04 - Ground Fault")
    description = Column(Text, nullable=False)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM)
    status = Column(Enum(TicketStatus), default=TicketStatus.NEW, index=True)
    
    assigned_technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=True)
    
    # Financial resolution
    is_covered_under_warranty = Column(Boolean, default=True)
    estimated_repair_cost = Column(Float, default=0.0)
    actual_repair_cost = Column(Float, default=0.0)
    customer_charge_inr = Column(Float, default=0.0)
    resolution_notes = Column(Text, nullable=True)
    
    reported_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    customer = relationship("Customer", back_populates="service_tickets")
    installation = relationship("Installation", back_populates="service_tickets")
    assigned_technician = relationship("Technician", back_populates="service_tickets")


# 16. Government Subsidy Management (e.g. PM Surya Ghar)
class SubsidyApplication(Base):
    __tablename__ = "subsidy_applications"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    
    discom_name = Column(String(100), default="MSEDCL / State Electricity Distribution")
    consumer_number = Column(String(100), nullable=False)
    scheme_name = Column(String(100), default="PM Surya Ghar Muft Bijli Yojana")
    capacity_kw = Column(Float, nullable=False)
    subsidy_amount_eligible_inr = Column(Float, default=78000.0)  # e.g. ₹78,000 for 3 kW
    
    status = Column(Enum(SubsidyStatus), default=SubsidyStatus.DOCUMENTS_PENDING, index=True)
    submission_date = Column(DateTime, nullable=True)
    approval_date = Column(DateTime, nullable=True)
    disbursement_date = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="subsidy_application")
    customer = relationship("Customer", back_populates="subsidy_applications")
    documents = relationship("SubsidyDocument", back_populates="application", cascade="all, delete-orphan")


class SubsidyDocument(Base):
    __tablename__ = "subsidy_documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("subsidy_applications.id"), nullable=False, index=True)
    doc_type = Column(String(100), nullable=False)  # ELECTRICITY_BILL, AADHAAR, BANK_PASSBOOK, DISCOM_SANCTION, NET_METER_RECEIPT
    doc_url = Column(String(500), nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("SubsidyApplication", back_populates="documents")


# 17. Job-Wise Profitability & Project Expenses
class ProjectCost(Base):
    __tablename__ = "project_costs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # MATERIAL_BOM, TECHNICIAN_LABOUR, CRANE_TRANSPORT, DISCOM_FEES, MISC
    description = Column(String(255), nullable=False)
    amount_inr = Column(Float, nullable=False)
    recorded_date = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="project_costs")


# 18. Notifications & Auditing
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="OPERATIONS")
    severity = Column(String(50), default="INFO")  # INFO, WARNING, SUCCESS, DANGER
    is_read = Column(Boolean, default=False)
    link_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_name = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
