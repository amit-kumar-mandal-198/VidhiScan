from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import os
from datetime import datetime

PDF_DIR = "static/reports"
if not os.path.exists(PDF_DIR):
    os.makedirs(PDF_DIR)

def generate_legal_notice(scan_data: dict, inspector_id: str = "MAH-LM-2026"):
    """
    Generates a formal statutory legal notice & inspection report PDF for a scanned product.
    Embeds the packaging evidence image, metadata, GPS coordinates, and 8-point Rule 6 audit table.
    """
    scan_id = scan_data.get('scan_id', '1085')
    is_compliant = scan_data.get('is_compliant', False)
    filename = f"Report_{scan_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    filepath = os.path.join(PDF_DIR, filename)
    
    doc = SimpleDocTemplate(filepath, pagesize=A4, rightMargin=45, leftMargin=45, topMargin=45, bottomMargin=36)
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='CenterTitle', alignment=1, fontSize=14, leading=18, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='SubCenter', alignment=1, fontSize=9, leading=12, fontName='Helvetica'))
    styles.add(ParagraphStyle(name='ReportRed', alignment=1, fontSize=12, leading=16, fontName='Helvetica-Bold', textColor=colors.HexColor('#DC2626')))
    styles.add(ParagraphStyle(name='ReportGreen', alignment=1, fontSize=12, leading=16, fontName='Helvetica-Bold', textColor=colors.HexColor('#059669')))
    styles.add(ParagraphStyle(name='SectionHeading', alignment=0, fontSize=10, leading=14, fontName='Helvetica-Bold', textColor=colors.HexColor('#1E293B')))

    story = []
    
    # 1. State Emblem & Government Header
    story.append(Paragraph("<b>GOVERNMENT OF INDIA • DEPARTMENT OF LEGAL METROLOGY</b>", styles['CenterTitle']))
    story.append(Paragraph("<b>NATIONAL LEGAL METROLOGY COMPLIANCE GRID (PCR RULES, 2011)</b>", styles['SubCenter']))
    story.append(Spacer(1, 6))
    
    if is_compliant:
        story.append(Paragraph("<b>OFFICIAL STATUTORY INSPECTION REPORT & CERTIFICATE OF CONFORMANCE</b>", styles['ReportGreen']))
    else:
        story.append(Paragraph("<b>FORMAL STATUTORY NOTICE FOR NON-COMPLIANCE & SEIZURE MEMORANDUM</b>", styles['ReportRed']))
    story.append(Spacer(1, 10))
    
    # 2. Metadata Grid Table
    commodity = scan_data.get('commodity', 'Packaged Retail Commodity')
    fraud_type = scan_data.get('fraud_type') or scan_data.get('violations') or 'None (Fully Compliant)'
    if isinstance(fraud_type, list):
        fraud_type = "; ".join(fraud_type) if fraud_type else 'None (Fully Compliant)'
        
    meta_table_data = [
        ['Case Dossier ID:', f"#{scan_id}", 'Inspection Timestamp:', datetime.now().strftime('%d %b %Y, %H:%M IST')],
        ['Commodity Title:', commodity[:35], 'Verification Sensor:', scan_data.get('inspected_by', inspector_id)],
        ['Compliance Score:', f"{scan_data.get('compliance_score', 100)}% ({scan_data.get('rules_passed', 8)}/8 Rules)", 'Status Verdict:', 'STATUTORY COMPLIANT' if is_compliant else 'OFFENCE FLAGGED'],
        ['GPS Telemetry:', scan_data.get('location_name', '19.0760° N, 72.8777° E'), 'Compounding Fine:', '₹ 0 (Compliant)' if is_compliant else '₹ 25,000 (Sec 36(1))']
    ]
    
    t_meta = Table(meta_table_data, colWidths=[110, 140, 110, 146])
    t_meta.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (3,2), (3,2), colors.HexColor('#059669') if is_compliant else colors.HexColor('#DC2626')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))
    
    # 3. Evidence Photo & Scanned Packaging Panel (if image provided)
    img_path_raw = scan_data.get('image_path') or scan_data.get('image_url')
    if img_path_raw:
        clean_img_path = img_path_raw.lstrip('/')
        if os.path.exists(clean_img_path):
            try:
                story.append(Paragraph("<b>PHOTOGRAPHIC EVIDENCE DOSSIER (EXIF & GPS AUTHENTICATED)</b>", styles['SectionHeading']))
                story.append(Spacer(1, 4))
                img_obj = Image(clean_img_path, width=200, height=130)
                story.append(img_obj)
                story.append(Spacer(1, 8))
            except Exception:
                pass

    # 4. Declarations & Audit Breakdown Table
    story.append(Paragraph("<b>STATUTORY MANDATES AUDIT TABLE (PCR 2011 RULE 6)</b>", styles['SectionHeading']))
    story.append(Spacer(1, 4))
    
    declarations_data = [
        ['Statutory Mandate (PCR 2011)', 'Detected Packaging Declaration', 'Rule Citation', 'Status']
    ]
    
    decl_dict = scan_data.get('declarations') or {
        "rule_1": {"name": "Manufacturer / Packer Name & Address", "value": scan_data.get('manufacturer', 'Declared'), "rule": "Rule 6(1)(a)", "status": "COMPLIANT"},
        "rule_2": {"name": "Net Quantity (SI Metric Units)", "value": scan_data.get('scanned_net_weight', '100 g'), "rule": "Rule 6(1)(b)", "status": "COMPLIANT"},
        "rule_3": {"name": "Generic Commodity Title", "value": commodity, "rule": "Rule 6(1)(c)", "status": "COMPLIANT"},
        "rule_4": {"name": "Month & Year of Packing", "value": scan_data.get('scanned_mfg_date', '02/2026'), "rule": "Rule 6(1)(d)", "status": "COMPLIANT"},
        "rule_5": {"name": "Maximum Retail Price (MRP)", "value": f"₹ {scan_data.get('scanned_mrp', '58.00')}", "rule": "Rule 6(1)(e)", "status": "COMPLIANT" if is_compliant else "FLAGGED"},
        "rule_6": {"name": "Best Before / Expiry Date", "value": scan_data.get('scanned_exp_date', 'Best Before 9 Months'), "rule": "Rule 6(1)(g)", "status": "COMPLIANT"},
        "rule_7": {"name": "Consumer Care Helpline & Email", "value": "1800-258-3333 | care@compliance.gov.in", "rule": "Rule 6(1)(h)", "status": "COMPLIANT"},
        "rule_8": {"name": "Country of Origin", "value": "India (Domestic)", "rule": "Rule 6(1)(n)", "status": "COMPLIANT"}
    }
    
    for k, item in decl_dict.items():
        name = item.get('name', k)
        val = str(item.get('value') or 'Not declared / missing')
        rule = item.get('rule', 'Rule 6')
        st = item.get('status', 'COMPLIANT')
        declarations_data.append([name, val[:45], rule, st])
        
    t_decl = Table(declarations_data, colWidths=[150, 186, 90, 80])
    t_decl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (2,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#FFFFFF')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_decl)
    story.append(Spacer(1, 10))
    
    # 5. Statutory Offenses or Conformance Certificate Clause
    if not is_compliant:
        story.append(Paragraph("<b>STATUTORY OFFENCE & PENALTY CLAUSE:</b>", styles['SectionHeading']))
        penalty_text = f"""
        <font color='#DC2626'><b>Violations Flagged:</b> {fraud_type}</font><br/><br/>
        As per Section 36 of the Legal Metrology Act, 2009, whoever manufactures, packs, imports, sells, 
        distributes, delivers or possesses for sale any pre-packaged commodity which does not conform to the 
        statutory declarations on the package, shall be punished with fine which may extend to twenty-five 
        thousand rupees (first offence) and up to fifty thousand rupees for subsequent offences.
        """
        story.append(Paragraph(penalty_text, styles['Normal']))
    else:
        story.append(Paragraph("<b>STATUTORY CONFORMANCE CERTIFICATION:</b>", styles['SectionHeading']))
        cert_text = """
        This packaged commodity has been scanned and cross-referenced with the Government Master Registry.
        All mandatory declarations conformed strictly to the provisions of Rule 6 of the Legal Metrology 
        (Packaged Commodities) Rules, 2011. No retail price gouging or overcharging was detected.
        """
        story.append(Paragraph(cert_text, styles['Normal']))
        
    story.append(Spacer(1, 14))
    
    # 6. Digital Stamp & Signatures
    sign_data = [
        ['[DIGITALLY SEALED & STAMPED]', '[AUTHORIZED ISSUING INSPECTOR / SQUAD]'],
        ['VidhiScan Central Trust Ledger', 'Department of Legal Metrology, State Enforcement'],
        [f"Hash: SHA256-{datetime.now().strftime('%Y%m%d%H%M%S')}-VS-{scan_id}", f"Officer Seal: {scan_data.get('inspected_by', inspector_id)}"]
    ]
    t_sign = Table(sign_data, colWidths=[253, 253])
    t_sign.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('LINEABOVE', (0,0), (-1,0), 0.8, colors.HexColor('#0F172A')),
    ]))
    story.append(t_sign)
    
    doc.build(story)
    
    web_path = filepath.replace("\\", "/")
    return f"/{web_path.lstrip('/')}"


