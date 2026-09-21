from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="public") # roles: public, inspector, admin, manufacturer
    is_active = Column(Boolean, default=True)
    
    scans = relationship("ScanReport", back_populates="user")

class BadgeTier(Base):
    __tablename__ = "badge_tiers"

    id = Column(Integer, primary_key=True, index=True)
    tier_name = Column(String, unique=True, index=True) # e.g. "Vidhi Ratna (Diamond)", "Vidhi Shrestha (Gold)", etc.
    badge_code = Column(String, unique=True, index=True) # "diamond", "gold", "silver", "bronze", "defaulter"
    min_score = Column(Integer)
    max_score = Column(Integer)
    badge_color = Column(String) # Hex or tailwind badge theme
    icon_name = Column(String) # Lucide icon name
    description = Column(String, nullable=True)
    privileges = Column(String, nullable=True)

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    brand_slug = Column(String, unique=True, index=True)
    gstin = Column(String, nullable=True)
    cin = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    category = Column(String, default="FMCG & Packaged Goods")
    
    current_vidhiscore = Column(Integer, default=750) # 0 to 1000 scale
    tier_id = Column(Integer, ForeignKey("badge_tiers.id"), nullable=True)
    tier = relationship("BadgeTier")

    is_blacklisted = Column(Boolean, default=False)
    active_violations_count = Column(Integer, default=0)
    total_scans_count = Column(Integer, default=0)
    clean_scans_streak = Column(Integer, default=0)
    
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    products = relationship("ProductRegistry", back_populates="company")
    score_history = relationship("CompanyScoreHistory", back_populates="company", order_by="desc(CompanyScoreHistory.id)")
    enforcement_actions = relationship("EnforcementAction", back_populates="company", order_by="desc(EnforcementAction.id)")

class ProductRegistry(Base):
    __tablename__ = "product_registry"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True, nullable=True)
    brand_name = Column(String, index=True)
    product_name = Column(String)
    official_mrp = Column(Float)
    net_weight = Column(String)
    shelf_life_days = Column(Integer, default=365)
    category = Column(String, default="Packaged Goods")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    company = relationship("Company", back_populates="products")
    scans = relationship("ScanReport", back_populates="product")

class ScanReport(Base):
    __tablename__ = "scan_reports"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String)
    barcode_detected = Column(String, nullable=True)
    
    # OCR Extracted Fields
    scanned_mrp = Column(Float, nullable=True)
    scanned_mfg_date = Column(String, nullable=True)
    scanned_exp_date = Column(String, nullable=True)
    scanned_net_weight = Column(String, nullable=True)
    
    # AI Verdict
    is_compliant = Column(Boolean, default=False)
    fraud_type = Column(String, nullable=True) # e.g., 'MRP_TAMPERED', 'EXPIRED', 'NO_BARCODE'
    notice_url = Column(String, nullable=True) # Link to official generated legal notice PDF
    inspected_by = Column(String, default="Public") # "Public" or Inspector ID e.g. "MAH-LM-2026"
    
    # Real GPS Coordinates & Geotagging
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String, nullable=True)
    
    # Relationships
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Null if public anonymous scan
    user = relationship("User", back_populates="scans")
    
    product_id = Column(Integer, ForeignKey("product_registry.id"), nullable=True)
    product = relationship("ProductRegistry", back_populates="scans")

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    company = relationship("Company")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CompanyScoreHistory(Base):
    __tablename__ = "company_score_history"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), index=True)
    company = relationship("Company", back_populates="score_history")
    previous_score = Column(Integer)
    new_score = Column(Integer)
    points_delta = Column(Integer)
    reason = Column(String)
    scan_id = Column(Integer, ForeignKey("scan_reports.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EnforcementAction(Base):
    __tablename__ = "enforcement_actions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), index=True)
    company = relationship("Company", back_populates="enforcement_actions")
    action_type = Column(String, index=True) # 'NOTICE', 'SURPRISE_AUDIT', 'RAID_ORDER', 'BADGE_REVOCATION'
    severity = Column(String, default="MEDIUM") # 'LOW', 'MEDIUM', 'CRITICAL'
    status = Column(String, default="DISPATCHED") # 'PENDING', 'DISPATCHED', 'SERVED', 'RESOLVED'
    officer_id = Column(String, default="MAH-LM-HQ")
    officer_notes = Column(Text, nullable=True)
    evidence_scan_id = Column(Integer, ForeignKey("scan_reports.id"), nullable=True)
    document_url = Column(String, nullable=True)
    deadline_days = Column(Integer, default=15)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
