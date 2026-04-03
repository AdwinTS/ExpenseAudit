import { useState } from "react";
import type { User } from "firebase/auth";
import { sendClaimEmail } from "../lib/sendEmail";

const API = "http://localhost:8000";

interface Claim {
  id: string; employee: string; purpose: string; merchant: string;
  date: string; amount: string; currency: string; decision: string;
  reason: string; risk: string; image_quality: string; date_warning?: string;
}

const steps = [
  {
    number: "01",
    title: "Fill in Your Details",
    desc: "Enter your name, the date of the expense, and a clear business justification for the spend.",
  },
  {
    number: "02",
    title: "Upload Your Receipt",
    desc: "Attach a photo or PDF of your receipt. Our system will automatically extract the merchant, date, and amount.",
  },
  {
    number: "03",
    title: "Instant Policy Check",
    desc: "Your claim is cross-referenced against the company's Travel & Expense Policy in real time.",
  },
  {
    number: "04",
    title: "Receive Your Decision",
    desc: "You'll receive an Approved, Flagged, or Rejected status with a clear explanation. Check the Notifications tab for updates.",
  },
];

const statusConfig: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  Approved: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "✓" },
  Flagged:  { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   icon: "⚠" },
  Rejected: { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",    icon: "✗" },
};

const riskColors: Record<string, string> = {
  Low: "text-emerald-600", Medium: "text-amber-600", High: "text-rose-600",
};

export default function Upload({ user }: { user: User }) {
  const [employee, setEmployee] = useState(user.displayName || "");
  const [purpose, setPurpose] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Claim | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !employee || !purpose) { setError("Please complete all required fields before submitting."); return; }
    setError(""); setLoading(true); setResult(null);
    const form = new FormData();
    form.append("file", file);
    form.append("employee", employee);
    form.append("purpose", purpose);
    form.append("expense_date", expenseDate);
    form.append("user_id", user.uid);
    form.append("user_email", user.email || "");
    try {
      const res = await fetch(`${API}/upload`, { method: "POST", body: form });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Submission failed."); }
      const data = await res.json();
      setResult(data);

      // Send email notification to the employee
      if (user.email) {
        const statusMessages: Record<string, string> = {
          Approved: "Your claim has been approved. Reimbursement will be processed within 5–7 business days.",
          Flagged:  `Your claim requires further review: ${data.reason}`,
          Rejected: `Your claim was rejected: ${data.reason}`,
        };
        try {
          await sendClaimEmail({
            to_email:      user.email,
            employee_name: employee,
            status:        data.decision,
            merchant:      data.merchant,
            currency:      data.currency,
            amount:        data.amount,
            message:       statusMessages[data.decision] || data.reason,
          });
          console.log("Email sent successfully to", user.email);
        } catch (emailErr) {
          console.error("EmailJS error:", emailErr);
        }
      }
      setEmployee(user.displayName || ""); setPurpose(""); setExpenseDate(""); setFile(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

      {/* LEFT: How it works */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-1">How It Works</h2>
          <p className="text-xs text-slate-500 mb-5">Submit your expense claim in four simple steps. Our AI audit engine ensures every claim is reviewed fairly and consistently against company policy.</p>
          <div className="space-y-5">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {step.number}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5">
          <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">Good to Know</p>
          <ul className="space-y-2 text-xs text-indigo-900 leading-relaxed">
            <li className="flex gap-2"><span>•</span><span>Receipts must be submitted within 30 days of the transaction.</span></li>
            <li className="flex gap-2"><span>•</span><span>Receipts are required for all expenses over $25.</span></li>
            <li className="flex gap-2"><span>•</span><span>Approved claims are processed within 5–7 business days.</span></li>
            <li className="flex gap-2"><span>•</span><span>You may appeal a rejected claim once with additional documentation.</span></li>
          </ul>
        </div>
      </div>

      {/* RIGHT: Form + Result */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Expense Claim Submission</h2>
            <p className="text-xs text-slate-500 mt-0.5">All fields marked are required. Please ensure your receipt is legible before uploading.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee Name <span className="text-rose-500">*</span></label>
              <input type="text" value={employee} onChange={(e) => setEmployee(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-slate-300 rounded-md px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              <p className="text-xs text-slate-400 mt-1">Signed in as {user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Expense Date <span className="text-rose-500">*</span></label>
              <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Purpose <span className="text-rose-500">*</span></label>
            <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3}
              placeholder="e.g. Client dinner with Acme Corp stakeholders to discuss Q2 contract renewal"
              className="w-full border border-slate-300 rounded-md px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
            <p className="text-xs text-slate-400 mt-1">Be specific — a clear business purpose helps ensure accurate policy matching.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Receipt Document <span className="text-rose-500">*</span></label>
            <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer">
              <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-indigo-700 font-medium">{file.name}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-slate-400 hover:text-slate-600 ml-1 text-xs">✕ Remove</button>
                </div>
              ) : (
                <div>
                  <svg className="w-9 h-9 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-slate-500 font-medium">Click to upload your receipt</p>
                  <p className="text-xs text-slate-400 mt-1">Supported formats: JPG, PNG, PDF — up to 10 MB</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-md p-3.5 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-md transition-colors text-sm shadow-sm">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Analysing receipt and checking policy...
              </span>
            ) : "Submit Expense Claim"}
          </button>
        </form>

        {result && (() => {
          const cfg = statusConfig[result.decision] || { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", icon: "•" };
          return (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className={`px-6 py-4 border-b ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Audit Complete</h3>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    {cfg.icon} {result.decision}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex-1">
                    <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Auditor's Note</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{result.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500 mb-1">Risk Level</p>
                    <p className={`text-sm font-bold ${riskColors[result.risk] || "text-slate-600"}`}>{result.risk}</p>
                  </div>
                </div>

                {result.date_warning && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-amber-800">{result.date_warning}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                  {[
                    { label: "Merchant", value: result.merchant },
                    { label: "Date on Receipt", value: result.date },
                    { label: "Amount", value: `${result.currency} ${result.amount}` },
                    { label: "Image Quality", value: result.image_quality },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-xs text-slate-400 mb-0.5">{f.label}</p>
                      <p className="text-sm font-medium text-slate-800 capitalize">{f.value}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                  Your claim has been recorded. Visit the <span className="text-indigo-600 font-medium">Notifications</span> tab to track future updates from the Finance team.
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
