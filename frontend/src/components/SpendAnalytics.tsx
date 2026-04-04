import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

import API from "../lib/api";

interface Analytics {
  total: number;
  by_decision: Record<string, number>;
  by_category: Record<string, number>;
  by_risk: Record<string, number>;
  avg_score: number;
  duplicate_count: number;
}

const DECISION_COLORS: Record<string, string> = {
  Approved: "#10b981",
  Flagged:  "#f59e0b",
  Rejected: "#f43f5e",
};

const CATEGORY_PALETTE = [
  "#6366f1","#3b82f6","#8b5cf6","#06b6d4",
  "#14b8a6","#f97316","#ec4899","#64748b",
];

const RISK_COLORS: Record<string, string> = {
  Low:    "#10b981",
  Medium: "#f59e0b",
  High:   "#f43f5e",
};

function toChartData(obj: Record<string, number>) {
  return Object.entries(obj).map(([name, value]) => ({ name, value }));
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number;
}) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function SpendAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch(`${API}/analytics`).then(r => r.json()).then(setData);
  }, []);

  if (!data || data.total === 0) return (
    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
      <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-slate-400 text-sm">No data yet. Submit some claims to see analytics.</p>
    </div>
  );

  const scoreColor = data.avg_score >= 80 ? "text-emerald-600" : data.avg_score >= 50 ? "text-amber-600" : "text-rose-600";
  const decisionData  = toChartData(data.by_decision);
  const categoryData  = toChartData(data.by_category);
  const riskData      = toChartData(data.by_risk);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Claims",          value: data.total,          color: "text-slate-800",   bg: "bg-white"       },
          { label: "Avg Compliance Score",  value: `${data.avg_score}/100`, color: scoreColor,     bg: "bg-white"       },
          { label: "High Risk Claims",      value: data.by_risk["High"] || 0, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Duplicates Detected",   value: data.duplicate_count, color: "text-amber-600",  bg: "bg-amber-50"    },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-lg border border-slate-200 shadow-sm p-4`}>
            <p className="text-xs text-slate-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Pie charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        {/* By Decision */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Claims by Decision</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={decisionData} cx="50%" cy="50%" outerRadius={80}
                dataKey="value" labelLine={false} label={renderCustomLabel}>
                {decisionData.map((entry) => (
                  <Cell key={entry.name} fill={DECISION_COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} claims`, ""]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By Category */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Claims by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80}
                dataKey="value" labelLine={false} label={renderCustomLabel}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} claims`, ""]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By Risk */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Claims by Risk Level</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%" outerRadius={80}
                dataKey="value" labelLine={false} label={renderCustomLabel}>
                {riskData.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} claims`, ""]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
