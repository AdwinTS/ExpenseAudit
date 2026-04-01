import { useEffect, useState } from "react";

const API = "http://localhost:8000";

interface Claim {
  id: string;
  employee: string;
  purpose: string;
  merchant: string;
  date: string;
  amount: string;
  currency: string;
  decision: string;
  reason: string;
  risk: string;
  submitted_at: string;
  overridden: boolean;
  override_reason?: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  Approved: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  Flagged:  { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"   },
  Rejected: { bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500"    },
};

const riskConfig: Record<string, string> = {
  Low:    "text-emerald-600",
  Medium: "text-amber-600",
  High:   "text-rose-600",
};

export default function Dashboard({ onViewDetail }: { onViewDetail: (id: string) => void }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [overrideDecision, setOverrideDecision] = useState("Approved");
  const [overrideReason, setOverrideReason] = useState("");

  async function fetchClaims() {
    setLoading(true);
    const res = await fetch(`${API}/claims`);
    const data = await res.json();
    setClaims(data.reverse());
    setLoading(false);
  }

  useEffect(() => { fetchClaims(); }, []);

  async function submitOverride(id: string) {
    await fetch(`${API}/override`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim_id: id, new_decision: overrideDecision, override_reason: overrideReason }),
    });
    setOverrideId(null);
    setOverrideReason("");
    fetchClaims();
  }

  const total = claims.length;
  const approved = claims.filter(c => c.decision === "Approved").length;
  const flagged  = claims.filter(c => c.decision === "Flagged").length;
  const rejected = claims.filter(c => c.decision === "Rejected").length;

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Claims", value: total, color: "text-slate-800", bg: "bg-white" },
          { label: "Approved",     value: approved, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Flagged",      value: flagged,  color: "text-amber-700",   bg: "bg-amber-50"   },
          { label: "Rejected",     value: rejected, color: "text-rose-700",    bg: "bg-rose-50"    },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-lg border border-slate-200 p-4 shadow-sm`}>
            <p className="text-xs text-slate-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {claims.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-500 text-sm">No claims submitted yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Merchant</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => (
                  <>
                    <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{claim.employee}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">{claim.purpose}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{claim.merchant}</td>
                      <td className="px-5 py-4 font-medium text-slate-800">{claim.currency} {claim.amount}</td>
                      <td className="px-5 py-4 text-slate-600">{claim.date}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig[claim.decision]?.bg || "bg-slate-100"} ${statusConfig[claim.decision]?.text || "text-slate-600"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[claim.decision]?.dot || "bg-slate-400"}`}></span>
                          {claim.decision}
                          {claim.overridden && <span className="ml-1 text-purple-600">(edited)</span>}
                        </span>
                      </td>
                      <td className={`px-5 py-4 text-xs font-semibold ${riskConfig[claim.risk] || "text-slate-600"}`}>{claim.risk}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <button onClick={() => onViewDetail(claim.id)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                            View
                          </button>
                          <button onClick={() => setOverrideId(overrideId === claim.id ? null : claim.id)} className="text-xs text-slate-500 hover:text-slate-700 font-medium">
                            Override
                          </button>
                        </div>
                      </td>
                    </tr>
                    {overrideId === claim.id && (
                      <tr key={`${claim.id}-override`} className="bg-indigo-50">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-medium text-slate-600">Change decision to:</span>
                            <select value={overrideDecision} onChange={(e) => setOverrideDecision(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                              <option>Approved</option>
                              <option>Flagged</option>
                              <option>Rejected</option>
                            </select>
                            <input type="text" placeholder="Reason for override..." value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <button onClick={() => submitOverride(claim.id)} className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-md hover:bg-indigo-700 font-medium">Save</button>
                            <button onClick={() => setOverrideId(null)} className="text-slate-500 text-sm hover:text-slate-700">Cancel</button>
                          </div>
                          {claim.reason && <p className="text-xs text-slate-500 mt-2 italic">AI note: {claim.reason}</p>}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
