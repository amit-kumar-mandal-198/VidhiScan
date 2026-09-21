from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
import re
from .models import BadgeTier, Company, CompanyScoreHistory, ProductRegistry

DEFAULT_TIERS = [
    {
        "tier_name": "Vidhi Ratna (Diamond)",
        "badge_code": "diamond",
        "min_score": 900,
        "max_score": 1000,
        "badge_color": "#10B981", # Emerald
        "icon_name": "Diamond",
        "description": "Exemplary Legal Metrology compliance. Green-channel e-commerce clearance.",
        "privileges": "Priority certification, Verified Trust Seal on packaging, Exemption from routine audits."
    },
    {
        "tier_name": "Vidhi Shrestha (Gold)",
        "badge_code": "gold",
        "min_score": 750,
        "max_score": 899,
        "badge_color": "#F59E0B", # Amber
        "icon_name": "Award",
        "description": "High consumer trust. Near-zero packaging infractions over 12 months.",
        "privileges": "Verified Gold badge on marketplace listings, Low audit frequency."
    },
    {
        "tier_name": "Vidhi Mitra (Silver)",
        "badge_code": "silver",
        "min_score": 600,
        "max_score": 749,
        "badge_color": "#64748B", # Slate
        "icon_name": "ShieldCheck",
        "description": "Standard regulatory compliance under normal quarterly surveillance.",
        "privileges": "Standard listing approval, Quarterly automated reporting."
    },
    {
        "tier_name": "Vidhi Chetna (Bronze Watchlist)",
        "badge_code": "bronze",
        "min_score": 450,
        "max_score": 599,
        "badge_color": "#EA580C", # Orange
        "icon_name": "AlertTriangle",
        "description": "Marginal compliance. Multiple packaging omissions or minor overcharges.",
        "privileges": "Subject to 30-day compliance audits and automated show-cause notices."
    },
    {
        "tier_name": "Defaulter (Red Flag)",
        "badge_code": "defaulter",
        "min_score": 0,
        "max_score": 449,
        "badge_color": "#EF4444", # Red
        "icon_name": "ShieldAlert",
        "description": "Critical non-compliance, deliberate tampering, or chronic overcharging.",
        "privileges": "Trust badge revoked. Target for immediate surprise raids and retail seizure."
    }
]

def seed_default_badge_tiers(db: Session):
    """
    Initializes standard regulatory badge tiers if not already present.
    """
    existing_count = db.query(BadgeTier).count()
    if existing_count == 0:
        for t in DEFAULT_TIERS:
            tier = BadgeTier(**t)
            db.add(tier)
        db.commit()

def get_tier_for_score(db: Session, score: int) -> Optional[BadgeTier]:
    """
    Finds the active badge tier matching the given score.
    """
    return db.query(BadgeTier).filter(
        BadgeTier.min_score <= score,
        BadgeTier.max_score >= score
    ).first()

