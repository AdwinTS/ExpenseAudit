# ExpenseAudit — Policy-First Expense Auditor

An intelligent, AI-powered expense compliance platform that automatically audits employee expense claims against company policy — eliminating manual review, reducing spend leakage, and delivering instant, explainable decisions.

---

## Overview

Corporate expense auditing is a high-stakes, repetitive process. Finance teams spend hours cross-referencing receipts against multi-page policy documents, leading to backlogs, inconsistency, and non-compliant claims slipping through.

This platform solves that by combining **OCR receipt extraction**, **policy-aware RAG retrieval**, and **LLM-based auditing** into a single end-to-end workflow. Every claim is evaluated against the company's Travel & Expense Policy in real time, with a clear decision and a cited policy reason — no human bottleneck required.

---

## Features

### Role-Based Access
- Dark landing page with role selector on first load
- **Employee** view: Submit Expense, My Expenses, Notifications
- **Finance Auditor** view: Claims Dashboard, Analytics
- Role badge shown in navbar with a one-click "Switch" to return to the selector
- No backend auth required — clean frontend role separation

### Employee Portal
- Upload receipts as **JPG, PNG, or PDF**
- Provide a business justification and expense date
- Receive an instant audit decision: **Approved**, **Flagged**, or **Rejected**
- Automatic date consistency check (claimed date vs. receipt date)
- Image quality validation (blur detection)

### AI Audit Engine
- OCR extracts **Merchant Name**, **Date**, **Amount**, and **Currency** from receipts
- Policy document is chunked and searched using keyword-based RAG
- LLM (Groq LLaMA 3.3 70B) evaluates the claim against the most relevant policy sections
- Returns a decision with a **one-sentence explanation citing the specific policy rule**
- **Expense category auto-detection**: classifies each claim as Meals, Travel, Lodging, Equipment, etc.
- **Compliance score**: 0–100 score per claim indicating degree of policy adherence
- Risk scoring: **Low / Medium / High**
- **Duplicate detection**: flags claims with matching merchant, amount, and date from the same employee

### Finance Dashboard
- Table of all claims sorted by **risk level** (High → Medium → Low)
- Summary cards: Total, Approved, Flagged, Rejected
- Columns include **category tag** and **compliance score** per claim
- Duplicate warning badge on suspicious claims
- **Override** any AI decision with a custom comment
- Click any claim to open the **Audit Detail View**

### Spend Analytics
- KPI cards: total claims, average compliance score, high-risk count, duplicate count
- Three interactive **pie charts**: claims by decision, by expense category, and by risk level
- Percentage labels on each slice with hover tooltips showing exact counts
- Live data from all submitted claims

### My Expenses (Employee View)
- Employees search by name to see their personal claim history
- Shows category, compliance score, duplicate flag, and audit reason per claim
- Direct link to the full audit detail view for each claim

### Audit Detail View
- Side-by-side layout: Receipt image | Extracted OCR data | Policy snippet + AI decision
- **Visual audit trail timeline**: Submitted → Under Review → Decision → Overridden with coloured step indicators
- Shows the exact policy section the AI used to make its decision
- Displays date warnings and image quality flags
- PDF receipts open in a new tab; images render inline

### Notifications
- Employees can look up their claim status by name
- Timestamped updates for every stage: Submitted, Approved, Flagged, Rejected, Overridden

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite 5, Recharts |
| Backend | Python 3.14, FastAPI, Uvicorn |
| OCR | Pytesseract + Pillow + pdf2image |
| LLM | Groq API — LLaMA 3.3 70B Versatile |
| Policy RAG | Keyword-based chunk retrieval (no vector DB) |
| Storage | JSON flat file + local image storage |

---

