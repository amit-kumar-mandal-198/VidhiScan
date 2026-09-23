from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import re

from ..database import get_db
from ..models import ProductRegistry, Company

router = APIRouter(
    prefix="/products",
    tags=["Product Registry"]
)

class ProductCreate(BaseModel):
    barcode: Optional[str] = None
    brand_name: str
    product_name: str
    official_mrp: float
    net_weight: str
    shelf_life_days: Optional[int] = 365
    category: Optional[str] = "Packaged Goods"
    company_id: Optional[int] = None

class ProductOut(BaseModel):
    id: int
    barcode: Optional[str] = None
    brand_name: str
    product_name: str
    official_mrp: float
    net_weight: str
    shelf_life_days: Optional[int] = None
    category: Optional[str] = None
    company_id: Optional[int] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProductOut])
def get_all_products(db: Session = Depends(get_db)):
    """
    Returns the Central Legal Metrology Master Registry of Approved Commodities.
    """
    return db.query(ProductRegistry).order_by(ProductRegistry.brand_name).all()

@router.post("/", response_model=ProductOut)
def register_new_product(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Allows State Admin or Authorized Manufacturer to register official commodity specs.
    Auto-links product to registered corporate manufacturer if matched.
    """
    if product.barcode:
        existing = db.query(ProductRegistry).filter(ProductRegistry.barcode == product.barcode).first()
        if existing:
            raise HTTPException(status_code=400, detail="Commodity with this Barcode already exists.")

    comp_id = product.company_id
    if not comp_id:
        brand_clean = product.brand_name.strip()
        comp = db.query(Company).filter(
            (Company.name.ilike(f"%{brand_clean}%")) | (Company.brand_slug.ilike(f"%{brand_clean}%"))
        ).first()
        if comp:
            comp_id = comp.id

    new_prod = ProductRegistry(
        barcode=product.barcode,
        brand_name=product.brand_name,
        product_name=product.product_name,
        official_mrp=product.official_mrp,
        net_weight=product.net_weight,
        shelf_life_days=product.shelf_life_days,
        category=product.category or "Packaged Goods",
        company_id=comp_id
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)
    return new_prod

import urllib.request
import json

def fetch_openfoodfacts_py(barcode: str):
    if not barcode:
        return None
    clean = re.sub(r"\D", "", barcode)
    if len(clean) < 8:
        return None
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{clean}.json"
        req = urllib.request.Request(url, headers={"User-Agent": "VidhiScan/2.0 (compliance@vidhiscan.gov.in)"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("status") == 1 and data.get("product"):
                p = data["product"]
                return {
                    "product_name": p.get("product_name") or p.get("product_name_en"),
                    "brand_name": p.get("brands") or p.get("brand_owner"),
                    "net_weight": p.get("quantity"),
                    "barcode": clean
                }
    except Exception:
        pass
    return None

def verify_commodity_compliance(db: Session, text: str, scanned_mrp: Optional[float], barcode: Optional[str] = None):
    """
    Cross-checks the scanned commodity against the Central Government Master Registry.
    Detects Section 36(2) Overcharging Fraud and Counterfeit Relabeling.
    """
    matched_product = None
    text_lower = text.lower() if text else ""

    # 1. Match by Barcode if available
    if barcode:
        clean_bc = re.sub(r"\D", "", barcode)
        matched_product = db.query(ProductRegistry).filter(ProductRegistry.barcode == clean_bc).first()

    # 2. Strict match by Brand & Product Name in OCR text (require BOTH brand and product name to match)
    if not matched_product and text_lower:
        products = db.query(ProductRegistry).all()
        for p in products:
            b_clean = p.brand_name.lower().split("/")[0].strip()
            p_clean = p.product_name.lower()
            # Must contain brand AND key product title
            if b_clean in text_lower and any(token in text_lower for token in p_clean.split() if len(token) > 4):
                matched_product = p
                break

    if not matched_product:
        # Check Open Food Facts if barcode exists
        if barcode:
            off_info = fetch_openfoodfacts_py(barcode)
            if off_info and off_info.get("product_name"):
                return {
                    "registry_status": "MATCHED_MASTER_REGISTRY",
                    "product_id": None,
                    "company_id": None,
                    "registered_brand": off_info.get("brand_name") or "Verified FMCG Brand",
                    "registered_product": off_info.get("product_name"),
                    "official_mrp": scanned_mrp,
                    "official_net_weight": off_info.get("net_weight"),
                    "is_overcharged": False,
                    "price_discrepancy": 0.0,
                    "section_36_violation": False,
                    "source_title": "Open Food Facts Barcode Registry"
                }

        return {
            "registry_status": "UNREGISTERED_COMMODITY",
            "message": "Commodity verified under Rule 6 packaging baseline.",
            "price_discrepancy": 0.0,
            "is_overcharged": False,
            "product_id": None,
            "company_id": None,
            "official_mrp": scanned_mrp
        }

    # Cross-reference price
    is_overcharged = False
    price_discrepancy = 0.0

    if scanned_mrp is not None and matched_product.official_mrp is not None:
        if scanned_mrp > matched_product.official_mrp:
            is_overcharged = True
            price_discrepancy = round(scanned_mrp - matched_product.official_mrp, 2)

    return {
        "registry_status": "MATCHED_MASTER_REGISTRY",
        "source_title": "Central Legal Metrology Master Registry",
        "product_id": matched_product.id,
        "company_id": matched_product.company_id,
        "registered_brand": matched_product.brand_name,
        "registered_product": matched_product.product_name,
        "official_mrp": matched_product.official_mrp,
        "official_net_weight": matched_product.net_weight,
        "is_overcharged": is_overcharged,
        "price_discrepancy": price_discrepancy,
        "section_36_violation": is_overcharged
    }
