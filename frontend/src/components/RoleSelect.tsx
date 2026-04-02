import { useState } from "react";

type Role = "employee" | "auditor";

interface Props {
  onSelect: (role: Role) => void;
}

export default function RoleSelect({ onSelect }: Props) {
  const [logoExpanded, setLogoExpanded] = useState(false);
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-3xl opacity-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600 rounded-full blur-3xl opacity-10 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-3xl">

        {/* Logo — click to expand */}
        <div className="flex flex-col items-center mb-3 cursor-pointer" onClick={() => setLogoExpanded(v => !v)}>
          <img
            src="/logo.png"
            alt="ExpenseAudit"
            className={`transition-all duration-500 ease-in-out ${logoExpanded ? "h-32 drop-shadow-2xl scale-105" : "h-12"}`}
          />
          {logoExpanded && (
            <p className="text-slate-500 text-xs mt-2 animate-pulse">Click to collapse</p>
          )}
        </div>

        <span className="text-2xl font-bold text-white tracking-tight">ExpenseAudit</span>

        <p className="text-slate-400 text-sm mb-1">Policy-First Expense Compliance</p>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-700 my-6" />

        <h2 className="text-slate-200 text-base font-medium mb-8">How are you accessing today?</h2>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">

          {/* Employee */}
          <button onClick={() => onSelect("employee")}
            className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl p-7 text-left transition-all duration-200 overflow-hidden">
            {/* hover glow */}
            <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl" />

            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 bg-slate-800 group-hover:bg-indigo-600/20 border border-slate-700 group-hover:border-indigo-500/50 rounded-xl flex items-center justify-center transition-all">
                <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <svg className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            <h3 className="text-white font-semibold text-base mb-1.5">Employee</h3>
            <p className="text-slate-500 text-sm leading-relaxed group-hover:text-slate-400 transition-colors">
              Submit receipts, track your claims, and view audit decisions on your expenses.
            </p>

            <div className="mt-5 flex gap-2 flex-wrap">
              {["Submit Receipt", "Track Claims", "Notifications"].map(tag => (
                <span key={tag} className="text-xs bg-slate-800 group-hover:bg-indigo-950 border border-slate-700 group-hover:border-indigo-800 text-slate-500 group-hover:text-indigo-400 px-2.5 py-1 rounded-full transition-all">
                  {tag}
                </span>
              ))}
            </div>
          </button>

          {/* Finance Auditor */}
          <button onClick={() => onSelect("auditor")}
            className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-2xl p-7 text-left transition-all duration-200 overflow-hidden">
            <div className="absolute inset-0 bg-emerald-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl" />

            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 bg-slate-800 group-hover:bg-emerald-600/20 border border-slate-700 group-hover:border-emerald-500/50 rounded-xl flex items-center justify-center transition-all">
                <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            <h3 className="text-white font-semibold text-base mb-1.5">Finance Auditor</h3>
            <p className="text-slate-500 text-sm leading-relaxed group-hover:text-slate-400 transition-colors">
              Review all claims, override AI decisions, and monitor spend analytics.
            </p>

            <div className="mt-5 flex gap-2 flex-wrap">
              {["Claims Dashboard", "Override", "Analytics"].map(tag => (
                <span key={tag} className="text-xs bg-slate-800 group-hover:bg-emerald-950 border border-slate-700 group-hover:border-emerald-800 text-slate-500 group-hover:text-emerald-400 px-2.5 py-1 rounded-full transition-all">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        </div>

        {/* Bottom note */}
        <p className="text-slate-700 text-xs mt-10">
          © 2025 ExpenseAudit · Policy-First Compliance Engine
        </p>
      </div>
    </div>
  );
}
