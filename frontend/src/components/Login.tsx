import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";

interface Props {
  role: "employee" | "auditor";
  onBack: () => void;
}

export default function Login({ role, onBack }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEmployee = role === "employee";
  const accent = isEmployee ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700";
  const ring   = isEmployee ? "focus:ring-indigo-500" : "focus:ring-emerald-500";
  const textAccent = isEmployee ? "text-indigo-400" : "text-emerald-400";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your full name."); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || "Authentication failed.";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className={`absolute top-1/3 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none ${isEmployee ? "bg-indigo-600" : "bg-emerald-600"}`} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="ExpenseAudit" className="h-12 w-auto mb-3" />
          <span className="text-xl font-bold text-white tracking-tight">ExpenseAudit</span>
          <span className={`text-xs mt-1.5 px-3 py-0.5 rounded-full font-medium ${isEmployee ? "bg-indigo-900 text-indigo-300" : "bg-emerald-900 text-emerald-300"}`}>
            {isEmployee ? "Employee Portal" : "Finance Auditor"}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7">
          <h2 className="text-white font-semibold text-base mb-5">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Sarah Johnson"
                  className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${ring} focus:border-transparent`} />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${ring} focus:border-transparent`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${ring} focus:border-transparent`} />
            </div>

            {error && (
              <div className="bg-rose-950 border border-rose-800 rounded-lg p-3">
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full ${accent} disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-1`}>
              {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
              {" "}
              <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
                className={`${textAccent} font-medium hover:underline`}>
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

        <button onClick={onBack} className="mt-5 w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors">
          ← Back to role selection
        </button>
      </div>
    </div>
  );
}
