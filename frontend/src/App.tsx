import { useState } from "react";
import Upload from "./components/Upload";
import Dashboard from "./components/Dashboard";
import ClaimDetail from "./components/ClaimDetail";
import Notifications from "./components/Notifications";
import SpendAnalytics from "./components/SpendAnalytics";
import MyExpenses from "./components/MyExpenses";

export type Tab = "upload" | "dashboard" | "analytics" | "my-expenses" | "notifications";

export default function App() {
  const [tab, setTab] = useState<Tab>("upload");
  const [detailId, setDetailId] = useState<string | null>(null);

  const navItems: { key: Tab; label: string }[] = [
    { key: "upload", label: "Submit Expense" },
    { key: "my-expenses", label: "My Expenses" },
    { key: "dashboard", label: "Finance Dashboard" },
    { key: "analytics", label: "Analytics" },
    { key: "notifications", label: "Notifications" },
  ];

  const pageTitles: Record<Tab, { title: string; sub: string }> = {
    "upload":        { title: "Submit Expense Claim",    sub: "Upload your receipt and provide a business justification for review." },
    "my-expenses":   { title: "My Expense History",      sub: "View all your submitted claims and their current audit status." },
    "dashboard":     { title: "Claims Overview",         sub: "Review, audit, and manage all submitted expense claims — sorted by risk level." },
    "analytics":     { title: "Spend Analytics",         sub: "Visualise claim trends, category breakdown, and compliance scores across all submissions." },
    "notifications": { title: "Notifications",           sub: "Track the status of your submitted expense claims." },
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 rounded-lg p-1.5">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold tracking-tight">ExpenseAudit</span>
              <span className="text-slate-400 text-xs ml-2">Policy-First Compliance</span>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <button key={item.key} onClick={() => { setTab(item.key); setDetailId(null); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === item.key ? "bg-indigo-600 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800"}`}>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {detailId ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setDetailId(null)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                ← Back
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-sm text-slate-600">Claim Detail</span>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-slate-800">{pageTitles[tab].title}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{pageTitles[tab].sub}</p>
            </>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {detailId ? (
          <ClaimDetail claimId={detailId} onBack={() => setDetailId(null)} />
        ) : tab === "upload" ? (
          <Upload />
        ) : tab === "dashboard" ? (
          <Dashboard onViewDetail={(id) => { setDetailId(id); }} />
        ) : tab === "analytics" ? (
          <SpendAnalytics />
        ) : tab === "my-expenses" ? (
          <MyExpenses onViewDetail={(id) => { setDetailId(id); }} />
        ) : (
          <Notifications />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">© 2025 ExpenseAudit · Policy-First Compliance Engine</span>
          <span className="text-xs text-slate-400">Powered by AI Audit · Groq LLaMA 3.3</span>
        </div>
      </footer>
    </div>
  );
}
