# Backend — ExpenseAudit API

FastAPI backend powering the Policy-First Expense Auditor. Handles receipt OCR, policy RAG retrieval, LLM auditing, and Firestore persistence.

---

## Stack

| Component | Technology |
|---|---|
| Framework | FastAPI + Uvicorn |
| OCR | Pytesseract + pdf2image + Pillow |
| LLM | Groq API (LLaMA 3.3 70B) |
| Policy RAG | Keyword-based chunk retrieval |
| Database | Google Firestore (via firebase-admin) |
| PDF parsing | pdfplumber |

---

## File Overview

| File | Purpose |
|---|---|
| `app.py` | All API routes — upload, claims, override, notifications, analytics, policy |
| `ocr.py` | Receipt OCR — text extraction, blur detection, field parsing |
| `llm.py` | Groq LLM prompt, audit logic, response parsing |
| `policy_engine.py` | Policy chunking and keyword-based RAG retrieval |
| `requirements.txt` | Python dependencies |

---

## Setup

### 1. Activate virtual environment
```bash
# Windows
expense\Scripts\activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure paths in `ocr.py`
```python
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
POPPLER_PATH = r"C:\poppler\Library\bin"
```

### 4. Set environment variables
Create `.env.local` in the project root:
```env
GROQ_API_KEY=your_groq_api_key
```

### 5. Place Firebase service account key
```
data/serviceAccountKey.json
```
Download from Firebase Console → Project Settings → Service Accounts → Generate new private key.

---

## Running

```bash
cd backend
uvicorn app:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Submit receipt — runs OCR + LLM audit, saves to Firestore |
| `GET` | `/claims` | All claims sorted by risk level |
| `GET` | `/claims/{id}` | Single claim by ID |
| `POST` | `/override` | Finance auditor overrides a decision |
| `GET` | `/my-claims/{user_id}` | Claims for a specific user (Firebase UID) |
| `GET` | `/notifications/{user_id}` | Status notifications for a user |
| `GET` | `/analytics` | Aggregated stats: by decision, category, risk, avg score |
| `POST` | `/policy/upload` | Upload new policy PDF or TXT — replaces active policy immediately |
| `GET` | `/policy/preview` | Preview current policy (first 500 words + word count) |

---

## Policy Management

The Finance Auditor can replace the company policy at any time without restarting the server:

- Upload a `.txt` or `.pdf` file via `POST /policy/upload`
- PDF text is extracted automatically using `pdfplumber`
- The new policy is saved to `data/policy.txt` and takes effect immediately for all future audits
- Preview the active policy via `GET /policy/preview`

The policy RAG engine in `policy_engine.py` re-reads `policy.txt` on every request, so no restart is needed after an update.

```
Receipt uploaded
      ↓
OCR extracts: Merchant, Date, Amount, Currency
      ↓
Blur detection + date consistency check
      ↓
Duplicate detection via Firestore query
      ↓
Policy chunked → top 4 chunks retrieved by keyword overlap
      ↓
LLM prompt: policy + receipt text + business purpose
      ↓
LLM returns: Decision, Reason, Risk, Category, Compliance Score
      ↓
Claim saved to Firestore + notifications generated
```

## How the Audit Pipeline Works

```
Receipt uploaded
      ↓
OCR extracts: Merchant, Date, Amount, Currency
      ↓
Blur detection + date consistency check
      ↓
Duplicate detection via Firestore query
      ↓
Policy chunked → top 4 chunks retrieved by keyword overlap
      ↓
LLM prompt: policy + receipt text + business purpose
      ↓
LLM returns: Decision, Reason, Risk, Category, Compliance Score
      ↓
Claim saved to Firestore + notifications generated
```

---

## Deployment (Render)

The backend is deployed on Render using Docker.

- Live API: https://expenseaudit-1.onrender.com
- Swagger docs: https://expenseaudit-1.onrender.com/docs

### Docker setup
The `Dockerfile` at the project root installs `tesseract-ocr` and `poppler-utils` as system packages, copies the backend code and `data/policy.txt`, installs Python dependencies, and starts uvicorn.

### Environment variables on Render
| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key for LLaMA 3.3 inference |
| `GOOGLE_CREDENTIALS_JSON` | Full JSON contents of `serviceAccountKey.json` |

> Note: Render's free tier has cold starts after 15 min inactivity. First request may take ~30 seconds.
