from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
import re

from ..database import get_db
from ..models import Company, BadgeTier, CompanyScoreHistory, ProductRegistry, EnforcementAction
from ..score_engine import get_tier_for_score, recalculate_company_score

router = APIRouter(
    prefix="/companies",
    tags=["Companies & Badges"]
)

class BadgeTierOut(BaseModel):
    id: int
    tier_name: str
    badge_code: str
    min_score: int
    max_score: int
    badge_color: str
    icon_name: str
    description: Optional[str] = None
    privileges: Optional[str] = None

    class Config:
        from_attributes = True

class BadgeTierCreate(BaseModel):
    tier_name: str
    badge_code: str
    min_score: int
    max_score: int
    badge_color: str
    icon_name: str = "Award"
    description: Optional[str] = None
    privileges: Optional[str] = None

class CompanyCreate(BaseModel):
    name: str
    brand_slug: Optional[str] = None
    gstin: Optional[str] = None
    cin: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = "FMCG & Packaged Goods"

class CompanyOut(BaseModel):
    id: int
    name: str
    brand_slug: str
    gstin: Optional[str] = None
    cin: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    category: str
    current_vidhiscore: int
    tier: Optional[BadgeTierOut] = None
    is_blacklisted: bool
    active_violations_count: int
    total_scans_count: int
    clean_scans_streak: int
    products_count: Optional[int] = 0

    class Config:
        from_attributes = True

@router.get("/tiers", response_model=List[BadgeTierOut])
def get_all_tiers(db: Session = Depends(get_db)):
    """
    Returns all configurable VidhiScan Grade & Badge Tiers.
    """
    return db.query(BadgeTier).order_by(BadgeTier.min_score.desc()).all()

@router.post("/tiers", response_model=BadgeTierOut)
def create_or_update_tier(tier_in: BadgeTierCreate, db: Session = Depends(get_db)):
    """
    Allows Admin to configure new badge tiers or update thresholds dynamically.
    """
    existing = db.query(BadgeTier).filter(BadgeTier.badge_code == tier_in.badge_code).first()
    if existing:
        for k, v in tier_in.dict().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing

    new_tier = BadgeTier(**tier_in.dict())
    db.add(new_tier)
    db.commit()
    db.refresh(new_tier)
    return new_tier

