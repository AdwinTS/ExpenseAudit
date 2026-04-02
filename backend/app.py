import json
import os
import uuid
import base64
from datetime import datetime

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ocr import extract_text_from_image
from policy_engine import get_policy_context, get_policy_snippet
from llm import audit_expense

app = FastAPI(title="Policy-First Expense Auditor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

BASE_DIR    = os.path.dirname(__file__)
DATA_DIR    = os.path.join(BASE_DIR, "..", "data")
CLAIMS_PATH = os.path.join(DATA_DIR, "claims.json")
IMAGES_DIR  = os.path.join(DATA_DIR, "images")
os.makedirs(IMAGES_DIR, exist_ok=True)

# Serve uploaded receipt images as static files
app.mount("/receipts", StaticFiles(directory=IMAGES_DIR), name="receipts")


def load_claims() -> list:
    if not os.path.exists(CLAIMS_PATH):
        return []
    with open(CLAIMS_PATH, "r") as f:
        return json.load(f)


def save_claims(claims: list):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CLAIMS_PATH, "w") as f:
        json.dump(claims, f, indent=2)


# ── POST /upload ──────────────────────────────────────────────────────────────
@app.post("/upload")
async def upload_receipt(
    file: UploadFile = File(...),
    employee: str = Form(...),
    purpose: str = Form(...),
    expense_date: str = Form(default=""),
):
    file_bytes = await file.read()

    # Save receipt image to disk
    ext = os.path.splitext(file.filename or "receipt")[1] or ".jpg"
    image_filename = f"{uuid.uuid4()}{ext}"
    image_path = os.path.join(IMAGES_DIR, image_filename)
    with open(image_path, "wb") as f:
        f.write(file_bytes)

    # OCR
    ocr_result = extract_text_from_image(file_bytes, file.filename)
    if "error" in ocr_result:
        raise HTTPException(status_code=400, detail=ocr_result["error"])

    receipt_text = ocr_result["raw_text"] or "No text extracted"

    # Date consistency check
    date_warning = ""
    if expense_date and ocr_result.get("date", "Unknown") != "Unknown":
        if expense_date not in ocr_result["date"] and ocr_result["date"] not in expense_date:
            date_warning = f"Date mismatch: claimed {expense_date}, receipt shows {ocr_result['date']}"

    # Duplicate detection — same merchant + amount + employee
    existing_claims = load_claims()
    is_duplicate = any(
        c["employee"].lower() == employee.lower()
        and c["merchant"].lower() == ocr_result.get("merchant", "").lower()
        and c["amount"] == ocr_result.get("amount", "")
        and c["date"] == ocr_result.get("date", "")
        for c in existing_claims
    )

    # Policy RAG + LLM audit
    policy_context = get_policy_context(purpose, receipt_text)
    policy_snippet = get_policy_snippet(purpose, receipt_text)

    try:
        audit = audit_expense(policy_context, receipt_text, purpose)
    except RuntimeError as e:
        raise HTTPException(status_code=429, detail=str(e))

    claim = {
        "id": str(uuid.uuid4()),
        "employee": employee,
        "purpose": purpose,
        "expense_date": expense_date,
        "merchant": ocr_result.get("merchant", "Unknown"),
        "date": ocr_result.get("date", "Unknown"),
        "amount": ocr_result.get("amount", "Unknown"),
        "currency": ocr_result.get("currency", "USD"),
        "image_quality": ocr_result.get("image_quality", "unknown"),
        "raw_text": receipt_text,
        "decision": audit["decision"],
        "reason": audit["reason"],
        "risk": audit["risk"],
        "category": audit.get("category", "Other"),
        "compliance_score": audit.get("score", 50),
        "is_duplicate": is_duplicate,
        "policy_used": policy_context,
        "policy_snippet": policy_snippet,
        "date_warning": date_warning,
        "image_url": f"/receipts/{image_filename}",
        "submitted_at": datetime.utcnow().isoformat(),
        "overridden": False,
        "override_reason": "",
        "notifications": [
            {
                "type": "submitted",
                "message": f"Your expense claim has been submitted and is under review.",
                "timestamp": datetime.utcnow().isoformat(),
            }
        ],
    }

    # Add audit notification
    if is_duplicate:
        claim["notifications"].append({
            "type": "warning",
            "message": "Possible duplicate detected: a claim with the same merchant, amount, and date has been submitted before.",
            "timestamp": datetime.utcnow().isoformat(),
        })

    if audit["decision"] == "Approved":
        claim["notifications"].append({
            "type": "approved",
            "message": f"Your claim has been approved. Reimbursement will be processed within 5–7 business days.",
            "timestamp": datetime.utcnow().isoformat(),
        })
    elif audit["decision"] == "Rejected":
        claim["notifications"].append({
            "type": "rejected",
            "message": f"Your claim was rejected: {audit['reason']}",
            "timestamp": datetime.utcnow().isoformat(),
        })
    else:
        claim["notifications"].append({
            "type": "flagged",
            "message": f"Your claim requires further review: {audit['reason']}",
            "timestamp": datetime.utcnow().isoformat(),
        })

    claims = load_claims()
    claims.append(claim)
    save_claims(claims)

    return claim


