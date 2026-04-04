import { useEffect, useState } from "react";

import API from "../lib/api";

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
  approved:  { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: "✓" },
  rejected:  { bg: "bg-rose-50 border-rose-200",       text: "text-rose-700",    icon: "✗" },
  flagged:   { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   icon: "⚠" },
  submitted: { bg: "bg-blue-50 border-blue-200",       text: "text-blue-700",    icon: "↑" },
  override:  { bg: "bg-purple-50 border-purple-200",   text: "text-purple-700",  icon: "✎" },
  warning:   { bg: "bg-orange-50 border-orange-200",   text: "text-orange-700",  icon: "!" },
};

export default function Notifications({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/notifications/${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(data => { setNotifications(data); setLoading(false); });
  }, [userId]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-slate-400 text-sm">
          No notifications yet. Submit a claim to get started.
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-1">{notifications.length} notification{notifications.length !== 1 ? "s" : ""}</p>
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
                      <p className="text-xs text-slate-500 mt-1">{n.merchant} · {n.currency} {n.amount}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 whitespace-nowrap">{new Date(n.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
