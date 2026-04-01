import { useState } from "react";

const API = "http://localhost:8000";

interface Notification {
  type: string;
  message: string;
  timestamp: string;
  claim_id: string;
  merchant: string;
  amount: string;
  currency: string;
}

const typeConfig: Record<string, { bg: string; text: string; icon: string }> = {
  approved: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: "✓" },
  rejected: { bg: "bg-rose-50 border-rose-200",       text: "text-rose-700",    icon: "✗" },
  flagged:  { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   icon: "⚠" },
  submitted:{ bg: "bg-blue-50 border-blue-200",       text: "text-blue-700",    icon: "↑" },
  override: { bg: "bg-purple-50 border-purple-200",   text: "text-purple-700",  icon: "✎" },
};

export default function Notifications() {
  const [employee, setEmployee] = useState("");
  const [searched, setSearched] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchNotifications() {
    if (!employee.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/notifications/${encodeURIComponent(employee.trim())}`);
      const data = await res.json();
      setNotifications(data);
      setSearched(employee.trim());
    } catch {
      setError("Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Check Claim Status</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchNotifications()}
            placeholder="Enter your name to see notifications..."
            className="flex-1 border border-slate-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={fetchNotifications} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors disabled:bg-slate-300">
            {loading ? "..." : "Search"}
          </button>
        </div>
        {error && <p className="text-rose-600 text-sm mt-2">{error}</p>}
      </div>

      {searched && (
        <div>
          <p className="text-sm text-slate-500 mb-3">
            {notifications.length === 0
              ? `No notifications found for "${searched}".`
              : `${notifications.length} notification${notifications.length !== 1 ? "s" : ""} for "${searched}"`}
          </p>
          <div className="space-y-3">
            {notifications.map((n, i) => {
              const cfg = typeConfig[n.type] || typeConfig.submitted;
              return (
                <div key={i} className={`rounded-lg border p-4 ${cfg.bg}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`text-lg font-bold ${cfg.text} mt-0.5`}>{cfg.icon}</span>
                      <div>
                        <p className={`text-sm font-medium ${cfg.text} capitalize`}>{n.type}</p>
                        <p className="text-sm text-slate-700 mt-0.5">{n.message}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {n.merchant} · {n.currency} {n.amount}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(n.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
