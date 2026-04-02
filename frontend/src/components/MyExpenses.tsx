import { useState } from "react";

const API = "http://localhost:8000";

interface Claim {
  id: string; employee: string; purpose: string; merchant: string;
  date: string; amount: string; currency: string; decision: string;
  risk: string; category: string; compliance_score: number;
  submitted_at: string; is_duplicate: boolean; reason: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  Approved: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  Flagged:  { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"   },
  Rejected: { bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500"    },
};

const scoreColor = (s: number) => s >= 80 ? "text-emerald-600" : s >= 50 ? "text-amber-600" : "text-rose-600";

export default function MyExpenses({ onViewDetail }: { onViewDetail: (id: string) => void }) {
  const [name, setName] = useState("");
  const [searched, setSearched] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch(`${API}/my-claims/${encodeURIComponent(name.trim())}`);
    const data = await res.json();
    setClaims(data.reverse());
    setSearched(name.trim());
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1">My Expense History</h2>
        <p className="text-xs text-slate-500 mb-4">Enter your name to view all your submitted claims and their current audit status.</p>
        <div className="flex gap-3">
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Enter your full name..."
            className="flex-1 border border-slate-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={search} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors disabled:bg-slate-300">
            {loading ? "..." : "Search"}
          </button>
        </div>
      </div>

      {searched && (
        <>
          {claims.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-slate-400 text-sm">
              No claims found for "{searched}".
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">{claims.length} claim{claims.length !== 1 ? "s" : ""} for "{searched}"</p>
              {claims.map(claim => {
                const cfg = statusConfig[claim.decision] || { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
                return (
                  <div key={claim.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800">{claim.merchant}</p>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{claim.category}</span>
                          {claim.is_duplicate && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⚠ Possible Duplicate</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{claim.purpose}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                          {claim.decision}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                      <div><p className="text-slate-400">Amount</p><p className="font-medium text-slate-700">{claim.currency} {claim.amount}</p></div>
                      <div><p className="text-slate-400">Date</p><p className="font-medium text-slate-700">{claim.date}</p></div>
                      <div>
                        <p className="text-slate-400">Compliance Score</p>
                        <p className={`font-bold ${scoreColor(claim.compliance_score)}`}>{claim.compliance_score}<span className="text-slate-400 font-normal">/100</span></p>
                      </div>
                      <div><p className="text-slate-400">Submitted</p><p className="font-medium text-slate-700">{new Date(claim.submitted_at).toLocaleDateString()}</p></div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-slate-500 italic">{claim.reason}</p>
                      <button onClick={() => onViewDetail(claim.id)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-4 flex-shrink-0">
                        View Detail →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
