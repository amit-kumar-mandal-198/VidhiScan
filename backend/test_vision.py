import os
import json
import re
import PIL.Image
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print("Using API KEY:", api_key[:8] + "...")
genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-3.6-flash")
img_path = r"C:\Users\Amit kumar Mandal\.gemini\antigravity\brain\4025f368-fcf9-4f5a-9d87-18bcaa5fa577\.user_uploaded\media_1789973631352.png"
img = PIL.Image.open(img_path)

prompt = """You are an expert Legal Metrology (Packaged Commodities) Rules, 2011 inspection auditor.
Analyze this product packaging image and extract all mandatory Rule 6 declarations with forensic precision.
Return a valid JSON object matching this schema:
{
  "brand": "string or null",
  "commodity": "string or null",
  "net_quantity": "string or null (e.g. '5 N x 100 g = 500 g' or '500 g')",
  "scanned_mrp": "float or null (null if unprinted/blank)",
  "mfg_date": "string or null",
  "exp_date": "string or null",
  "manufacturer": "string or null",
  "consumer_care": "string or null",
  "country_of_origin": "string or null",
  "fssai_lic": "string or null",
  "raw_text": "all legible text extracted from packaging",
  "violations": ["list of specific violations if any mandatory fields are missing/blank"]
}
Return ONLY pure JSON.
"""

res = model.generate_content([img, prompt])
raw = res.text.strip()
if raw.startswith("```"):
    raw = re.sub(r"^```(?:json)?", "", raw)
    raw = re.sub(r"```$", "", raw).strip()

data = json.loads(raw)
print("SUCCESSFULLY PARSED:")
print(json.dumps(data, indent=2))
