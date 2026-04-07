import re
import io
import os
from PIL import Image
import pytesseract

# Windows dev paths — on Linux (Render) tesseract is on PATH, poppler too
if os.name == "nt":
    pytesseract.pytesseract.tesseract_cmd = r"D:\Program Files\Tesseract-OCR\tesseract.exe"
    POPPLER_PATH = r"D:\popplers\poppler-25.12.0\Library\bin"
else:
    POPPLER_PATH = None  # Linux: poppler_utils installed via apt, no path needed


def check_image_quality(image: Image.Image) -> bool:
    """Basic blur detection using image variance."""
    import numpy as np
    gray = image.convert("L")
    arr = np.array(gray, dtype=float)
    variance = arr.var()
    return variance > 100  # low variance = likely blurry

def pdf_to_image(file_bytes: bytes) -> Image.Image:
    """Convert first page of a PDF to a PIL Image using pdf2image."""
    from pdf2image import convert_from_bytes
    kwargs: dict = {"dpi": 200, "first_page": 1, "last_page": 1}
    if POPPLER_PATH:
        kwargs["poppler_path"] = POPPLER_PATH
    pages = convert_from_bytes(file_bytes, **kwargs)
    return pages[0]


def extract_text_from_image(file_bytes: bytes, filename: str) -> dict:
    """Run OCR on an uploaded image or PDF and extract structured fields."""
    is_pdf = filename.lower().endswith(".pdf")

    try:
        if is_pdf:
            image = pdf_to_image(file_bytes)
        else:
            image = Image.open(io.BytesIO(file_bytes))
    except Exception as e:
        return {"error": f"Cannot open file: {str(e)}", "raw_text": ""}

    is_clear = check_image_quality(image)
    raw_text = pytesseract.image_to_string(image)

    merchant = extract_merchant(raw_text)
    date = extract_date(raw_text)
    amount, currency = extract_amount(raw_text)

    return {
        "raw_text": raw_text,
        "merchant": merchant,
        "date": date,
        "amount": amount,
        "currency": currency,
        "image_quality": "clear" if is_clear else "blurry",
    }


def extract_merchant(text: str) -> str:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return lines[0] if lines else "Unknown"


def extract_date(text: str) -> str:
    patterns = [
        r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",
        r"\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b",
        r"\b(\w+ \d{1,2},? \d{4})\b",
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            return m.group(1)
    return "Unknown"


def extract_amount(text: str) -> tuple[str, str]:
    currency_symbols = {"$": "USD", "€": "EUR", "£": "GBP", "₹": "INR"}
    pattern = r"([\$€£₹])\s?(\d+[\.,]\d{2})"
    m = re.search(pattern, text)
    if m:
        symbol, amount = m.group(1), m.group(2)
        return amount, currency_symbols.get(symbol, symbol)
    # fallback: look for total keyword
    m2 = re.search(r"(?:total|amount)[^\d]*(\d+[\.,]\d{2})", text, re.IGNORECASE)
    if m2:
        return m2.group(1), "USD"
    return "Unknown", "USD"