## Project Structure
```
expenseauditor/
├── backend/
│   ├── app.py              # FastAPI routes: /upload, /claims, /override, /notifications, /analytics, /my-claims
│   ├── ocr.py              # OCR extraction, blur detection, PDF conversion
│   ├── llm.py              # Groq LLM audit — decision, reason, category, compliance score
│   ├── policy_engine.py    # Policy chunking and keyword-based RAG retrieval
│   └── requirements.txt
│
├── data/
│   ├── policy.txt          # 12-section company T&E policy document
│   ├── claims.json         # Persisted claims store
│   └── images/             # Uploaded receipt files
│
├── frontend/
│   └── src/
│       ├── App.tsx
│       └── components/
│           ├── RoleSelect.tsx      # Dark landing page with employee / auditor role selector
│           ├── Upload.tsx          # Employee submission portal with how-it-works panel
│           ├── Dashboard.tsx       # Finance overview table with category + score columns
│           ├── ClaimDetail.tsx     # Audit trail timeline + side-by-side detail view
│           ├── SpendAnalytics.tsx  # Pie charts: by decision, category, risk
│           ├── MyExpenses.tsx      # Employee personal claim history
│           └── Notifications.tsx  # Employee status update inbox
│
├── expense/                # Python virtual environment
├── .env.local              # API keys (not committed)
├── APPROACH.md             # Solution design document
└── README.md
```

---

## Prerequisites

Before running the project, ensure the following are installed:

- **Python 3.10+** — [python.org](https://www.python.org/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **Tesseract OCR** — [Windows installer](https://github.com/UB-Mannheim/tesseract/wiki)
- **Poppler** (for PDF support) — [Windows binaries](https://github.com/oschwartz10612/poppler-windows/releases)
- **Groq API key** (free) — [console.groq.com](https://console.groq.com/keys)

---

## Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/expense-auditor.git
cd expense-auditor
```

### 2. Create and activate the Python virtual environment
```bash
python -m venv expense
# Windows
expense\Scripts\activate
```

### 3. Install backend dependencies
```bash
pip install -r backend/requirements.txt
```

### 4. Configure paths and API key

Open `backend/ocr.py` and set your Tesseract and Poppler paths:
```python
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
POPPLER_PATH = r"C:\poppler\Library\bin"
```

Create a `.env.local` file in the project root:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 5. Install frontend dependencies
```bash
cd frontend
npm install recharts
npm install
```

---

## Running the Application

Open two terminals:

**Terminal 1 — Backend**
```bash
cd backend
uvicorn app:app --reload --port 8000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

The API is available at [http://localhost:8000](http://localhost:8000) — visit [http://localhost:8000/docs](http://localhost:8000/docs) for the interactive Swagger UI.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Submit a receipt for OCR + AI audit |
| `GET` | `/claims` | Retrieve all claims, sorted by risk |
| `GET` | `/claims/{id}` | Get a single claim by ID |
| `POST` | `/override` | Override an AI decision with a custom note |
| `GET` | `/notifications/{employee}` | Get all status updates for an employee |
| `GET` | `/my-claims/{employee}` | Get all claims submitted by an employee |
| `GET` | `/analytics` | Aggregated stats: by decision, category, risk, avg score |

---

## How the Audit Works
```
Employee uploads receipt
        ↓
OCR extracts: Merchant, Date, Amount, Currency + blur/quality check
        ↓
Duplicate detection: checks for same merchant + amount + date from same employee
        ↓
Policy document is chunked into paragraphs
        ↓
Top 4 most relevant chunks retrieved via keyword matching
        ↓
LLM receives: policy chunks + receipt text + business purpose
        ↓
LLM returns: Decision + Reason (citing policy rule) + Risk + Category + Compliance Score
        ↓
Claim saved with full audit trail + notifications generated
        ↓
Finance dashboard sorted by risk · Analytics updated · Employee notified
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Your Groq API key for LLaMA 3.3 inference |

---

## Notes

- All data is stored locally in `data/claims.json` and `data/images/`. No external database is required.
- The policy document (`data/policy.txt`) can be replaced with your own company policy. The RAG engine will automatically adapt.
- This project is designed for hackathon and demo use. For production, replace the JSON store with a proper database and add authentication.

---

## License

MIT License — free to use, modify, and distribute.
