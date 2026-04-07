import os
import uuid
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ocr import extract_text_from_image
from policy_engine import get_policy_context, get_policy_snippet
from llm import audit_expense

# ── Firebase init ─────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(__file__)

# Support both local file (dev) and env var (Render/production)
_google_creds_json = os.getenv("GOOGLE_CREDENTIALS_JSON")
if _google_creds_json:
    import json
    import tempfile
    _tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
    _tmp.write(_google_creds_json)
    _tmp.close()
    cred = credentials.Certificate(_tmp.name)
else:
    KEY_PATH = os.path.join(BASE_DIR, "..", "data", "serviceAccountKey.json")
    cred = credentials.Certificate(KEY_PATH)

firebase_admin.initialize_app(cred)
db = firestore.client()

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="Policy-First Expense Auditor")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

DATA_DIR   = os.path.join(BASE_DIR, "..", "data")
IMAGES_DIR = os.path.join(DATA_DIR, "images")
os.makedirs(IMAGES_DIR, exist_ok=True)
app.mount("/receipts", StaticFiles(directory=IMAGES_DIR), name="receipts")

# ── POST /upload ──────────────────────────────────────────────────────────────
@app.post("/upload")
async def upload_receipt(
    file: UploadFile = File(...),
    employee: str = Form(...),
    purpose: str = Form(...),
    expense_date: str = Form(default=""),
    user_id: str = Form(default=""),
    user_email: str = Form(default=""),
):
    file_bytes = await file.read()

    ext = os.path.splitext(file.filename or "receipt")[1] or ".jpg"
    image_filename = f"{uuid.uuid4()}{ext}"
    with open(os.path.join(IMAGES_DIR, image_filename), "wb") as f:
        f.write(file_bytes)

    ocr_result = extract_text_from_image(file_bytes, file.filename)
    if "error" in ocr_result:
        raise HTTPException(status_code=400, detail=ocr_result["error"])

    receipt_text = ocr_result["raw_text"] or "No text extracted"

    date_warning = ""
    if expense_date and ocr_result.get("date", "Unknown") != "Unknown":
        if expense_date not in ocr_result["date"] and ocr_result["date"] not in expense_date:
            date_warning = f"Date mismatch: claimed {expense_date}, receipt shows {ocr_result['date']}"

    # Duplicate detection
    existing = db.collection("claims")\
        .where("user_id", "==", user_id)\
        .where("merchant", "==", ocr_result.get("merchant", ""))\
        .where("amount", "==", ocr_result.get("amount", ""))\
        .where("date", "==", ocr_result.get("date", ""))\
        .limit(1).get()
    is_duplicate = len(existing) > 0

    policy_context = get_policy_context(purpose, receipt_text)
    policy_snippet = get_policy_snippet(purpose, receipt_text)

    try:
        audit = audit_expense(policy_context, receipt_text, purpose)
    except RuntimeError as e:
        raise HTTPException(status_code=429, detail=str(e))

    now = datetime.utcnow().isoformat()
    notifications = [{"type": "submitted", "message": "Your expense claim has been submitted and is under review.", "timestamp": now}]

    if is_duplicate:
        notifications.append({"type": "warning", "message": "Possible duplicate detected.", "timestamp": now})

    if audit["decision"] == "Approved":
        notifications.append({"type": "approved", "message": "Your claim has been approved. Reimbursement will be processed within 5–7 business days.", "timestamp": now})
    elif audit["decision"] == "Rejected":
        notifications.append({"type": "rejected", "message": f"Your claim was rejected: {audit['reason']}", "timestamp": now})
    else:
        notifications.append({"type": "flagged", "message": f"Your claim requires further review: {audit['reason']}", "timestamp": now})

    claim_id = str(uuid.uuid4())
    claim = {
        "id": claim_id,
        "employee": employee,
        "purpose": purpose,
        "user_id": user_id,
        "user_email": user_email,
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
        "submitted_at": now,
        "overridden": False,
        "override_reason": "",
        "notifications": notifications,
    }

    db.collection("claims").document(claim_id).set(claim)
    return claim


