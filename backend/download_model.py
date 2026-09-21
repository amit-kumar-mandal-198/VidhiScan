import os
os.environ["PYTHONIOENCODING"] = "utf-8"
import easyocr
print("Downloading EasyOCR model...")
r = easyocr.Reader(['en'], gpu=False, verbose=False)
print("Model downloaded successfully!")