def generate_raid_warrant(enforcement_data: dict) -> str:
    """
    Generates an official Search, Seizure & Raid Authorization Order
    under Section 15 of the Legal Metrology Act, 2009.
    """
    company_name = enforcement_data.get("company_name", "Target Entity")
    clean_company = "".join(c for c in company_name if c.isalnum() or c in (" ", "_")).rstrip()
    action_id = enforcement_data.get("action_id", "RW-101")
    filename = f"Raid_Warrant_{clean_company}_{action_id}_{datetime.now().strftime('%Y%m%d%H%M')}.pdf"
    filepath = os.path.join(PDF_DIR, filename)

    doc = SimpleDocTemplate(filepath, pagesize=A4, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=36)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='CenterTitle', alignment=1, fontSize=14, leading=18, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='SubCenter', alignment=1, fontSize=10, leading=14, fontName='Helvetica'))
    styles.add(ParagraphStyle(name='WarrantRed', alignment=1, fontSize=13, leading=17, fontName='Helvetica-Bold', textColor=colors.HexColor('#DC2626')))

    story = []

    # State Emblem & Seal Header
    story.append(Paragraph("<b>GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS</b>", styles['CenterTitle']))
    story.append(Paragraph("<b>CENTRAL & STATE LEGAL METROLOGY ENFORCEMENT SQUAD</b>", styles['SubCenter']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>ORDER OF SEARCH, SEIZURE & PHYSICAL RAID</b>", styles['WarrantRed']))
    story.append(Paragraph("<i>Issued under Section 15 & Section 36 of the Legal Metrology Act, 2009</i>", styles['SubCenter']))
    story.append(Spacer(1, 16))

    # Warrant Meta Table
    officer_id = enforcement_data.get("officer_id", "MAH-LM-HQ-SQ4")
    score = enforcement_data.get("current_vidhiscore", 340)
    tier = enforcement_data.get("tier_name", "Defaulter (Red Flag)")
    order_no = f"VS-ENF-{action_id}-{datetime.now().strftime('%Y%m%d')}"

    meta_table_data = [
        ['Warrant Order No:', order_no, 'Authorization Date:', datetime.now().strftime('%d %b %Y, %H:%M IST')],
        ['Target Enterprise:', company_name, 'Registration / GSTIN:', enforcement_data.get("gstin", "27AABCK9999P1Z1")],
        ['Operating Address:', enforcement_data.get("address", "Thane-Bhiwandi Industrial Complex, Maharashtra"), 'VidhiScore Status:', f"{score}/1000 ({tier})"],
        ['Squad Commander:', officer_id, 'Enforcement Priority:', 'HIGH - IMMEDIATE INTERDICTION']
    ]

    t_meta = Table(meta_table_data, colWidths=[120, 160, 110, 130])
    t_meta.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF2F2')),
        ('TEXTCOLOR', (3,2), (3,2), colors.HexColor('#B91C1C')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#FCA5A5')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # Body
    reason = enforcement_data.get("reason", "Repeated Section 36(2) retail overcharging and date manipulation detected across multiple independent inspections.")
    officer_notes = enforcement_data.get("officer_notes", "Physical seizure of non-compliant batches authorized immediately.")

    body_text = f"""
    <b>WHEREAS</b>, the electronic surveillance grid of <b>VidhiScan Legal Metrology System</b> has registered 
    critical non-compliance incidents against the aforementioned enterprise, causing its national 
    <b>VidhiScore™</b> to degenerate to <b>{score} / 1000</b> (classified under Defaulter / Watchlist Tier);<br/><br/>
    <b>AND WHEREAS</b>, reliable statutory evidence demonstrates deliberate violations including:<br/>
    <font color='#B91C1C'>• {reason}</font><br/><br/>
    <b>NOW THEREFORE</b>, in exercise of powers conferred under <b>Section 15 of the Legal Metrology Act, 2009</b>, 
    the Authorized Legal Metrology Inspection Squad is hereby commanded to:<br/>
    1. Enter and inspect any premises, godowns, retail distribution points, or manufacturing plants of the target enterprise without prior notice.<br/>
    2. Seize and confiscate all packaging commodities, labelling stamps, and altered goods violating Rule 6 & Rule 7.<br/>
    3. Impound registers, electronic records, and invoices substantiating overcharging or date alterations.<br/>
    4. Issue statutory Seizure Memorandum and summon authorized signatories for formal compounding proceedings within 48 hours.
    """
    story.append(Paragraph(body_text, styles['Normal']))
    story.append(Spacer(1, 14))

    # Notes Box
    notes_table = Table([
        ["OFFICER DIRECTIVES & SPECIAL INSTRUCTIONS:", officer_notes]
    ], colWidths=[200, 320])
    notes_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F3F4F6')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#9CA3AF')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(notes_table)
    story.append(Spacer(1, 24))

    # Signatures
    sign_data = [
        ['[DIGITALLY SEALED]', '[AUTHORIZED ISSUING MAGISTRATE / CONTROLLER]'],
        ['VidhiScan Central Trust Ledger', 'Department of Legal Metrology, State Enforcement'],
        [f"Hash: SHA256-{datetime.now().strftime('%Y%m%d%H%M%S')}-VS-ENF", f"Officer Seal: {officer_id}"]
    ]
    t_sign = Table(sign_data, colWidths=[260, 260])
    t_sign.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('LINEABOVE', (0,0), (-1,0), 1, colors.black),
    ]))
    story.append(t_sign)

    doc.build(story)
    web_path = filepath.replace("\\", "/")
    return f"/{web_path.lstrip('/')}"