# ── GET /claims ───────────────────────────────────────────────────────────────
@app.get("/claims")
def get_claims():
    docs = db.collection("claims").get()
    claims = [d.to_dict() for d in docs]
    risk_order = {"High": 0, "Medium": 1, "Low": 2}
    claims.sort(key=lambda c: risk_order.get(c.get("risk", "Low"), 2))
    return claims


# ── GET /claims/{id} ──────────────────────────────────────────────────────────
@app.get("/claims/{claim_id}")
def get_claim(claim_id: str):
    doc = db.collection("claims").document(claim_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Claim not found")
    return doc.to_dict()


# ── POST /override ────────────────────────────────────────────────────────────
class OverrideRequest(BaseModel):
    claim_id: str
    new_decision: str
    override_reason: str = ""


@app.post("/override")
def override_claim(body: OverrideRequest):
    ref = db.collection("claims").document(body.claim_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Claim not found")
    claim = doc.to_dict()
    now = datetime.utcnow().isoformat()
    notifications = claim.get("notifications", [])
    notifications.append({
        "type": "override",
        "message": f"Finance team updated your claim to '{body.new_decision}'. Note: {body.override_reason}",
        "timestamp": now,
    })
    ref.update({
        "decision": body.new_decision,
        "overridden": True,
        "override_reason": body.override_reason,
        "notifications": notifications,
    })
    return ref.get().to_dict()


# ── GET /my-claims/{user_id} ──────────────────────────────────────────────────
@app.get("/my-claims/{user_id}")
def get_my_claims(user_id: str):
    docs = db.collection("claims").where("user_id", "==", user_id).get()
    return [d.to_dict() for d in docs]


# ── GET /notifications/{user_id} ─────────────────────────────────────────────
@app.get("/notifications/{user_id}")
def get_notifications(user_id: str):
    docs = db.collection("claims").where("user_id", "==", user_id).get()
    result = []
    for doc in docs:
        claim = doc.to_dict()
        for n in claim.get("notifications", []):
            result.append({**n, "claim_id": claim["id"], "merchant": claim["merchant"], "amount": claim["amount"], "currency": claim["currency"]})
    result.sort(key=lambda x: x["timestamp"], reverse=True)
    return result


# ── GET /analytics ────────────────────────────────────────────────────────────
@app.get("/analytics")
def get_analytics():
    docs = db.collection("claims").get()
    claims = [d.to_dict() for d in docs]
    if not claims:
        return {"by_decision": {}, "by_category": {}, "by_risk": {}, "avg_score": 0, "total": 0, "duplicate_count": 0}
    by_decision: dict = {}
    by_category: dict = {}
    by_risk: dict = {}
    scores = []
    duplicates = 0
    for c in claims:
        by_decision[c.get("decision", "Unknown")] = by_decision.get(c.get("decision", "Unknown"), 0) + 1
        by_category[c.get("category", "Other")] = by_category.get(c.get("category", "Other"), 0) + 1
        by_risk[c.get("risk", "Unknown")] = by_risk.get(c.get("risk", "Unknown"), 0) + 1
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


# ── POST /policy/upload ───────────────────────────────────────────────────────
@app.post("/policy/upload")
async def upload_policy(file: UploadFile = File(...)):
    file_bytes = await file.read()
    filename = (file.filename or "").lower()
    if filename.endswith(".pdf"):
        import io, pdfplumber
        text_pages = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text_pages.append(t)
        text = "\n\n".join(text_pages)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
    elif filename.endswith(".txt"):
        text = file_bytes.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(status_code=400, detail="Only .txt or .pdf files are supported.")
    policy_path = os.path.join(DATA_DIR, "policy.txt")
    with open(policy_path, "w", encoding="utf-8") as f:
        f.write(text)
    return {"message": "Policy updated successfully.", "word_count": len(text.split())}


# ── GET /policy/preview ───────────────────────────────────────────────────────
@app.get("/policy/preview")
def preview_policy():
    policy_path = os.path.join(DATA_DIR, "policy.txt")
    if not os.path.exists(policy_path):
        return {"preview": "No policy loaded.", "word_count": 0}
    with open(policy_path, "r", encoding="utf-8") as f:
        text = f.read()
    words = text.split()
    preview = " ".join(words[:500]) + ("..." if len(words) > 500 else "")
    return {"preview": preview, "word_count": len(words)}
