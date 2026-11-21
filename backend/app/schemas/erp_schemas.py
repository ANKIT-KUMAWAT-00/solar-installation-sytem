from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.erp_models import (
    UserRole, CustomerCategory, SystemType, LeadSource, LeadStatus,
    SurveyStatus, ProductCategory, QuotationStatus, OrderStatus,
    PaymentMethod, PaymentType, PaymentStatus, SerialStatus, WarrantyStatus,
    InstallationStatus, TicketStatus, SubsidyStatus, PriorityLevel
)

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.SALES_EXECUTIVE
    phone: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Customer Schemas
class CustomerBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    address: str
    city: str
    state: str = "Maharashtra"
    postal_code: str
    customer_category: CustomerCategory = CustomerCategory.RESIDENTIAL
    avg_monthly_bill_inr: float = 2500.0
    roof_area_sqft: float = 450.0
    roof_type: str = "RCC Concrete Flat"
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int
    customer_code: str
    created_at: datetime

    class Config:
        from_attributes = True

# Lead & CRM Schemas
class LeadCreate(BaseModel):
    customer_name: str
    phone: str
    email: Optional[EmailStr] = None
    address: str
    city: str
    state: str = "Maharashtra"
    postal_code: str
    requested_capacity_kw: float = 3.0
    preferred_system_type: SystemType = SystemType.ON_GRID
    subsidy_required: bool = True
    lead_source: LeadSource = LeadSource.WEBSITE
    priority: PriorityLevel = PriorityLevel.MEDIUM
    contact_notes: Optional[str] = None

class PublicEnquiryCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    city: str
    avg_monthly_bill_inr: float = 3000.0
    requested_capacity_kw: float = 3.0
    system_type: SystemType = SystemType.ON_GRID
    notes: Optional[str] = None

class LeadUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    priority: Optional[PriorityLevel] = None
    assigned_sales_id: Optional[int] = None
    follow_up_date: Optional[datetime] = None
    contact_notes: Optional[str] = None
    lost_reason: Optional[str] = None

class LeadOut(BaseModel):
    id: int
    enquiry_number: str
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_city: Optional[str] = None
    requested_capacity_kw: float
    preferred_system_type: SystemType
    subsidy_required: bool
    lead_source: LeadSource
    status: LeadStatus
    priority: PriorityLevel
    follow_up_date: Optional[datetime] = None
    contact_notes: Optional[str] = None
    lost_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Site Survey Schemas
class SurveyCreate(BaseModel):
    lead_id: int
    assigned_technician_id: Optional[int] = None
    visit_date: Optional[datetime] = None
    roof_dimensions: str = "10m x 8m"
    shadow_free_area_sqft: float = 400.0
    roof_direction: str = "South"
    roof_tilt_deg: float = 15.0
    roof_condition: str = "Good"
    cable_distance_meters: float = 20.0
    grid_connection_phase: str = "Single Phase"
    existing_sanctioned_load_kw: float = 5.0
    recommended_capacity_kw: float = 3.0
    technician_observations: Optional[str] = None

class SurveyUpdate(BaseModel):
    status: Optional[SurveyStatus] = None
    shadow_free_area_sqft: Optional[float] = None
    recommended_capacity_kw: Optional[float] = None
    technician_observations: Optional[str] = None
    rejection_reason: Optional[str] = None
    manager_override_reason: Optional[str] = None

class SurveyOut(BaseModel):
    id: int
    survey_number: str
    lead_id: int
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_city: Optional[str] = None
    assigned_technician_id: Optional[int] = None
    assigned_technician_name: Optional[str] = None
    visit_date: Optional[datetime] = None
    roof_dimensions: str
    shadow_free_area_sqft: float
    roof_direction: str
    roof_tilt_deg: float
    roof_condition: str
    cable_distance_meters: float
    grid_connection_phase: str
    existing_sanctioned_load_kw: float
    recommended_capacity_kw: float
    technician_observations: Optional[str] = None
    status: SurveyStatus
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    manager_override_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Products & BOM Schemas
class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    category: ProductCategory
    manufacturer: str
    model: str
    specifications: Optional[Dict[str, Any]] = None
    unit_purchase_cost: float
    selling_price: float
    warranty_years: int
    min_stock_threshold: int
    unit: str
    physical_quantity: Optional[int] = 0
    reserved_quantity: Optional[int] = 0
    available_quantity: Optional[int] = 0

    class Config:
        from_attributes = True

class PackageBOMItem(BaseModel):
    product_id: int
    product_name: str
    sku: str
    category: str
    quantity: int
    unit: str
    unit_purchase_cost: float
    total_cost: float

class PackageOut(BaseModel):
    id: int
    code: str
    name: str
    system_type: SystemType
    capacity_kw: float
    base_material_cost: float
    default_installation_charge: float
    selling_price: float
    description: Optional[str] = None
    bom_items: List[PackageBOMItem] = []

    class Config:
        from_attributes = True

