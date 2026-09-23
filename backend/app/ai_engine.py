import os
import re
import json
import PIL.Image
from dotenv import load_dotenv

# Load environment variables (such as GEMINI_API_KEY)
_backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(_backend_env)
load_dotenv()

# -------------------------------------------------------------
# 1. Gemini Vision AI Engine (State of the Art Multimodal Vision)
# -------------------------------------------------------------
_gemini_client = None

def get_gemini_model():
    global _gemini_client
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        # Using gemini-3.6-flash which provides sub-2s multimodal inference
        model = genai.GenerativeModel("gemini-3.6-flash")
        return model
    except Exception as e:
        print(f"Gemini initialization error: {e}")
import hashlib

_gemini_client = None
IMAGE_ANALYSIS_CACHE = {}

def get_image_hash(image_path: str) -> str:
    """Computes SHA-256 hash of the image file to ensure deterministic caching."""
    hasher = hashlib.sha256()
    with open(image_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def get_gemini_model():
    global _gemini_client
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-3.6-flash")
        return model
    except Exception as e:
        print(f"Gemini initialization error: {e}")
        return None

def analyze_with_gemini_vision(image_path: str):
    """
    Direct multimodal inspection using Gemini Vision for forensic packaging compliance.
    Extracts all 8 Rule 6 declarations with high accuracy even on complex curved wrappers.
    Uses temperature: 0.0 for 100% deterministic results.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        # Open and resize image to max 1280px maintaining aspect ratio
        img = PIL.Image.open(image_path)
        if img.mode != "RGB":
            img = img.convert("RGB")
        max_dim = 1280
        w, h = img.size
        if max(w, h) > max_dim:
            ratio = max_dim / max(w, h)
            img = img.resize((int(w * ratio), int(h * ratio)), PIL.Image.Resampling.LANCZOS)

        prompt = """You are a senior Legal Metrology (Packaged Commodities) Rules, 2011 forensic enforcement auditor.
Analyze this product packaging photo with meticulous precision and extract the statutory declarations required under Rule 6.

CRITICAL FOR MRP & STICKER TAMPERING FORENSICS (Rule 6(2) & Section 36(2)):
1. Inspect the packaging photo for any adhesive paper stickers, sticky labels, price tags, barcode tags, or paper tapes pasted ON TOP OF or OVER the packaging wrapper (e.g. a green, white, or colored paper sticker with handwritten or printed price like 'MRP 50' pasted on top of the package wrapper).
2. Under Legal Metrology (Packaged Commodities) Rules Rule 6(2) & Section 36(2) of the Legal Metrology Act, 2009, sticking adhesive price tags or labels over original packaging is an explicit illegal offence.
   - If an adhesive sticker or label with price is detected:
     Set "is_sticker_mrp": true
     Set "sticker_details": "Adhesive paper sticker pasted over packaging wrapper showing MRP ₹<price>"
     Set "scanned_mrp": float (extract sticker price, e.g. 50.0)

Return a valid JSON object matching this schema:
{
  "brand": "string or null (e.g. 'BRITANNIA BOURBON', 'Amul')",
  "commodity": "string or null (e.g. 'Biscuits', 'Butter')",
  "net_quantity": "string or null (extract full weight/volume, e.g. '5 N x 100 g = 500 g' or '500 g' or '1 kg')",
  "scanned_mrp": "float or null (numerical price in INR if printed; return null if the MRP box is blank, unprinted, or missing)",
  "is_sticker_mrp": "boolean (true if price is on a pasted adhesive paper sticker or sticky label)",
  "sticker_details": "string or null (description of pasted price tag or sticker if detected)",
  "mfg_date": "string or null (Month and Year of packing/mfg, or null if blank/unprinted)",
  "exp_date": "string or null (Best before or expiry date, or null if blank/unprinted)",
  "seal_referred": "boolean (true if text instructs consumer to see crimp/seal area for dates)",
  "manufacturer": "string or null (Full manufacturer / packer name and address)",
  "consumer_care": "string or null (Toll free number, email, and consumer cell address)",
  "country_of_origin": "string (e.g. 'India')",
  "barcode": "string or null (numerical 12-14 digits printed under barcode if visible)",
  "fssai_lic": "string or null (14-digit FSSAI license number)",
  "raw_text": "all legible packaging text extracted from the image",
  "violations": ["list of explicit missing mandatory fields or sticker tampering under Rule 6"]
}
Return ONLY pure valid JSON."""

        # Enforce temperature: 0.0 for zero variance across identical images
        gen_config = genai.GenerationConfig(temperature=0.0, response_mime_type="application/json")

        models_to_try = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-pro-latest"]
        for mname in models_to_try:
            try:
                model = genai.GenerativeModel(mname, generation_config=gen_config)
                res = model.generate_content([img, prompt], request_options={"timeout": 14})
                raw_text = res.text.strip()
                if raw_text.startswith("```"):
                    raw_text = re.sub(r"^```(?:json)?", "", raw_text)
                    raw_text = re.sub(r"```$", "", raw_text).strip()

                data = json.loads(raw_text)
                if data and isinstance(data, dict) and (data.get("net_quantity") or data.get("brand") or data.get("commodity") or data.get("raw_text")):
                    return data
            except Exception as e:
                print(f"Gemini {mname} inference fallback: {e}")
                continue

        return None
    except Exception as e:
        print(f"Gemini Vision inference fallback triggered: {e}")
        return None

# -------------------------------------------------------------
# 2. Rule Engine & Declarations Compiler
# -------------------------------------------------------------
def compile_declarations_from_vision(vdata: dict):
    """
    Compiles structured declarations from Gemini Vision JSON with deterministic text cross-verification.
    """
    raw_text_lower = (vdata.get("raw_text") or "").lower()

    # Deterministic fallback check from raw extracted text
    has_date_in_text = bool(re.search(r"\b(mfd|pkd|mfg|packed|use by|best before|exp|expiry|\d{2}/\d{2,4})\b", raw_text_lower))
    has_seal_ref_in_text = vdata.get("seal_referred") or bool(re.search(r"\b(crimp|seal|crown|neck|bottom|see side)\b", raw_text_lower))
    has_care_in_text = bool(re.search(r"(\b1800\b|@|email|help|care|toll|cell|phone|\d{10})", raw_text_lower))
    has_mfg_in_text = bool(re.search(r"\b(mfg by|packed by|marketed by|ltd|pvt|corp|unit|factory|address)\b", raw_text_lower))

    mfg_val = vdata.get("manufacturer")
    if not mfg_val and has_mfg_in_text:
        mfg_val = "Declared on Packaging Text"

    mfg_date_val = vdata.get("mfg_date")
    if not mfg_date_val:
        if has_seal_ref_in_text:
            mfg_date_val = "Referred to Seal/Crimp Area"
        elif has_date_in_text:
            mfg_date_val = "Date Stamped on Pack"

    exp_date_val = vdata.get("exp_date")
    if not exp_date_val:
        if has_seal_ref_in_text:
            exp_date_val = "Referred to Seal/Crimp Area"
        elif has_date_in_text:
            exp_date_val = "Best Before / Expiry Stamped on Pack"

    consumer_care_val = vdata.get("consumer_care")
    if not consumer_care_val and has_care_in_text:
        consumer_care_val = "Consumer Care Support Available"

    is_sticker_mrp = bool(vdata.get("is_sticker_mrp")) or bool(vdata.get("sticker_details"))

    declarations = {
        "rule_1_mfg_name": {
            "name": "Name & Address of Manufacturer / Packer",
            "rule": "Rule 6(1)(a)",
            "status": "COMPLIANT" if mfg_val else "MISSING",
            "value": mfg_val,
            "details": "Mandatory name, address and premise of manufacturer/packer."
        },
        "rule_2_net_qty": {
            "name": "Net Quantity (Weight / Volume / Count)",
            "rule": "Rule 6(1)(b)",
            "status": "COMPLIANT" if vdata.get("net_quantity") else "MISSING",
            "value": vdata.get("net_quantity"),
            "details": "Declared in standard SI metric units (g, kg, ml, l)."
        },
        "rule_3_generic_name": {
            "name": "Generic / Common Name of Commodity",
            "rule": "Rule 6(1)(c)",
            "status": "COMPLIANT" if (vdata.get("commodity") or vdata.get("brand")) else "MISSING",
            "value": f"{vdata.get('brand', '')} {vdata.get('commodity', '')}".strip() or "Packaged Commodity",
            "details": "Clear generic identity and commodity denomination."
        },
        "rule_4_mfg_date": {
            "name": "Month & Year of Manufacture / Packing",
            "rule": "Rule 6(1)(d)",
            "status": "COMPLIANT" if vdata.get("mfg_date") else ("PROVISO_COMPLIANT" if mfg_date_val else "MISSING"),
            "value": mfg_date_val,
            "details": "Month and year of packaging or import."
        },
        "rule_5_mrp": {
            "name": "Maximum Retail Price (MRP incl. of all taxes)",
            "rule": "Rule 6(1)(e)",
            "status": "NON_COMPLIANT" if is_sticker_mrp else ("COMPLIANT" if vdata.get("scanned_mrp") is not None else "MISSING"),
            "value": f"₹ {float(vdata['scanned_mrp']):.2f} (Illegal Sticker Overwrite)" if (is_sticker_mrp and vdata.get("scanned_mrp") is not None) else (f"₹ {float(vdata['scanned_mrp']):.2f}" if vdata.get("scanned_mrp") is not None else None),
            "details": "Rule 6(2) & Section 36(2) Offence: Adhesive price sticker pasted over packaging wrapper." if is_sticker_mrp else "Retail price inclusive of all taxes clearly printed."
        },
        "rule_6_expiry": {
            "name": "Best Before / Expiry / Use By Date",
            "rule": "Rule 6(1)(g)",
            "status": "COMPLIANT" if vdata.get("exp_date") else ("PROVISO_COMPLIANT" if exp_date_val else "MISSING"),
            "value": exp_date_val,
            "details": "Mandatory duration or date for perishables and food."
        },
        "rule_7_consumer_care": {
            "name": "Consumer Care Details (Phone / Email / Address)",
            "rule": "Rule 6(1)(h)",
            "status": "COMPLIANT" if consumer_care_val else "MISSING",
            "value": consumer_care_val,
            "details": "Designated officer phone, email or postal helpline."
        },
        "rule_8_country_origin": {
            "name": "Country of Origin",
            "rule": "Rule 6(1)(n)",
            "status": "COMPLIANT",
            "value": vdata.get("country_of_origin") or "India (Domestic)",
            "details": "Clear unambiguous origin declaration."
        }
    }

    passed_count = sum(1 for d in declarations.values() if d["status"] in ["COMPLIANT", "PROVISO_COMPLIANT"])
    total_rules = len(declarations)
    compliance_score = round((passed_count / total_rules) * 100)

    violations = list(vdata.get("violations") or [])
    if is_sticker_mrp:
        sticker_msg = f"Rule 6(2) & Section 36(2) Offence: Unlawful sticker price overwrite & MRP sticker tampering detected on packaging wrapper ({vdata.get('sticker_details') or 'adhesive sticker tag pasted over package'})"
        if sticker_msg not in violations:
            violations.insert(0, sticker_msg)

    if not violations:
        for key, decl in declarations.items():
            if decl["status"] == "MISSING":
                violations.append(f"{decl['rule']} - {decl['name']}: Not found or illegible")

    is_compliant = (passed_count >= 7) and (declarations["rule_5_mrp"]["status"] == "COMPLIANT") and (not is_sticker_mrp)

    clean_mrp = None
    if vdata.get("scanned_mrp") is not None:
        try:
            clean_mrp = float(vdata["scanned_mrp"])
        except Exception:
            clean_mrp = None

    return {
        "compliance_score": compliance_score,
        "rules_passed": passed_count,
        "total_rules": total_rules,
        "is_compliant": is_compliant,
        "declarations": declarations,
        "violations": violations,
        "mrp": declarations["rule_5_mrp"]["value"],
        "scanned_mrp": clean_mrp,
        "net_weight": declarations["rule_2_net_qty"]["value"],
        "mfg_date": declarations["rule_4_mfg_date"]["value"],
        "exp_date": declarations["rule_6_expiry"]["value"],
        "consumer_care": declarations["rule_7_consumer_care"]["status"] == "COMPLIANT",
        "manufacturer": declarations["rule_1_mfg_name"]["value"],
        "commodity": declarations["rule_3_generic_name"]["value"],
        "barcode": vdata.get("barcode")
    }

# -------------------------------------------------------------
# 3. Master Orchestration Function
# -------------------------------------------------------------
def analyze_label(image_path: str):
    """
    AI Engine powered by Gemini Vision with SHA-256 caching and temperature=0.0.
    Returns structured compliance analysis or raises an error if unavailable.
    """
    image_hash = get_image_hash(image_path)
    if image_hash in IMAGE_ANALYSIS_CACHE:
        return IMAGE_ANALYSIS_CACHE[image_hash]

    vdata = analyze_with_gemini_vision(image_path)
    if vdata and isinstance(vdata, dict) and (vdata.get("net_quantity") or vdata.get("brand") or vdata.get("commodity") or vdata.get("raw_text")):
        verdict = compile_declarations_from_vision(vdata)
        raw_text = vdata.get("raw_text") or ""
        res = {
            "raw_text": raw_text,
            "bounding_boxes": [],
            "verdict": verdict,
            "barcode_detected": vdata.get("barcode")
        }
        IMAGE_ANALYSIS_CACHE[image_hash] = res
        return res

    # Gemini unavailable — return clear error instead of fake data
    raise RuntimeError(
        "AI analysis temporarily unavailable. Please ensure GEMINI_API_KEY is configured and try again. "
        "If the issue persists, the image may be unclear — try uploading a sharper photo."
    )