@router.get("/")
def list_companies(
    tier: Optional[str] = None,
    search: Optional[str] = None,
    blacklisted: Optional[bool] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Public Brand Trust Directory: Lists companies, their live VidhiScore,
    active Badges, and compliance metrics.
    """
    query = db.query(Company)

    if tier:
        query = query.join(Company.tier).filter(BadgeTier.badge_code == tier)
    if search:
        query = query.filter((Company.name.ilike(f"%{search}%")) | (Company.brand_slug.ilike(f"%{search}%")))
    if blacklisted is not None:
        query = query.filter(Company.is_blacklisted == blacklisted)

    companies = query.order_by(Company.current_vidhiscore.desc()).limit(limit).all()

    result = []
    for c in companies:
        prod_count = db.query(ProductRegistry).filter(ProductRegistry.company_id == c.id).count()
        result.append({
            "id": c.id,
            "name": c.name,
            "brand_slug": c.brand_slug,
            "gstin": c.gstin,
            "cin": c.cin,
            "contact_email": c.contact_email,
            "contact_phone": c.contact_phone,
            "address": c.address,
            "category": c.category,
            "current_vidhiscore": c.current_vidhiscore,
            "tier": {
                "id": c.tier.id,
                "tier_name": c.tier.tier_name,
                "badge_code": c.tier.badge_code,
                "min_score": c.tier.min_score,
                "max_score": c.tier.max_score,
                "badge_color": c.tier.badge_color,
                "icon_name": c.tier.icon_name,
                "description": c.tier.description,
                "privileges": c.tier.privileges
            } if c.tier else None,
            "is_blacklisted": c.is_blacklisted,
            "active_violations_count": c.active_violations_count or 0,
            "total_scans_count": c.total_scans_count or 0,
            "clean_scans_streak": c.clean_scans_streak or 0,
            "products_count": prod_count
        })

    return result

@router.get("/{company_id}")
def get_company_profile(company_id: int, db: Session = Depends(get_db)):
    """
    Returns full company profile with registered product catalog,
    score history timeline, and enforcement records.
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    products = db.query(ProductRegistry).filter(ProductRegistry.company_id == company.id).all()
    history = db.query(CompanyScoreHistory).filter(
        CompanyScoreHistory.company_id == company.id
    ).order_by(CompanyScoreHistory.id.desc()).limit(25).all()
    actions = db.query(EnforcementAction).filter(
        EnforcementAction.company_id == company.id
    ).order_by(EnforcementAction.id.desc()).all()

    return {
        "company": {
            "id": company.id,
            "name": company.name,
            "brand_slug": company.brand_slug,
            "gstin": company.gstin,
            "cin": company.cin,
            "contact_email": company.contact_email,
            "contact_phone": company.contact_phone,
            "address": company.address,
            "category": company.category,
            "current_vidhiscore": company.current_vidhiscore,
            "tier": {
                "id": company.tier.id,
                "tier_name": company.tier.tier_name,
                "badge_code": company.tier.badge_code,
                "badge_color": company.tier.badge_color,
                "icon_name": company.tier.icon_name,
                "description": company.tier.description,
                "privileges": company.tier.privileges
            } if company.tier else None,
            "is_blacklisted": company.is_blacklisted,
            "active_violations_count": company.active_violations_count,
            "total_scans_count": company.total_scans_count,
            "clean_scans_streak": company.clean_scans_streak,
            "created_at": str(company.created_at)
        },
        "products": [
            {
                "id": p.id,
                "barcode": p.barcode,
                "brand_name": p.brand_name,
                "product_name": p.product_name,
                "official_mrp": p.official_mrp,
                "net_weight": p.net_weight,
                "category": p.category
            } for p in products
        ],
        "score_history": [
            {
                "id": h.id,
                "previous_score": h.previous_score,
                "new_score": h.new_score,
                "points_delta": h.points_delta,
                "reason": h.reason,
                "scan_id": h.scan_id,
                "created_at": str(h.created_at)
            } for h in history
        ],
        "enforcement_actions": [
            {
                "id": a.id,
                "action_type": a.action_type,
                "severity": a.severity,
                "status": a.status,
                "officer_id": a.officer_id,
                "officer_notes": a.officer_notes,
                "document_url": a.document_url,
                "deadline_days": a.deadline_days,
                "created_at": str(a.created_at)
            } for a in actions
        ]
    }

@router.post("/")
def register_company(company_in: CompanyCreate, db: Session = Depends(get_db)):
    """
    Onboarding endpoint for Manufacturers to register their brand.
    Automatically initializes VidhiScore to 750 (Silver) with certified baseline.
    """
    # Auto-generate brand_slug if not given
    slug = company_in.brand_slug or re.sub(r'[^a-zA-Z0-9]', '-', company_in.name.lower()).strip('-')
    
    existing = db.query(Company).filter(
        (Company.name == company_in.name) | (Company.brand_slug == slug)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A company with this name or slug already exists.")

    silver_tier = db.query(BadgeTier).filter(BadgeTier.badge_code == "silver").first()
    initial_score = 750

    new_company = Company(
        name=company_in.name,
        brand_slug=slug,
        gstin=company_in.gstin,
        cin=company_in.cin,
        contact_email=company_in.contact_email,
        contact_phone=company_in.contact_phone,
        address=company_in.address,
        category=company_in.category or "FMCG & Packaged Goods",
        current_vidhiscore=initial_score,
        tier_id=silver_tier.id if silver_tier else None,
        is_blacklisted=False,
        active_violations_count=0,
        total_scans_count=0,
        clean_scans_streak=0
    )
    db.add(new_company)
    db.flush()

    # Initial history record
    init_history = CompanyScoreHistory(
        company_id=new_company.id,
        previous_score=750,
        new_score=750,
        points_delta=0,
        reason="Corporate registration & initial Legal Metrology compliance onboarding."
    )
    db.add(init_history)
    db.commit()
    db.refresh(new_company)

    return {
        "status": "success",
        "message": f"Brand '{new_company.name}' successfully registered with initial VidhiScore 750.",
        "company_id": new_company.id,
        "brand_slug": new_company.brand_slug,
        "current_vidhiscore": new_company.current_vidhiscore,
        "badge": silver_tier.tier_name if silver_tier else "Silver"
    }

@router.get("/{company_id}/badge-embed")
def get_badge_embed(company_id: int, db: Session = Depends(get_db)):
    """
    Provides trust badge embed code for e-commerce platforms and brand websites.
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    tier_name = company.tier.tier_name if company.tier else "Vidhi Mitra (Silver)"
    badge_code = company.tier.badge_code if company.tier else "silver"
    color = company.tier.badge_color if company.tier else "#64748B"

    embed_html = (
        f'<div style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;'
        f'background:#ffffff;border:1px solid {color};border-radius:8px;'
        f'font-family:sans-serif;font-size:12px;font-weight:600;color:#111827;">'
        f'<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:{color};"></span>'
        f'<span>VidhiScan Verified: {tier_name} ({company.current_vidhiscore}/1000)</span>'
        f'</div>'
    )

    return {
        "company_id": company.id,
        "company_name": company.name,
        "vidhiscore": company.current_vidhiscore,
        "tier_name": tier_name,
        "badge_code": badge_code,
        "color": color,
        "embed_html": embed_html
    }
