import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "./firebase";
import RoleSelect from "./components/RoleSelect";
import Login from "./components/Login";
import Upload from "./components/Upload";
import Dashboard from "./components/Dashboard";
import ClaimDetail from "./components/ClaimDetail";
import Notifications from "./components/Notifications";
import SpendAnalytics from "./components/SpendAnalytics";
import MyExpenses from "./components/MyExpenses";
import PolicyManager from "./components/PolicyManager";

type Role = "employee" | "auditor";
type Tab = "upload" | "my-expenses" | "notifications" | "dashboard" | "analytics" | "policy";

const employeeTabs: { key: Tab; label: string }[] = [
  { key: "upload",        label: "Submit Expense" },
  { key: "my-expenses",   label: "My Expenses"    },
  { key: "notifications", label: "Notifications"  },
];

const auditorTabs: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Claims Dashboard" },
  { key: "analytics", label: "Analytics"        },
  { key: "policy",    label: "Policy"            },
];

const pageTitles: Record<Tab, { title: string; sub: string }> = {
  "upload":        { title: "Submit Expense Claim",  sub: "Upload your receipt and provide a business justification for review." },
  "my-expenses":   { title: "My Expense History",    sub: "View all your submitted claims and their current audit status." },
  "notifications": { title: "Notifications",         sub: "Track the status of your submitted expense claims." },
  "dashboard":     { title: "Claims Overview",       sub: "Review, audit, and manage all submitted expense claims — sorted by risk level." },
  "analytics":     { title: "Spend Analytics",       sub: "Visualise claim trends, category breakdown, and compliance scores across all submissions." },
  "policy":        { title: "Policy Manager",        sub: "Upload or replace the company Travel & Expense Policy document used for AI auditing." },
};

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState<Tab>("upload");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [logoExpanded, setLogoExpanded] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  function handleRoleSelect(r: Role) {
    setRole(r);
    setTab(r === "employee" ? "upload" : "dashboard");
    setDetailId(null);
  }

  function handleSignOut() {
    signOut(auth);
    setRole(null);
    setDetailId(null);
  }

  if (!authReady) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!role) return <RoleSelect onSelect={handleRoleSelect} />;
  if (!user) return <Login role={role} onBack={() => setRole(null)} />;

  const navItems = role === "employee" ? employeeTabs : auditorTabs;
  const activeTab = role === "employee" ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white";
  const roleBadge = role === "employee" ? "bg-indigo-900 text-indigo-300" : "bg-emerald-900 text-emerald-300";
  const roleLabel = role === "employee" ? "Employee" : "Finance Auditor";

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ExpenseAudit"
              onClick={() => setLogoExpanded(v => !v)}
              className={`cursor-pointer transition-all duration-500 ease-in-out ${logoExpanded ? "h-14 drop-shadow-lg" : "h-9"}`} />
            <div>
              <span className="font-semibold tracking-tight">ExpenseAudit</span>
              <span className="text-slate-400 text-xs ml-2">Policy-First Compliance</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1">
              {navItems.map(item => (
                <button key={item.key}
                  onClick={() => { setTab(item.key); setDetailId(null); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === item.key ? activeTab : "text-slate-300 hover:text-white hover:bg-slate-800"}`}>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-slate-700">
              {/* User info */}
              <div className="text-right hidden sm:block">
                <p className="text-xs text-white font-medium leading-tight">{user.displayName || "User"}</p>
                <p className="text-xs text-slate-500 leading-tight">{user.email}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleBadge}`}>{roleLabel}</span>
              <button onClick={handleSignOut}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors ml-1" title="Sign out">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {detailId ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setDetailId(null)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">← Back</button>
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
          <Upload user={user} />
        ) : tab === "my-expenses" ? (
          <MyExpenses userId={user.uid} onViewDetail={(id) => setDetailId(id)} />
        ) : tab === "notifications" ? (
          <Notifications userId={user.uid} />
        ) : tab === "dashboard" ? (
          <Dashboard onViewDetail={(id) => setDetailId(id)} />
        ) : tab === "analytics" ? (
          <SpendAnalytics />
        ) : tab === "policy" ? (
          <PolicyManager />
        ) : (
          <SpendAnalytics />
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