# Quotations Schemas
class QuotationCreate(BaseModel):
    lead_id: int
    package_id: int
    installation_labour_cost: float = 15000.0
    accessories_cost: float = 8000.0
    discount_amount: float = 0.0
    terms_conditions: Optional[str] = None

class QuotationOut(BaseModel):
    id: int
    quotation_number: str
    lead_id: int
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    package_id: int
    package_name: Optional[str] = None
    system_capacity_kw: float
    system_type: SystemType
    hardware_cost: float
    installation_labour_cost: float
    accessories_cost: float
    subtotal: float
    tax_rate_pct: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    advance_required_amount: float
    status: QuotationStatus
    validity_days: int
    terms_conditions: Optional[str] = None
    created_at: datetime
    is_survey_approved: bool = True

    class Config:
        from_attributes = True

# Orders Schemas
class OrderOut(BaseModel):
    id: int
    order_number: str
    quotation_id: int
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    customer_city: Optional[str] = None
    package_id: int
    package_name: Optional[str] = None
    system_capacity_kw: float
    system_type: SystemType
    order_date: datetime
    total_amount: float
    advance_required: float
    advance_paid: float
    remaining_balance: float
    status: OrderStatus
    credit_override_reason: Optional[str] = None
    is_dispatch_ready: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

# Payment Schemas
class PaymentCreate(BaseModel):
    order_id: int
    amount: float
    payment_type: PaymentType = PaymentType.ADVANCE
    payment_method: PaymentMethod = PaymentMethod.UPI
    transaction_reference: str
    notes: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    receipt_number: str
    order_id: int
    order_number: Optional[str] = None
    customer_id: int
    customer_name: Optional[str] = None
    amount: float
    payment_type: PaymentType
    payment_method: PaymentMethod
    transaction_reference: str
    payment_date: datetime
    status: PaymentStatus
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# Serialized Equipment & QR
class SerialNumberOut(BaseModel):
    id: int
    serial_number: str
    product_id: int
    product_name: Optional[str] = None
    category: Optional[str] = None
    manufacturer: str
    model: str
    warranty_duration_years: int
    status: SerialStatus
    order_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    dispatch_date: Optional[datetime] = None
    installed_date: Optional[datetime] = None
    qr_code_svg: Optional[str] = None

    class Config:
        from_attributes = True

# Technicians & Installations
class TechnicianOut(BaseModel):
    id: int
    employee_id: str
    name: str
    phone: str
    email: Optional[str] = None
    skills: str
    assigned_region: str
    is_available: bool
    active_jobs_count: int

    class Config:
        from_attributes = True

class InstallationTaskOut(BaseModel):
    id: int
    step_order: int
    step_name: str
    status: str
    assigned_technician_name: Optional[str] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None

class InstallationOut(BaseModel):
    id: int
    installation_code: str
    order_id: int
    order_number: Optional[str] = None
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    system_capacity_kw: float
    system_type: SystemType
    scheduled_date: datetime
    actual_completion_date: Optional[datetime] = None
    status: InstallationStatus
    team_leader_name: Optional[str] = None
    customer_signature_svg: Optional[str] = None
    customer_acceptance_notes: Optional[str] = None
    commissioning_certificate_no: Optional[str] = None
    gps_latitude: float
    gps_longitude: float
    tasks: List[InstallationTaskOut] = []

    class Config:
        from_attributes = True

# Warranties & Service
class WarrantyOut(BaseModel):
    id: int
    warranty_code: str
    serial_number: str
    product_name: str
    customer_id: int
    customer_name: str
    customer_phone: str
    installation_code: str
    start_date: datetime
    end_date: datetime
    duration_years: int
    status: WarrantyStatus

    class Config:
        from_attributes = True

class ServiceTicketCreate(BaseModel):
    customer_id: int
    installation_id: int
    serialized_equipment_id: Optional[int] = None
    fault_category: str = "INVERTER_ERROR_CODE"
    fault_code: str = "E04 - Ground Fault"
    description: str
    priority: PriorityLevel = PriorityLevel.MEDIUM

class ServiceTicketOut(BaseModel):
    id: int
    ticket_number: str
    customer_id: int
    customer_name: str
    customer_phone: str
    installation_id: int
    fault_category: str
    fault_code: str
    description: str
    priority: PriorityLevel
    status: TicketStatus
    assigned_technician_name: Optional[str] = None
    is_covered_under_warranty: bool
    estimated_repair_cost: float
    actual_repair_cost: float
    customer_charge_inr: float
    resolution_notes: Optional[str] = None
    reported_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Subsidy Schemas
class SubsidyOut(BaseModel):
    id: int
    application_number: str
    order_id: int
    order_number: str
    customer_name: str
    customer_phone: str
    consumer_number: str
    discom_name: str
    scheme_name: str
    capacity_kw: float
    subsidy_amount_eligible_inr: float
    status: SubsidyStatus
    submission_date: Optional[datetime] = None
    approval_date: Optional[datetime] = None
    disbursement_date: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True
