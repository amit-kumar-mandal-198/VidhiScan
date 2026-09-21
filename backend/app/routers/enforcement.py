from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

from ..database import get_db
from ..models import Company, EnforcementAction, ScanReport, BadgeTier
from ..pdf_generator import generate_raid_warrant, generate_legal_notice
from ..score_engine import recalculate_company_score

router = APIRouter(
    prefix="/enforcement",
    tags=["Enforcement & Raid Radar"]
)

class EnforcementDispatch(BaseModel):
    company_id: int
    action_type: str # 'NOTICE', 'SURPRISE_AUDIT', 'RAID_ORDER', 'BADGE_REVOCATION'
    severity: Optional[str] = "MEDIUM" # 'LOW', 'MEDIUM', 'CRITICAL'
    officer_id: Optional[str] = "MAH-LM-HQ-SQ4"
    officer_notes: Optional[str] = None
    evidence_scan_id: Optional[int] = None
    deadline_days: Optional[int] = 15

@router.get("/actions")
def list_enforcement_actions(
    company_id: Optional[int] = None,
    action_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Returns history and active queue of enforcement orders, notices, and raids.
    """
    query = db.query(EnforcementAction)
    if company_id:
        query = query.filter(EnforcementAction.company_id == company_id)
    if action_type:
        query = query.filter(EnforcementAction.action_type == action_type)
    if status:
        query = query.filter(EnforcementAction.status == status)

    actions = query.order_by(EnforcementAction.id.desc()).limit(limit).all()

    result = []
    for a in actions:
        result.append({
            "id": a.id,
            "company_id": a.company_id,
            "company_name": a.company.name if a.company else "Unknown",
            "action_type": a.action_type,
            "severity": a.severity,
            "status": a.status,
            "officer_id": a.officer_id,
            "officer_notes": a.officer_notes,
            "document_url": a.document_url,
            "deadline_days": a.deadline_days,
            "created_at": str(a.created_at)
        })
    return result

@router.get("/raid-radar")
def get_raid_radar(db: Session = Depends(get_db)):
    """
    Command HQ Raid Radar: Identifies high-risk enterprises with low VidhiScore
    or chronic violations requiring immediate physical raids or surprise inspections.
    """
    high_risk_companies = db.query(Company).filter(
        (Company.current_vidhiscore < 600) | (Company.is_blacklisted == True) | (Company.active_violations_count >= 3)
    ).order_by(Company.current_vidhiscore.asc()).all()

    radar_items = []
    for c in high_risk_companies:
        tier_name = c.tier.tier_name if c.tier else "Unassigned"
        badge_code = c.tier.badge_code if c.tier else "bronze"

        # Determine recommended enforcement action
        if c.current_vidhiscore < 450 or c.is_blacklisted:
            recommended_action = "RAID_ORDER"
            priority = "CRITICAL"
        elif c.current_vidhiscore < 600:
            recommended_action = "SURPRISE_AUDIT"
            priority = "HIGH"
        else:
            recommended_action = "NOTICE"
            priority = "MEDIUM"

        radar_items.append({
            "company_id": c.id,
            "company_name": c.name,
            "brand_slug": c.brand_slug,
            "category": c.category,
            "address": c.address or "Maharashtra Jurisdiction",
            "gstin": c.gstin or "N/A",
            "current_vidhiscore": c.current_vidhiscore,
            "tier_name": tier_name,
            "badge_code": badge_code,
            "is_blacklisted": c.is_blacklisted,
            "active_violations_count": c.active_violations_count or 0,
            "clean_scans_streak": c.clean_scans_streak or 0,
            "recommended_action": recommended_action,
            "priority": priority
        })

    return radar_items

@router.post("/dispatch")
def dispatch_enforcement_action(
    payload: EnforcementDispatch,
    db: Session = Depends(get_db)
):
    """
    Issues and dispatches an official legal action:
    Generates a Search & Seizure Raid Warrant PDF or a Rule 6 Show-Cause Notice.
    """
    company = db.query(Company).filter(Company.id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Target company not found")

    action_type = payload.action_type.upper()
    valid_types = ["NOTICE", "SURPRISE_AUDIT", "RAID_ORDER", "BADGE_REVOCATION"]
    if action_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid action_type. Must be one of: {valid_types}")

    doc_url = None

    if action_type == "RAID_ORDER":
        warrant_data = {
            "company_name": company.name,
            "gstin": company.gstin,
            "address": company.address,
            "current_vidhiscore": company.current_vidhiscore,
            "tier_name": company.tier.tier_name if company.tier else "Defaulter",
            "officer_id": payload.officer_id or "MAH-LM-HQ-SQ4",
            "reason": payload.officer_notes or "Chronic Legal Metrology non-compliance & low VidhiScore.",
            "officer_notes": payload.officer_notes or "Immediate physical entry, inventory seizure and sealing ordered under Section 15.",
            "action_id": f"{company.id}-{int(datetime.now().timestamp())}"
        }
        doc_url = generate_raid_warrant(warrant_data)

    elif action_type == "NOTICE":
        notice_data = {
            "scan_id": payload.evidence_scan_id or f"CMP-{company.id}",
            "fraud_type": payload.officer_notes or "Section 36 / Rule 6 Packaging Statutory Non-Compliance",
            "scanned_mrp": "Discrepancy Documented",
            "scanned_mfg_date": "Omitted/Tampered",
            "scanned_exp_date": "Non-compliant",
            "scanned_net_weight": "Irregular"
        }
        doc_url = generate_legal_notice(notice_data, inspector_id=payload.officer_id or "MAH-LM-2026")

    elif action_type == "BADGE_REVOCATION":
        # Force downgrade to defaulter tier
        defaulter_tier = db.query(BadgeTier).filter(BadgeTier.badge_code == "defaulter").first()
        if defaulter_tier:
            company.tier_id = defaulter_tier.id
        company.is_blacklisted = True
        recalculate_company_score(
            db=db,
            company_id=company.id,
            points_delta=-100,
            reason="Executive badge revocation and trust seal cancellation by Legal Metrology Directorate."
        )

    # Record action in database
    action = EnforcementAction(
        company_id=company.id,
        action_type=action_type,
        severity=payload.severity or ("CRITICAL" if action_type == "RAID_ORDER" else "MEDIUM"),
        status="DISPATCHED",
        officer_id=payload.officer_id or "MAH-LM-HQ",
        officer_notes=payload.officer_notes,
        evidence_scan_id=payload.evidence_scan_id,
        document_url=doc_url,
        deadline_days=payload.deadline_days or 15
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    return {
        "status": "dispatched",
        "action_id": action.id,
        "action_type": action.action_type,
        "company_name": company.name,
        "document_url": doc_url,
        "message": f"Official {action.action_type} successfully executed against {company.name}."
    }

@router.post("/{action_id}/resolve")
def resolve_action(
    action_id: int,
    officer_notes: Optional[str] = "Compliance rectified, compounding fine deposited.",
    db: Session = Depends(get_db)
):
    """
    Marks an enforcement action as resolved and awards compliance recovery points.
    """
    action = db.query(EnforcementAction).filter(EnforcementAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Enforcement action not found")

    action.status = "RESOLVED"
    if officer_notes:
        action.officer_notes = f"{action.officer_notes or ''}\n[Resolution]: {officer_notes}"

    # Award recovery points
    recovery = recalculate_company_score(
        db=db,
        company_id=action.company_id,
        points_delta=40,
        reason=f"Action #{action.id} resolved: {officer_notes} (+40 pts compliance rehabilitation)."
    )

    db.commit()
    return {
        "status": "resolved",
        "action_id": action.id,
        "company_id": action.company_id,
        "updated_vidhiscore": recovery.get("current_score"),
        "tier_name": recovery.get("tier_name")
    }
