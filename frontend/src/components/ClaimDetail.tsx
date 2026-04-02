import { useEffect, useState } from "react";

const API = "http://localhost:8000";

interface Claim {
  id: string; employee: string; purpose: string; merchant: string;
  date: string; amount: string; currency: string; decision: string;
  reason: string; risk: string; image_quality: string; raw_text: string;
  policy_snippet: string; policy_used: string; image_url: string;
  submitted_at: string; overridden: boolean; override_reason: string;
  date_warning?: string; expense_date?: string;
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  Approved: { bg: "bg-emerald-100", text: "text-emerald-700" },
  Flagged:  { bg: "bg-amber-100",   text: "text-amber-700"   },
  Rejected: { bg: "bg-rose-100",    text: "text-rose-700"    },
};

interface TimelineStep {
  label: string;
  sub: string;
  done: boolean;
  active: boolean;
  color: string;
}

function buildTimeline(claim: Claim): TimelineStep[] {
  const decided = claim.decision !== "";
  const decisionColor =
    claim.decision === "Approved" ? "bg-emerald-500" :
    claim.decision === "Rejected" ? "bg-rose-500" : "bg-amber-400";

  return [
    { label: "Submitted",     sub: new Date(claim.submitted_at).toLocaleDateString(), done: true,    active: false, color: "bg-indigo-500" },
    { label: "Under Review",  sub: "Policy cross-reference",                           done: decided, active: !decided, color: "bg-blue-500" },
    { label: claim.decision || "Decision", sub: claim.decision ? `Risk: ${claim.risk}` : "Pending", done: decided, active: decided && !claim.overridden, color: decisionColor },
    { label: "Overridden",    sub: claim.override_reason ? "By Finance team" : "—",   done: claim.overridden, active: claim.overridden, color: "bg-purple-500" },
  ];
}

interface Props { claimId: string; onBack: () => void; }

export default function ClaimDetail({ claimId }: Props) {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/claims/${claimId}`)
      .then(r => r.json())
      .then(d => { setClaim(d); setLoading(false); });
  }, [claimId]);

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  if (!claim) return <p className="text-slate-500">Claim not found.</p>;

  const cfg = statusConfig[claim.decision] || { bg: "bg-slate-100", text: "text-slate-700" };
  const timeline = buildTimeline(claim);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Claim ID: {claim.id.slice(0, 8)}...</p>
          <h2 className="text-xl font-semibold text-slate-800">{claim.employee}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{claim.purpose}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-md text-sm font-semibold ${cfg.bg} ${cfg.text}`}>{claim.decision}</span>
          {claim.overridden && <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">Overridden</span>}
        </div>
      </div>

      {/* Audit Status Timeline */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-6">Audit Trail</h3>
        <div className="flex items-start justify-between relative">
          {/* connector line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 mx-8" />
          {timeline.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center flex-1 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm
                ${step.done ? step.color : "bg-slate-200"}`}>
                {step.done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-slate-400">{i + 1}</span>
                )}
              </div>
              <p className={`text-xs font-semibold mt-2 text-center ${step.done ? "text-slate-800" : "text-slate-400"}`}>{step.label}</p>
              <p className={`text-xs mt-0.5 text-center ${step.done ? "text-slate-500" : "text-slate-300"}`}>{step.sub}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Receipt Image */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">Receipt Image</h3>
          </div>
          <div className="p-4">
            {claim.image_url ? (
              claim.image_url.toLowerCase().endsWith(".pdf") ? (
                // PDF: show an open link since browsers can't render PDF in <img>
                <div className="w-full rounded-md border border-slate-200 bg-slate-50 flex flex-col items-center justify-center py-10 gap-3">
                  <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-slate-600 font-medium">PDF Receipt</p>
                  <a href={`${API}${claim.image_url}`} target="_blank" rel="noreferrer"
                    className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                    Open PDF ↗
                  </a>
                </div>
              ) : (
                // JPG / PNG
                <img
                  src={`${API}${claim.image_url}`}
                  alt="Receipt"
                  className="w-full rounded-md border border-slate-200 object-contain max-h-96 bg-slate-50"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                    (el.nextElementSibling as HTMLElement)?.classList.remove("hidden");
                  }}
                />
              )
            ) : null}
            <div className={`h-48 bg-slate-100 rounded-md flex flex-col items-center justify-center text-slate-400 gap-2 ${claim.image_url && !claim.image_url.toLowerCase().endsWith(".pdf") ? "hidden" : "hidden"}`}>
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">Receipt image unavailable</span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Image Quality</span>
                <span className={`font-medium capitalize ${claim.image_quality === "clear" ? "text-emerald-600" : "text-amber-600"}`}>{claim.image_quality}</span>
              </div>
              {claim.date_warning && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-700 mt-2">{claim.date_warning}</div>
              )}
            </div>
          </div>
        </div>
        {/* Column 2: Extracted Data */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">Extracted Data</h3>
          </div>
          <div className="p-4 space-y-4">
            {[
              { label: "Merchant", value: claim.merchant },
              { label: "Transaction Date", value: claim.date },
              { label: "Claimed Date", value: claim.expense_date || "—" },
              { label: "Amount", value: `${claim.currency} ${claim.amount}` },
              { label: "Submitted", value: new Date(claim.submitted_at).toLocaleDateString() },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <span className="text-xs text-slate-500">{row.label}</span>
                <span className="text-sm font-medium text-slate-800 text-right max-w-[60%]">{row.value}</span>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-2">OCR Raw Text</p>
              <pre className="text-xs text-slate-600 bg-slate-50 rounded p-3 overflow-auto max-h-40 whitespace-pre-wrap border border-slate-200">{claim.raw_text || "No text extracted"}</pre>
            </div>
          </div>
        </div>

        {/* Column 3: Policy & AI Decision */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">Policy Reference & AI Decision</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-2">AI Decision</p>
              <div className={`rounded-md p-3 ${cfg.bg}`}>
                <p className={`text-sm font-semibold ${cfg.text} mb-1`}>{claim.decision}</p>
                <p className="text-xs text-slate-700">{claim.reason}</p>
              </div>
            </div>

            {claim.override_reason && (
              <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                <p className="text-xs text-purple-600 font-medium mb-1">Finance Override Note</p>
                <p className="text-xs text-purple-800">{claim.override_reason}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-500 mb-2">Policy Snippet Used</p>
              <div className="bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md p-3">
                <pre className="text-xs text-indigo-900 whitespace-pre-wrap leading-relaxed">{claim.policy_snippet || "No specific policy section retrieved."}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
