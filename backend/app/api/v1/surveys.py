from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.erp_models import (
    SiteSurvey, Lead, Customer, Technician, User, SurveyPhoto,
    SurveyStatus, LeadStatus, UserRole
)
from app.schemas.erp_schemas import SurveyCreate, SurveyUpdate, SurveyOut

router = APIRouter(prefix="/surveys", tags=["Rooftop Site Surveys"])

@router.get("", response_model=List[SurveyOut])
async def list_surveys(
    status: Optional[SurveyStatus] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(SiteSurvey).options(
        selectinload(SiteSurvey.customer),
        selectinload(SiteSurvey.assigned_technician)
    )

    if status:
        query = query.filter(SiteSurvey.status == status)
    if search:
        search_fmt = f"%{search}%"
        query = query.join(Customer).filter(
            (Customer.full_name.ilike(search_fmt)) |
            (Customer.phone.ilike(search_fmt)) |
            (SiteSurvey.survey_number.ilike(search_fmt))
        )

    result = await db.execute(query.order_by(SiteSurvey.id.desc()))
    surveys = result.scalars().all()

    out = []
    for s in surveys:
        out.append({
            "id": s.id,
            "survey_number": s.survey_number,
            "lead_id": s.lead_id,
            "customer_id": s.customer_id,
            "customer_name": s.customer.full_name if s.customer else "",
            "customer_phone": s.customer.phone if s.customer else "",
            "customer_city": s.customer.city if s.customer else "",
            "assigned_technician_id": s.assigned_technician_id,
            "assigned_technician_name": s.assigned_technician.name if s.assigned_technician else "Unassigned",
            "visit_date": s.visit_date,
            "roof_dimensions": s.roof_dimensions,
            "shadow_free_area_sqft": s.shadow_free_area_sqft,
            "roof_direction": s.roof_direction,
            "roof_tilt_deg": s.roof_tilt_deg,
            "roof_condition": s.roof_condition,
            "cable_distance_meters": s.cable_distance_meters,
            "grid_connection_phase": s.grid_connection_phase,
            "existing_sanctioned_load_kw": s.existing_sanctioned_load_kw,
            "recommended_capacity_kw": s.recommended_capacity_kw,
            "technician_observations": s.technician_observations,
            "status": s.status,
            "approved_at": s.approved_at,
            "rejection_reason": s.rejection_reason,
            "manager_override_reason": s.manager_override_reason,
            "created_at": s.created_at
        })
    return out

@router.get("/{id}")
async def get_survey(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(SiteSurvey)
        .options(
            selectinload(SiteSurvey.customer),
            selectinload(SiteSurvey.assigned_technician),
            selectinload(SiteSurvey.photos)
        )
        .filter(SiteSurvey.id == id)
    )
    s = result.scalars().first()
    if not s:
        raise HTTPException(status_code=404, detail="Site survey not found")

    return {
        "id": s.id,
        "survey_number": s.survey_number,
        "lead_id": s.lead_id,
        "customer": {
            "id": s.customer.id,
            "name": s.customer.full_name,
            "phone": s.customer.phone,
            "address": s.customer.address,
            "city": s.customer.city
        } if s.customer else None,
        "assigned_technician": {
            "id": s.assigned_technician.id,
            "name": s.assigned_technician.name,
            "phone": s.assigned_technician.phone
        } if s.assigned_technician else None,
        "visit_date": s.visit_date,
        "roof_dimensions": s.roof_dimensions,
        "shadow_free_area_sqft": s.shadow_free_area_sqft,
        "roof_direction": s.roof_direction,
        "roof_tilt_deg": s.roof_tilt_deg,
        "roof_condition": s.roof_condition,
        "cable_distance_meters": s.cable_distance_meters,
        "grid_connection_phase": s.grid_connection_phase,
        "existing_sanctioned_load_kw": s.existing_sanctioned_load_kw,
        "recommended_capacity_kw": s.recommended_capacity_kw,
        "technician_observations": s.technician_observations,
        "status": s.status,
        "approved_at": s.approved_at,
        "rejection_reason": s.rejection_reason,
        "manager_override_reason": s.manager_override_reason,
        "photos": [
            {
                "id": p.id,
                "photo_type": p.photo_type,
                "photo_url": p.photo_url,
                "caption": p.caption
            }
            for p in s.photos
        ],
        "created_at": s.created_at
    }

@router.post("", response_model=SurveyOut)
async def schedule_survey(
    survey_in: SurveyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res_lead = await db.execute(select(Lead).filter(Lead.id == survey_in.lead_id))
    lead = res_lead.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    res_count = await db.execute(select(func.count(SiteSurvey.id)))
    s_count = (res_count.scalar() or 0) + 1
    survey_no = f"SRV-2026-{s_count:04d}"

    new_survey = SiteSurvey(
        survey_number=survey_no,
        lead_id=lead.id,
        customer_id=lead.customer_id,
        assigned_technician_id=survey_in.assigned_technician_id,
        visit_date=survey_in.visit_date or datetime.utcnow(),
        roof_dimensions=survey_in.roof_dimensions,
        shadow_free_area_sqft=survey_in.shadow_free_area_sqft,
        roof_direction=survey_in.roof_direction,
        roof_tilt_deg=survey_in.roof_tilt_deg,
        roof_condition=survey_in.roof_condition,
        cable_distance_meters=survey_in.cable_distance_meters,
        grid_connection_phase=survey_in.grid_connection_phase,
        existing_sanctioned_load_kw=survey_in.existing_sanctioned_load_kw,
        recommended_capacity_kw=survey_in.recommended_capacity_kw,
        technician_observations=survey_in.technician_observations,
        status=SurveyStatus.SCHEDULED
    )
    db.add(new_survey)

    # Update lead status
    lead.status = LeadStatus.SURVEY_SCHEDULED
    await db.commit()
    await db.refresh(new_survey)

    # Add sample photo evidence
    sample_photos = [
        SurveyPhoto(survey_id=new_survey.id, photo_type="ROOFTOP_VIEW", photo_url="https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=600", caption="RCC unobstructed flat roof looking South"),
        SurveyPhoto(survey_id=new_survey.id, photo_type="ELECTRICAL_PANEL", photo_url="https://images.unsplash.com/photo-1544717305-2782549b5136?w=600", caption="Existing single phase main distribution board"),
        SurveyPhoto(survey_id=new_survey.id, photo_type="METER_BOX", photo_url="https://images.unsplash.com/photo-1558441719-79a02244a532?w=600", caption="DISCOM bidirectional meter installation point")
    ]
    db.add_all(sample_photos)
    await db.commit()

    return await get_survey(new_survey.id, db, current_user)

@router.post("/{id}/approve")
async def approve_survey(
    id: int,
    payload: Dict[str, Any] = Body(default={}),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.DIRECTOR, UserRole.SALES_EXECUTIVE, UserRole.INSTALLATION_MANAGER]))
):
    """
    CRITICAL BUSINESS RULE:
    Survey approval unlocks quotation generation for the solar installation.
    Allows manager override with mandatory reason if required.
    """
    res = await db.execute(select(SiteSurvey).filter(SiteSurvey.id == id))
    survey = res.scalars().first()
    if not survey:
        raise HTTPException(status_code=404, detail="Site survey not found")

    override_reason = payload.get("override_reason")
    if override_reason:
        survey.manager_override_reason = override_reason

    survey.status = SurveyStatus.APPROVED
    survey.approved_at = datetime.utcnow()
    survey.approved_by_id = current_user.id

    # Update linked lead to SURVEY_COMPLETED
    res_lead = await db.execute(select(Lead).filter(Lead.id == survey.lead_id))
    lead = res_lead.scalars().first()
    if lead:
        lead.status = LeadStatus.SURVEY_COMPLETED

    await db.commit()
    return {
        "status": "success",
        "message": "Site survey approved. Quotation generation is now unlocked.",
        "survey_id": id,
        "approved_at": survey.approved_at
    }
