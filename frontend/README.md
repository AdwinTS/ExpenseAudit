# Frontend — ExpenseAudit

React + TypeScript frontend for the Policy-First Expense Auditor. Provides role-based views for employees and finance auditors, with Firebase authentication and real-time claim tracking.

---

## Stack

| Component | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Auth | Firebase Email/Password |
| Email | EmailJS (SMTP) |

---

## Project Structure

```
src/
├── App.tsx                  # Root — auth state, role routing, nav
├── firebase.ts              # Firebase app + auth initialisation
├── main.tsx                 # React entry point
├── index.css                # Tailwind import
│
├── lib/
│   └── sendEmail.ts         # EmailJS utility — sends claim notifications
│
└── components/
    ├── RoleSelect.tsx        # Landing page — Employee / Finance Auditor selector
    ├── Login.tsx             # Firebase sign in + sign up form
    ├── Upload.tsx            # Employee: submit expense + how-it-works panel
    ├── Dashboard.tsx         # Auditor: claims table with override + risk sort
    ├── ClaimDetail.tsx       # Audit trail timeline + side-by-side detail view
    ├── SpendAnalytics.tsx    # Pie charts: by decision, category, risk
    ├── MyExpenses.tsx        # Employee: personal claim history (auth-scoped)
    ├── Notifications.tsx     # Employee: status update inbox (auth-scoped)
    └── PolicyManager.tsx     # Auditor: upload PDF/TXT policy, preview active policy, instant hot-swap
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Create `frontend/.env.local`:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

### 3. Run development server
```bash
npm run dev
```

App runs at: http://localhost:5173

---

## Role-Based Navigation

### Employee
- Submit Expense — upload receipt, get instant AI audit decision
- My Expenses — personal claim history with compliance scores
- Notifications — timestamped status updates for all claims

### Finance Auditor
- Claims Dashboard — all claims sorted by risk, with override capability
- Analytics — pie charts: by decision, category, risk level
- Policy Manager — upload/replace the company T&E policy document (PDF or TXT)

---

## Authentication Flow

```
App loads → Firebase auth state check
      ↓
Not authenticated → RoleSelect → Login
      ↓
Authenticated → Role-specific nav + scoped data
      ↓
Sign out → back to RoleSelect
```

---

## Email Notifications

Emails are sent via EmailJS on two events:
- **Claim submitted** — employee receives decision (Approved/Flagged/Rejected) with reason
- **Decision overridden** — employee receives updated decision with auditor's note

Configure your EmailJS template with these variables:
`{{to_email}}`, `{{employee_name}}`, `{{status}}`, `{{merchant}}`, `{{currency}}`, `{{amount}}`, `{{message}}`

---

## Policy Manager

The Finance Auditor can upload a new company policy at any time from the **Policy** tab:

- Accepts `.txt` or `.pdf` files
- PDF text is extracted server-side via pdfplumber
- New policy takes effect immediately for all future claim audits
- Current policy is previewed with word count so auditors can verify the upload
