from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from . import models
from .routers import scan

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VidhiScan API",
    description="API for scanning packaged commodities under Legal Metrology Rules, 2011",
    version="1.0.0"
)

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers import scan, product

# Ensure static directories exist before mounting
import os
os.makedirs("static/uploads", exist_ok=True)
os.makedirs("static/reports", exist_ok=True)

# Mount the static directory to serve uploaded images
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include Routers
app.include_router(scan.router)
app.include_router(product.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the VidhiScan API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