# ── GET /claims ───────────────────────────────────────────────────────────────
@app.get("/claims")
def get_claims():
    claims = load_claims()
    # Sort by risk: High first, then Medium, then Low
    risk_order = {"High": 0, "Medium": 1, "Low": 2}
    claims.sort(key=lambda c: risk_order.get(c.get("risk", "Low"), 2))
    return claims


# ── GET /claims/{id} ──────────────────────────────────────────────────────────
@app.get("/claims/{claim_id}")
def get_claim(claim_id: str):
    claims = load_claims()
    for claim in claims:
        if claim["id"] == claim_id:
            return claim
    raise HTTPException(status_code=404, detail="Claim not found")


# ── POST /override ────────────────────────────────────────────────────────────
class OverrideRequest(BaseModel):
    claim_id: str
    new_decision: str
    override_reason: str = ""


@app.post("/override")
def override_claim(body: OverrideRequest):
    claims = load_claims()
    for claim in claims:
        if claim["id"] == body.claim_id:
            claim["decision"] = body.new_decision
            claim["overridden"] = True
            claim["override_reason"] = body.override_reason
            claim["notifications"].append({
                "type": "override",
                "message": f"Finance team updated your claim to '{body.new_decision}'. Note: {body.override_reason}",
                "timestamp": datetime.utcnow().isoformat(),
            })
            save_claims(claims)
            return claim
    raise HTTPException(status_code=404, detail="Claim not found")


# ── GET /notifications/{employee} ─────────────────────────────────────────────
@app.get("/notifications/{employee}")
def get_notifications(employee: str):
    claims = load_claims()
    result = []
    for claim in claims:
        if claim["employee"].lower() == employee.lower():
            for n in claim.get("notifications", []):
                result.append({**n, "claim_id": claim["id"], "merchant": claim["merchant"], "amount": claim["amount"], "currency": claim["currency"]})
    result.sort(key=lambda x: x["timestamp"], reverse=True)
    return result


# ── GET /my-claims/{employee} ─────────────────────────────────────────────────
@app.get("/my-claims/{employee}")
def get_my_claims(employee: str):
    claims = load_claims()
    return [c for c in claims if c["employee"].lower() == employee.lower()]


# ── GET /analytics ────────────────────────────────────────────────────────────
@app.get("/analytics")
def get_analytics():
    claims = load_claims()
    if not claims:
        return {"by_decision": {}, "by_category": {}, "by_risk": {}, "avg_score": 0, "total": 0, "duplicate_count": 0}

    by_decision: dict = {}
    by_category: dict = {}
    by_risk: dict = {}
    scores = []
    duplicates = 0

    for c in claims:
        d = c.get("decision", "Unknown")
        cat = c.get("category", "Other")
        risk = c.get("risk", "Unknown")
        by_decision[d] = by_decision.get(d, 0) + 1
        by_category[cat] = by_category.get(cat, 0) + 1
        by_risk[risk] = by_risk.get(risk, 0) + 1
        if c.get("compliance_score"):
            scores.append(c["compliance_score"])
        if c.get("is_duplicate"):
            duplicates += 1

    return {
        "total": len(claims),
        "by_decision": by_decision,
        "by_category": by_category,
        "by_risk": by_risk,
        "avg_score": round(sum(scores) / len(scores), 1) if scores else 0,
        "duplicate_count": duplicates,
    }
