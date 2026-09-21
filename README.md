# 🇮🇳 VidhiScan: AI-Powered Legal Metrology Compliance & Forensics System

> **A Next-Gen AI & Computer Vision Progressive Web Application (PWA) to inspect and enforce compliance of Packaged Commodities under the Legal Metrology (Packaged Commodities) Rules, 2011.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Google Gemini Vision](https://img.shields.io/badge/AI-Gemini%20Vision-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![EasyOCR](https://img.shields.io/badge/OCR-EasyOCR%20%2B%20OpenCV-FF6F00?style=flat)](https://github.com/JaidedAI/EasyOCR)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)

---

## 📌 Problem Statement
Under the **Legal Metrology Act, 2009** and the **Packaged Commodities Rules, 2011**, all pre-packaged goods sold in India must display mandatory statutory declarations (MRP, Net Quantity, Date of Manufacture/Packing, Expiry Date, Manufacturer Address, Consumer Care Details, Country of Origin, etc.).

Manual inspection of millions of retail packages is slow and prone to oversight. Common violations include:
- **Price Tampering & Overcharging:** Charging above the legally mandated Maximum Retail Price (MRP).
- **Date Manipulation:** Fraudulent alteration of expiry and manufacturing dates.
- **Missing Statutory Declarations:** Deliberately omitting packer details or consumer grievance contacts.

---

## 💡 Solution Overview
**VidhiScan** automates retail packaging compliance audits using deep learning, OCR, and multimodal vision AI:
1. **Live Camera Scanner & Barcode Decoder:** Capture packaging directly from mobile or desktop cameras with offline caching.
2. **Rule 6 Statutory Declaration Engine:** Automatically validates all 8 mandatory declarations under Rule 6 of Legal Metrology Rules, 2011.
3. **Master Registry Cross-Referencing:** Validates scanned product details against official manufacturer records to detect overcharging (Section 36(2)).
4. **Instant PDF Notice Generation:** Automatically generates formal, legal notices citing relevant sections of the Act, ready for enforcement action.
5. **Role-Based Access Control:** Tailored experiences for Citizens (crowdsourced reporting), Inspectors (enforcement), and Admins (macro surveillance & heatmaps).

---

## 🏛️ System Architecture

```text
VidhiScan/
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── ai_engine.py      # Gemini Multimodal AI & EasyOCR Engine
│   │   ├── database.py       # SQLAlchemy ORM (SQLite / PostgreSQL)
│   │   ├── models.py         # Database Models (Scans, Products, Users)
│   │   ├── pdf_generator.py  # ReportLab Legal Notice Generator
│   │   └── routers/          # API Routers (/scans, /products)
│   ├── Dockerfile            # Production Python container
│   └── requirements.txt      # Backend Python dependencies
│
├── frontend/                 # Next.js 16 PWA Frontend
│   ├── src/
│   │   ├── app/              # App Router (/, /scan, /inspector, /admin, /demo)
│   │   ├── components/       # UI Components & Dashboard widgets
│   │   └── lib/              # Utilities & API helpers
│   ├── Dockerfile            # Multi-stage Next.js production container
│   └── package.json          # Node dependencies
│
├── docs/                     # Architectural Blueprint & SIH Documentation
├── docker-compose.yml        # One-command full-stack containerization
└── README.md
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- [Google Gemini API Key](https://aistudio.google.com/)

### 2. Backend Setup
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env and set your Gemini API key
echo GEMINI_API_KEY=your_gemini_api_key_here > .env

# Run FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

To spin up the entire full-stack application (Next.js + FastAPI) with persistent storage:

```bash
# Set your Gemini API key
export GEMINI_API_KEY=your_gemini_api_key_here

# Launch both services
docker compose up -d --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## ☁️ Cloud Deployment Guide

### Deploying Frontend to Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `BACKEND_URL`: `https://your-backend-service.onrender.com`
4. Click **Deploy**.

### Deploying Backend to Render / Railway
1. Create a new **Web Service** pointing to this repository.
2. Set **Root Directory** to `backend`.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variable:
   - `GEMINI_API_KEY`: Your Google AI Studio API key.

---

## ⚖️ Legal Framework Reference
- **The Legal Metrology Act, 2009**
- **The Legal Metrology (Packaged Commodities) Rules, 2011 (Rule 6 declarations)**
- **Section 36(1) & 36(2)**: Penalties for non-standard packages and retail overcharging beyond MRP.