def seed_default_companies_if_empty(db: Session):
    """
    Ensures baseline corporate brands exist and associates products to them.
    """
    seed_default_badge_tiers(db)

    if db.query(Company).count() == 0:
        gold_tier = db.query(BadgeTier).filter(BadgeTier.badge_code == "gold").first()
        diamond_tier = db.query(BadgeTier).filter(BadgeTier.badge_code == "diamond").first()
        silver_tier = db.query(BadgeTier).filter(BadgeTier.badge_code == "silver").first()
        bronze_tier = db.query(BadgeTier).filter(BadgeTier.badge_code == "bronze").first()
        defaulter_tier = db.query(BadgeTier).filter(BadgeTier.badge_code == "defaulter").first()

        sample_companies = [
            {
                "name": "Amul / GCMMF",
                "brand_slug": "amul",
                "gstin": "24AAAAA0000A1Z5",
                "cin": "U15200GJ1973SGC002410",
                "contact_email": "compliance@amul.coop",
                "contact_phone": "+91 1800 258 3333",
                "address": "Amul Dairy Road, Anand - 388001, Gujarat",
                "category": "Dairy & Edible Oils",
                "current_vidhiscore": 940,
                "tier_id": diamond_tier.id if diamond_tier else None,
                "active_violations_count": 0,
                "total_scans_count": 184,
                "clean_scans_streak": 42
            },
            {
                "name": "Hindustan Unilever Ltd",
                "brand_slug": "hul",
                "gstin": "27AAACH1770F1ZI",
                "cin": "L15140MH1933PLC002030",
                "contact_email": "legal.metrology@unilever.com",
                "contact_phone": "+91 1800 102 2221",
                "address": "Unilever House, B.D. Sawant Marg, Andheri (E), Mumbai 400099",
                "category": "Household & Detergents",
                "current_vidhiscore": 860,
                "tier_id": gold_tier.id if gold_tier else None,
                "active_violations_count": 1,
                "total_scans_count": 210,
                "clean_scans_streak": 14
            },
            {
                "name": "Nestle India Limited",
                "brand_slug": "nestle",
                "gstin": "06AAACN0149G1Z7",
                "cin": "L15202DL1959PLC003250",
                "contact_email": "regulatory@in.nestle.com",
                "contact_phone": "+91 1800 266 1188",
                "address": "100/101, World Trade Centre, Barakhamba Lane, New Delhi 110001",
                "category": "Packaged Snacks & Confectionery",
                "current_vidhiscore": 790,
                "tier_id": gold_tier.id if gold_tier else None,
                "active_violations_count": 2,
                "total_scans_count": 165,
                "clean_scans_streak": 6
            },
            {
                "name": "Fortune / Adani Wilmar",
                "brand_slug": "adani-wilmar",
                "gstin": "24AAACA5912K1Z9",
                "cin": "L15146GJ1999PLC035320",
                "contact_email": "qa@adaniwilmar.in",
                "contact_phone": "+91 1800 572 7700",
                "address": "Fortune House, Near Navrangpura Rly Crossing, Ahmedabad 380009",
                "category": "Dairy & Edible Oils",
                "current_vidhiscore": 680,
                "tier_id": silver_tier.id if silver_tier else None,
                "active_violations_count": 4,
                "total_scans_count": 120,
                "clean_scans_streak": 3
            },
            {
                "name": "Metro Cash & Carry Wholesale Repackers",
                "brand_slug": "metro-repack",
                "gstin": "29AAACM6942D1Z3",
                "cin": "U51909KA2001PLC029800",
                "contact_email": "compliance@metro.co.in",
                "contact_phone": "+91 80 4344 1200",
                "address": "Yeshwantpur Industrial Area, Bangalore 560022",
                "category": "Bulk Commodity Repackaging",
                "current_vidhiscore": 520,
                "tier_id": bronze_tier.id if bronze_tier else None,
                "active_violations_count": 7,
                "total_scans_count": 89,
                "clean_scans_streak": 0
            },
            {
                "name": "Kalyan Relabeling & Counterfeit Syndicate",
                "brand_slug": "kalyan-syndicate",
                "gstin": "27AABCK9999P1Z1",
                "cin": "U15400MH2022PTC384000",
                "contact_email": "flagged@vidhiscan.local",
                "contact_phone": "+91 98200 00000",
                "address": "Kalyan-Bhiwandi Road Godown 12, Thane, Maharashtra",
                "category": "Packaged Snacks & Confectionery",
                "current_vidhiscore": 340,
                "tier_id": defaulter_tier.id if defaulter_tier else None,
                "is_blacklisted": True,
                "active_violations_count": 15,
                "total_scans_count": 44,
                "clean_scans_streak": 0
            }
        ]

        created_companies = {}
        for comp_data in sample_companies:
            comp = Company(**comp_data)
            db.add(comp)
            db.flush()
            created_companies[comp.name] = comp

            # Add initial history entry
            history = CompanyScoreHistory(
                company_id=comp.id,
                previous_score=750,
                new_score=comp.current_vidhiscore,
                points_delta=comp.current_vidhiscore - 750,
                reason="Initial baseline audit and onboarding compliance calibration."
            )
            db.add(history)

        db.commit()

        # Link existing products in ProductRegistry to companies
        products = db.query(ProductRegistry).all()
        for p in products:
            for c_name, comp in created_companies.items():
                if comp.brand_slug in p.brand_name.lower() or p.brand_name.lower() in c_name.lower():
                    p.company_id = comp.id
                    break
        db.commit()

