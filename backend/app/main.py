from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

from .database import engine, Base, SessionLocal, get_db, run_sqlite_migrations
from . import models
from .routers import scan, product, company, enforcement
from .score_engine import seed_default_companies_if_empty

# Safe migrations and schema creation
run_sqlite_migrations()
models.Base.metadata.create_all(bind=engine)

# Seed default badge tiers & companies if empty
try:
    with SessionLocal() as init_db:
        seed_default_companies_if_empty(init_db)
except Exception as e:
    print(f"[Warning] Seeding initialization error: {e}")

app = FastAPI(
    title="VidhiScan API",
    description="Legal Metrology Compliance, Forensics, and Corporate Trust Rating Engine (PCR 2011)",
    version="2.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directories exist before mounting
os.makedirs("static/uploads", exist_ok=True)
os.makedirs("static/reports", exist_ok=True)

# Mount the static directory to serve uploaded images and generated legal notice/warrant PDFs
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include Routers
app.include_router(scan.router)
app.include_router(product.router)
app.include_router(company.router)
app.include_router(enforcement.router)

@app.get("/")
def read_root():
    return {
        "system": "VidhiScan National Compliance Grid",
        "version": "2.0.0",
        "status": "online",
        "modules": ["scan_forensics", "master_registry", "company_vidhiscore", "enforcement_radar"]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
