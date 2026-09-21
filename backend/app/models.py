from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
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

class ProductRegistry(Base):
    __tablename__ = "product_registry"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True, nullable=True)
    brand_name = Column(String, index=True)
    product_name = Column(String)
    official_mrp = Column(Float)
    net_weight = Column(String)
    shelf_life_days = Column(Integer)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

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
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
