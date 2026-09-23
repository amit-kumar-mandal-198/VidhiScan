from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
import shutil
import os
import re
import uuid
import cv2
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import ScanReport, Company, ProductRegistry
from ..ai_engine import analyze_label
from .product import verify_commodity_compliance
from ..score_engine import match_company_for_scan, evaluate_scan_impact
from ..pdf_generator import generate_legal_notice

router = APIRouter(
    prefix="/scans",
    tags=["Scans"]
)

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def detect_barcode_from_image(image_path: str):
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None
        if hasattr(cv2, 'barcode'):
            bd = cv2.barcode.BarcodeDetector()
            ok, decoded_info, decoded_type, _ = bd.detectAndDecode(img)
            if ok and decoded_info and len(decoded_info[0]) > 0:
                return str(decoded_info[0]).strip()
        qd = cv2.QRCodeDetector()
        data, _, _ = qd.detectAndDecode(img)
        if data:
            return str(data).strip()
    except Exception:
        pass
    return None

@router.get("/")
def list_scans(limit: int = 20, db: Session = Depends(get_db)):
    """
    Returns recent scans for inspector review.
    """
    scans = db.query(ScanReport).order_by(ScanReport.id.desc()).limit(limit).all()
    return scans

@router.post("/upload")
async def upload_and_scan(
    file: Optional[UploadFile] = File(None),
    files: Optional[List[UploadFile]] = File(None),
    inspected_by: str = Form("Public"),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    location_name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Endpoint for the public or inspector to upload single or multiple product images (e.g. Front & Back).
    Saves images, runs OCR + Rule Engine across all faces, cross-checks with Government Master Registry,
    and updates Company VidhiScore.
    """
    upload_list: List[UploadFile] = []
    if files:
        upload_list.extend(files)
    if file:
        upload_list.append(file)
    if not upload_list:
        raise HTTPException(status_code=400, detail="No image file provided.")

    saved_paths: List[str] = []
    for f in upload_list:
        file_extension = f.filename.split('.')[-1] if '.' in f.filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(f.file, buffer)
        saved_paths.append(file_path)

    # Run AI Engine on primary face and combine with additional faces
    primary_path = saved_paths[0]
    try:
        ai_result = analyze_label(primary_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")

    for extra_path in saved_paths[1:]:
        try:
            extra_ai = analyze_label(extra_path)
            ai_result["raw_text"] = (ai_result.get("raw_text", "") + "\n" + extra_ai.get("raw_text", "")).strip()
            for key in ["scanned_mrp", "mrp", "mfg_date", "exp_date", "manufacturer", "consumer_care", "net_weight", "barcode"]:
                if not ai_result["verdict"].get(key) and extra_ai["verdict"].get(key):
                    ai_result["verdict"][key] = extra_ai["verdict"][key]
        except Exception:
            pass

    file_path = primary_path
    verdict = ai_result["verdict"]

    # 3. Barcode Detection
    barcode = detect_barcode_from_image(file_path)
    if not barcode:
        barcode = ai_result.get("barcode_detected") or verdict.get("barcode")
    ai_result["barcode_detected"] = barcode

    # Clean numeric MRP for database & registry check
    clean_mrp = None
    if verdict.get("scanned_mrp") is not None:
        try:
            clean_mrp = float(verdict["scanned_mrp"])
        except Exception:
            clean_mrp = None
    elif verdict.get("mrp"):
        try:
            clean_mrp = float(re.sub(r"[^\d.]", "", str(verdict["mrp"])))
        except Exception:
            clean_mrp = None
    verdict["scanned_mrp"] = clean_mrp

    # 4. Cross-Reference against Government Master Registry
    registry_check = verify_commodity_compliance(db, ai_result["raw_text"], clean_mrp, barcode)
    ai_result["master_registry"] = registry_check

    # Compute baseline passed rules count
    passed_count = sum(1 for d in verdict.get("declarations", {}).values() if d.get("status") in ["COMPLIANT", "PROVISO_COMPLIANT"])

    # If product matched master registry, ensure registered net weight and brand are reflected
    if registry_check.get("registry_status") == "MATCHED_MASTER_REGISTRY":
        off_net_qty = registry_check.get("official_net_weight")
        if off_net_qty:
            if not verdict.get("net_weight") or verdict["declarations"]["rule_2_net_qty"]["status"] == "MISSING":
                verdict["net_weight"] = off_net_qty
                verdict["declarations"]["rule_2_net_qty"]["value"] = off_net_qty
                verdict["declarations"]["rule_2_net_qty"]["status"] = "COMPLIANT"
                verdict["violations"] = [v for v in verdict.get("violations", []) if "Rule 6(1)(b)" not in v and "Net Quantity" not in v]

        if not verdict.get("manufacturer") or verdict["declarations"]["rule_1_mfg_name"]["status"] == "MISSING":
            verdict["manufacturer"] = registry_check.get("registered_brand")
            verdict["declarations"]["rule_1_mfg_name"]["value"] = registry_check.get("registered_brand")
            verdict["declarations"]["rule_1_mfg_name"]["status"] = "COMPLIANT"
            verdict["violations"] = [v for v in verdict.get("violations", []) if "Rule 6(1)(a)" not in v and "Manufacturer" not in v]

        # Recount passed rules and re-evaluate compliance
        passed_count = sum(1 for d in verdict["declarations"].values() if d["status"] in ["COMPLIANT", "PROVISO_COMPLIANT"])
        verdict["rules_passed"] = passed_count
        verdict["compliance_score"] = round((passed_count / len(verdict["declarations"])) * 100)

    if registry_check.get("is_overcharged"):
        diff = registry_check["price_discrepancy"]
        off_mrp = registry_check["official_mrp"]
        overcharge_msg = f"Section 36(2) Retail Overcharging: Scanned ₹{clean_mrp} exceeds Legal Max MRP ₹{off_mrp} (+₹{diff})"
        verdict["violations"].insert(0, overcharge_msg)
        verdict["is_compliant"] = False
        verdict["compliance_score"] = max(0, verdict["compliance_score"] - 30)
    elif passed_count >= 7:
        verdict["is_compliant"] = True
    
    # 5. Determine Fraud Type
    fraud_type = None
    if not verdict["is_compliant"]:
        fraud_type = ", ".join(verdict["violations"])
        
    # 6. Match Company for Brand Trust & VidhiScore
    matched_company = None
    if registry_check.get("company_id"):
        matched_company = db.query(Company).filter(Company.id == registry_check["company_id"]).first()
    if not matched_company:
        matched_company = match_company_for_scan(db, ai_result["raw_text"], barcode, verdict.get("manufacturer"))

    # Sanitize Form parameter inputs
    safe_lat = None
    try:
        if latitude is not None and not hasattr(latitude, 'default') and str(latitude).strip() != "":
            safe_lat = float(latitude)
    except Exception:
        safe_lat = None

    safe_lng = None
    try:
        if longitude is not None and not hasattr(longitude, 'default') and str(longitude).strip() != "":
            safe_lng = float(longitude)
    except Exception:
        safe_lng = None

    safe_loc = None
    if location_name is not None and not hasattr(location_name, 'default'):
        safe_loc = str(location_name)

    safe_inspected_by = "Public"
    if inspected_by is not None and not hasattr(inspected_by, 'default') and str(inspected_by).strip() != "":
        safe_inspected_by = str(inspected_by)

    # 7. Save to Database
    db_scan = ScanReport(
        image_path=f"/{file_path}",
        barcode_detected=barcode,
        scanned_mrp=clean_mrp,
        scanned_mfg_date=str(verdict.get("mfg_date") or ""),
        scanned_exp_date=str(verdict.get("exp_date") or ""),
        scanned_net_weight=str(verdict.get("net_weight") or ""),
        is_compliant=bool(verdict.get("is_compliant", False)),
        fraud_type=fraud_type,
        inspected_by=safe_inspected_by,
        latitude=safe_lat,
        longitude=safe_lng,
        location_name=safe_loc,
        product_id=registry_check.get("product_id"),
        company_id=matched_company.id if matched_company else None
    )
    
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)

    # 8. Auto-generate PDF report with evidence photo for every scan
    scan_pdf_data = {
        "scan_id": db_scan.id,
        "is_compliant": bool(verdict.get("is_compliant", False)),
        "commodity": verdict.get("commodity") or "Packaged Retail Commodity",
        "fraud_type": fraud_type,
        "violations": verdict.get("violations", []),
        "compliance_score": verdict.get("compliance_score", 100),
        "rules_passed": verdict.get("rules_passed", 8),
        "scanned_mrp": clean_mrp,
        "scanned_mfg_date": str(verdict.get("mfg_date") or ""),
        "scanned_exp_date": str(verdict.get("exp_date") or ""),
        "scanned_net_weight": str(verdict.get("net_weight") or ""),
        "manufacturer": str(verdict.get("manufacturer") or ""),
        "inspected_by": safe_inspected_by,
        "location_name": safe_loc or "Maharashtra Metro Zone",
        "declarations": verdict.get("declarations"),
        "image_path": db_scan.image_path
    }
    try:
        pdf_url = generate_legal_notice(scan_pdf_data, inspector_id=safe_inspected_by)
        db_scan.notice_url = pdf_url
        db.commit()
        db.refresh(db_scan)
    except Exception as pdf_err:
        pdf_url = None

    # 9. Dynamic VidhiScore & Badge Impact
    company_score_impact = None
    if matched_company:
        company_score_impact = evaluate_scan_impact(
            db=db,
            company=matched_company,
            is_compliant=bool(verdict.get("is_compliant", False)),
            violations=verdict.get("violations", []),
            is_overcharged=bool(registry_check.get("is_overcharged", False)),
            price_discrepancy=float(registry_check.get("price_discrepancy", 0.0)),
            scan_id=db_scan.id
        )
        ai_result["company_profile"] = {
            "company_id": matched_company.id,
            "company_name": matched_company.name,
            "brand_slug": matched_company.brand_slug,
            "current_vidhiscore": matched_company.current_vidhiscore,
            "tier_name": matched_company.tier.tier_name if matched_company.tier else "Unassigned",
            "badge_code": matched_company.tier.badge_code if matched_company.tier else "silver",
            "badge_color": matched_company.tier.badge_color if matched_company.tier else "#64748B",
            "is_blacklisted": matched_company.is_blacklisted,
            "score_update": company_score_impact
        }
    else:
        ai_result["company_profile"] = None
    
    return {
        "scan_id": db_scan.id,
        "image_url": db_scan.image_path,
        "pdf_url": db_scan.notice_url,
        "ai_analysis": ai_result
    }

@router.post("/{scan_id}/generate-notice")
async def create_notice(scan_id: int, db: Session = Depends(get_db)):
    """
    Generates a PDF legal notice / inspection report for a specific scan.
    """
    scan_report = db.query(ScanReport).filter(ScanReport.id == scan_id).first()
    if not scan_report:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    scan_data = {
        "scan_id": scan_report.id,
        "is_compliant": scan_report.is_compliant,
        "fraud_type": scan_report.fraud_type,
        "scanned_mrp": scan_report.scanned_mrp,
        "scanned_mfg_date": scan_report.scanned_mfg_date,
        "scanned_exp_date": scan_report.scanned_exp_date,
        "scanned_net_weight": scan_report.scanned_net_weight,
        "inspected_by": scan_report.inspected_by or "Public",
        "location_name": scan_report.location_name or "Maharashtra Metro Zone",
        "image_path": scan_report.image_path
    }
    
    pdf_url = generate_legal_notice(scan_data)
    scan_report.notice_url = pdf_url
    db.commit()
    db.refresh(scan_report)
    
    return {"status": "success", "pdf_url": pdf_url}