def match_company_for_scan(db: Session, text: str, barcode: Optional[str] = None, brand_name: Optional[str] = None) -> Optional[Company]:
    """
    Finds the Company related to a scanned product via Barcode, Brand Name, or OCR raw text.
    """
    # 1. Match via Product Registry if barcode matches
    if barcode:
        prod = db.query(ProductRegistry).filter(ProductRegistry.barcode == barcode).first()
        if prod and prod.company_id:
            return db.query(Company).filter(Company.id == prod.company_id).first()

    # 2. Match via brand name
    if brand_name:
        brand_clean = brand_name.lower().strip()
        comp = db.query(Company).filter(
            (Company.name.ilike(f"%{brand_clean}%")) | (Company.brand_slug == brand_clean)
        ).first()
        if comp:
            return comp

    # 3. Match via raw OCR text fuzzy check
    if text:
        text_lower = text.lower()
        companies = db.query(Company).all()
        for c in companies:
            if c.brand_slug in text_lower or c.name.lower() in text_lower:
                return c

    return None

def recalculate_company_score(
    db: Session,
    company_id: int,
    points_delta: int,
    reason: str,
    scan_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Adjusts a company's VidhiScore, updates their Badge Tier, records history,
    and returns a summary dictionary.
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        return {"error": "Company not found"}

    prev_score = company.current_vidhiscore
    new_score = max(0, min(1000, prev_score + points_delta))

    company.current_vidhiscore = new_score
    company.total_scans_count = (company.total_scans_count or 0) + 1

    if points_delta < 0:
        company.active_violations_count = (company.active_violations_count or 0) + 1
        company.clean_scans_streak = 0
    else:
        company.clean_scans_streak = (company.clean_scans_streak or 0) + 1

    # Blacklist check
    if new_score < 450:
        company.is_blacklisted = True
    elif new_score >= 600 and company.is_blacklisted:
        company.is_blacklisted = False

    # Lookup new BadgeTier
    new_tier = get_tier_for_score(db, new_score)
    tier_changed = False
    if new_tier and company.tier_id != new_tier.id:
        company.tier_id = new_tier.id
        tier_changed = True

    # Audit history log
    history = CompanyScoreHistory(
        company_id=company.id,
        previous_score=prev_score,
        new_score=new_score,
        points_delta=points_delta,
        reason=reason,
        scan_id=scan_id
    )
    db.add(history)
    db.commit()
    db.refresh(company)

    return {
        "company_id": company.id,
        "company_name": company.name,
        "previous_score": prev_score,
        "current_score": new_score,
        "points_delta": points_delta,
        "tier_name": company.tier.tier_name if company.tier else "Unassigned",
        "badge_code": company.tier.badge_code if company.tier else "silver",
        "badge_color": company.tier.badge_color if company.tier else "#64748B",
        "is_blacklisted": company.is_blacklisted,
        "tier_changed": tier_changed,
        "reason": reason
    }

def evaluate_scan_impact(
    db: Session,
    company: Company,
    is_compliant: bool,
    violations: List[str],
    is_overcharged: bool,
    price_discrepancy: float,
    scan_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Computes points delta based on Legal Metrology Rules and updates score.
    """
    points_delta = 0
    reasons = []

    if is_compliant:
        points_delta = +10
        reasons.append("Verified 100% compliant statutory label under Rule 6 (+10 pts).")
    else:
        if is_overcharged:
            penalty = 150
            if price_discrepancy > 50:
                penalty += 50
            points_delta -= penalty
            reasons.append(f"Section 36(2) Overcharging infraction: Scanned price exceeded legal MRP by ₹{price_discrepancy} (-{penalty} pts).")

        # Check for expiry or tampering
        for v in violations:
            v_lower = v.lower()
            if "expired" in v_lower or "tamper" in v_lower or "sticker" in v_lower:
                points_delta -= 100
                reasons.append(f"Critical date tampering or relabeling fraud (-100 pts): {v}")
                break

        # Check for omitted mandatory declaration
        if any("rule 6" in v.lower() or "missing" in v.lower() for v in violations):
            points_delta -= 60
            reasons.append("Missing mandatory statutory declarations under Rule 6 (-60 pts).")

        # Fallback if no specific condition met but not compliant
        if points_delta == 0:
            points_delta = -40
            reasons.append(f"Statutory labeling non-compliance: {', '.join(violations[:2])} (-40 pts).")

    full_reason = " | ".join(reasons)
    return recalculate_company_score(
        db=db,
        company_id=company.id,
        points_delta=points_delta,
        reason=full_reason,
        scan_id=scan_id
    )
