# VidhiScan: Legal Metrology Compliance System

This document outlines the architecture, tech stack, and step-by-step implementation plan to build a production-grade software system for checking packaging compliance under the Legal Metrology Rules, 2011.

## User Review Required

> [!IMPORTANT]
> Please review the proposed **Tech Stack** and **Phase 1 Execution** plan. If you have preferences for different technologies (e.g., you prefer Node.js over Python, or a specific cloud provider), please let me know before we begin.

## Open Questions

> [!WARNING]
> 1. **OCR/AI Strategy**: For extracting text and analyzing images, do you prefer we use open-source local models (like Tesseract OCR, EasyOCR, OpenCV) to keep it fully offline, or can we leverage cloud APIs (like Google Cloud Vision or OpenAI Vision) for higher accuracy?
> 2. **Authentication**: Do we need advanced authentication (like OTP, SSO) or will standard email/password suffice for the MVP?
> 3. **Hosting/Storage**: Should we design the system to use local storage for uploaded images initially, or directly integrate with a cloud provider (e.g., AWS S3)?

## Proposed Tech Stack (Zero Cost & Open Source)

* **Frontend**: Next.js (React) configured as a **Progressive Web App (PWA)**. Tailwind CSS and Shadcn/UI for components.
* **Backend**: FastAPI (Python) for high-performance API routing and AI execution.
* **Database**: SQLite (local) via SQLAlchemy ORM (easily upgradable to PostgreSQL).
* **AI/Image Processing (Free & Local)**: 
  * **EasyOCR**: Deep-learning text extraction from images.
  * **OpenCV**: Image forensics (detecting tampered stickers, smudged ink, bounding box sizing).
  * **Regex/spaCy**: NLP engine for mapping unstructured text to the 8 mandatory rules.
* **Storage**: Local file system (`/static/uploads`) served by FastAPI.
* **PDF Generation**: `ReportLab` (Python).

## Proposed Architecture & Security

The system will enforce strict **Role-Based Access Control (RBAC)** using JWT (JSON Web Tokens).

1. **Public Portal (Progressive Web App)**: Accessible to anyone. 
   * **Frictionless Scanning**: Anyone can scan a product and get instant AI feedback anonymously.
   * **Verified Reporting (Anti-Spam)**: To file an official report, the user must verify their phone via OTP *once*. A persistent secure token is stored in the browser so future reports from that device require exactly 1-click (no repeat OTPs). The public *cannot* view internal government data.
2. **Inspector Portal (Protected via JWT)**: Requires `role: inspector`. Next.js middleware and FastAPI dependencies will block unauthorized access. Used for official scans, reviewing public tips, and generating PDF notices.
3. **Admin Dashboard (Protected via JWT)**: Requires `role: admin`. For high-level oversight and managing the Master Product Registry.
4. **Manufacturer Portal (Protected via JWT)**: Requires `role: manufacturer`. Can only input static data (MRP, Barcode, Shelf-life) into the Master Registry.

## Edge Cases & Hackathon Defenses
* **Fake Image Spam (The Revenge Loophole)**: Public uploads are restricted to live camera capture (no gallery uploads), require a 1-time OTP verification, and are validated via EXIF data to prevent photoshopped submissions.
* **AI Hallucinations (The Bad OCR Loophole)**: The AI does not auto-penalize. It alerts the Inspector (Human-in-the-loop) who verifies the image and makes the final call before generating a legal notice.
* **No Internet in Supermarkets (The Offline Loophole)**: The Inspector PWA will support **Offline Mode**, caching photos and inspection data locally on the phone and auto-syncing to the backend once a 4G/5G connection is restored.
* **No Barcode (The Counterfeit Loophole)**: If the system detects a packaged commodity but fails to scan a valid standardized barcode (or the barcode doesn't match the company prefix), it automatically raises a "Severe Counterfeit Warning" since legitimate products must have standard tracking.

## Implementation Plan

### Phase 1: Project Setup & Core Infrastructure (Next Steps)
- Initialize the Frontend (Next.js) project and configure PWA support.
- Initialize the Backend (FastAPI) project.
- Set up SQLite database schemas (`Users`, `Products_Registry`, `Scans`, `Alerts`).
- Implement strict JWT Authentication and Role-Based route protection.

### Phase 2: AI & OCR Pipeline
- Implement image upload endpoints.
- Integrate OCR to extract text from labels.
- Build the "Rule Engine" to check for mandatory fields (MRP, Net Wt, Date, Manufacturer, Consumer Care).
- Implement basic font-size estimation using bounding box heights.

### Phase 3: Dashboard & Repository
- Build the Frontend Dashboard for enforcement officials (stats, recent scans).
- Build the "Scan History" repository with search and filtering.
- Create the detailed scan result page highlighting missing/non-compliant fields.

### Phase 4: Reporting & Polish
- Implement PDF generation for compliance/non-compliance reports.
- Add editable report features.
- Finalize role-based access control (RBAC).

## Verification Plan

### Automated Tests
- `pytest` for backend API endpoints and OCR extraction logic.
- Rule engine unit tests to ensure missing mandatory fields are correctly flagged.

### Manual Verification
- We will upload sample product images (both compliant and non-compliant) and manually verify if the dashboard correctly reports the violations and generates the accurate PDF.
