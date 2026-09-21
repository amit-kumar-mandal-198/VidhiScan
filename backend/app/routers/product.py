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

def verify_commodity_compliance(db: Session, text: str, scanned_mrp: Optional[float], barcode: Optional[str] = None):
    """
    Cross-checks the scanned commodity against the Central Government Master Registry.
    Detects Section 36(2) Overcharging Fraud and Counterfeit Relabeling.
    """
    matched_product = None
    text_lower = text.lower()

    # 1. Match by Barcode if available
    if barcode:
        matched_product = db.query(ProductRegistry).filter(ProductRegistry.barcode == barcode).first()

    # 2. Fuzzy match by Brand & Product Name in OCR text
    if not matched_product:
        products = db.query(ProductRegistry).all()
        for p in products:
            if p.brand_name.lower() in text_lower or p.product_name.lower() in text_lower:
                matched_product = p
                break

    if not matched_product:
        return {
            "registry_status": "UNREGISTERED_COMMODITY",
            "message": "Commodity not yet listed in Central Master Registry. Rule 6 baseline applied.",
            "price_discrepancy": 0.0,
            "is_overcharged": False,
            "product_id": None,
            "company_id": None
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
