import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  // ! When the api interceptor force-logged-out a blocked user it set this
  //   flag — we display a banner explaining what happened.
  const [blockedBanner, setBlockedBanner] = useState(
    params.get("blocked") === "1" || sessionStorage.getItem("hh_blocked") === "1"
  );
  const [maintenanceMsg, setMaintenanceMsg] = useState(
    params.get("maintenance") === "1" ? (sessionStorage.getItem("hh_maintenance_msg") || "The platform is currently under maintenance.") : ""
  );

  useEffect(() => {
    sessionStorage.removeItem("hh_blocked");
    sessionStorage.removeItem("hh_maintenance_msg");
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBlockedBanner(false);
    try {
      const r = await login(form.email, form.password);
      if (r.requireOtp) { toast("Verify your email"); nav("/verify-otp", { state: { email: r.email } }); }
      else { toast.success("Welcome back!"); nav("/dashboard"); }
    } catch (e2) {
      const msg = e2.response?.data?.message || "Login failed";
      setErr(msg);
      if (e2.response?.data?.code === "USER_BLOCKED") setBlockedBanner(true);
      else toast.error(msg);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to HireHelper">
      {blockedBanner && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/30 dark:border-rose-800 p-3 text-sm text-rose-700 dark:text-rose-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Account blocked</div>
            <div>Your account has been blocked by an administrator. Please contact support if you believe this is a mistake.</div>
          </div>
        </div>
      )}
      {maintenanceMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Maintenance in progress</div>
            <div>{maintenanceMsg}</div>
          </div>
        </div>
      )}
      {err && !blockedBanner && !maintenanceMsg && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
          {err}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input mt-1" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label">Password</label>
            <Link to="/forgot-password" className="text-xs font-semibold text-brand-700 dark:text-brand-300">
              Forgot password?
            </Link>
          </div>
          <input className="input mt-1" type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center mt-6">
        No account? <Link to="/signup" className="text-brand-700 dark:text-brand-300 font-semibold">Create one</Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 dark:bg-slate-950">
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-brand-700 to-brand-500 text-white p-12 flex-col justify-between">
        <Link to="/" className="font-extrabold text-2xl inline-flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-100 to-brand-100 grid place-items-center text-blue-700">
            <ShieldCheck size={20} />
          </div>
          HireHelper <Zap className="text-blue-200 fill-blue-200" size={20} />
        </Link>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">Help is closer than you think.</h2>
          <p className="mt-4 text-white/80 max-w-md">
            Post a task, get matched with trusted helpers nearby, and get it done — fast.
          </p>
        </div>
        <div className="text-sm text-white/60">© {new Date().getFullYear()} HireHelper</div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden block font-extrabold text-brand-700 dark:text-brand-300 text-2xl mb-6">
            HireHelper.
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
