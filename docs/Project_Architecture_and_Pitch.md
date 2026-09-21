# VidhiScan - Project Architecture & Pitch Blueprint

This document contains the complete architectural plan, workflow, and presentation strategies for the Smart India Hackathon (SIH 2026) project: **Software System to check compliance of Packaged Commodities under Legal Metrology Rules, 2011.**

---

## 1. The Core Problem
Under the Legal Metrology Act, 2009, packaged commodities must bear mandatory declarations (MRP, Net Quantity, Mfg Date, Expiry Date, Consumer Care, etc.). Currently, enforcement agencies rely on manual inspections, which is time-consuming. Non-compliance, price tampering, and expiry date fraud are rampant.

## 2. The Solution: VidhiScan
VidhiScan is an AI-powered Progressive Web App (PWA) that uses Optical Character Recognition (OCR) and Computer Vision to automatically scan product labels, extract text, and instantly cross-reference them against the Legal Metrology Rules, 2011 to generate compliance reports and legal notices.

---

## 3. The 4 Stakeholders (Role-Based Access)
1. **The Government (Admin):** Views statewide heatmaps of violations, manages the Master Registry, and tracks repeat offenders via a desktop dashboard.
2. **The Manufacturer (Data Provider):** Registers their products (Barcode, MRP, Shelf Life) into the government portal before launch.
3. **The Inspector (Enforcement):** Uses the mobile PWA to scan products in shops. Generates official PDF legal notices on the spot.
4. **The Citizen (Crowdsourcing - Bonus Feature):** Normal citizens can use the public portal to scan products without an account. If they detect fraud (e.g., overcharging), they can report it to the Inspector's dashboard.

---

## 4. Tech Stack (100% Free & Open Source)
* **Frontend:** Next.js (React) configured as a PWA (Progressive Web App). Tailwind CSS and Shadcn UI for a fast, modern design.
* **Backend:** FastAPI (Python) for asynchronous, high-performance API routing.
* **Database:** SQLite (local) via SQLAlchemy ORM (easily migrates to PostgreSQL later).
* **Message Queue (Scalability):** Redis + Celery to queue image processing so the server doesn't crash if 1,000 users upload photos at the same time.
* **AI / Forensics Engine:**
  * **EasyOCR:** Deep-learning text extraction.
  * **OpenCV:** Image forensics (detecting tampered stickers, smudged ink).
  * **spaCy/Regex:** NLP to map messy text to the 8 mandatory rules.
* **Reporting:** ReportLab (Python) for generating PDF notices.

---

## 5. The Master Workflow
1. **Manufacturer Registry:** Nestlé registers "Maggi 70g" with an MRP of ₹14 and a 9-month shelf life.
2. **Public Tip (Crowdsourced):** A citizen scans a Maggi packet at a local store selling for ₹20. The AI detects the MRP mismatch. The citizen clicks "Report to Government." (OTP verified once to prevent spam).
3. **Inspector Action:** The Inspector sees the "Public Alert" on their dashboard, visits the store, does an official scan, and clicks "Generate Notice."
4. **Legal Notice:** The backend instantly generates a PDF citing the Legal Metrology Rules, 2011, and emails/WhatsApp's it to the shopkeeper.

---

## 6. Real-World Case Study (Pitch Material)
* **The Incident (Sept 2026):** Maharashtra FDA Commissioner Tukaram Mundhe busted a ₹75 Lakh racket in Navi Mumbai where criminals erased expiry dates and pasted fake stickers on instant noodles and mayonnaise.
* **The VidhiScan Pitch:** *"If VidhiScan was active, our OpenCV Forensics Engine would have instantly detected the smudged ink and the unnatural rectangular border of the fake sticker. We would have flagged this ₹75 lakh scam automatically on the spot."*

---

## 7. Overcoming Hackathon Challenges (Loopholes Addressed)
1. **The "Cold Start" Problem:** How do we get old products into the new system?
   * *Solution:* Bulk CSV uploads for companies, API integration with GS1 India (DataKart), and an "AI Auto-Discover" mode when unregistered barcodes are scanned.
2. **Fake Image Spam (The Revenge Loophole):**
   * *Solution:* Public can only use the Live Camera (no gallery uploads). EXIF metadata is checked. 1-time OTP verification required to report.
3. **AI Hallucinations (Bad OCR):**
   * *Solution:* "Human-in-the-loop". The AI doesn't fine anyone; it only alerts the Inspector, who makes the final call.
4. **No Internet in Supermarkets:**
   * *Solution:* The Inspector PWA has an **Offline Mode** that caches photos locally and syncs them to the AI when a 4G/5G connection is restored.
5. **High Traffic Server Crashes:**
   * *Solution:* Frontend image compression (10MB -> 500KB) and Redis message queues to process images asynchronously.

---

## 8. The "God Mode" Demo Strategy
To ensure a flawless presentation for the judges, the login screen will feature a "Demo Mode" with 3 buttons:
1. Enter as Citizen
2. Enter as Inspector
3. Enter as Admin

Clicking these will instantly bypass the password screen and drop the judges into the respective dashboards, allowing them to test the Role-Based Access Control in seconds without friction.
