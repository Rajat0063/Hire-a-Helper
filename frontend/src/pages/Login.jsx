import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await login(form.email, form.password);
      if (r.requireOtp) { toast("Verify your email"); nav("/verify-otp", { state: { email: r.email } }); }
      else { toast.success("Welcome back!"); nav("/dashboard"); }
    } catch (err) { toast.error(err.response?.data?.message || "Login failed"); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to HireHelper">
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
        <Link to="/" className="font-extrabold text-2xl">Hire-a-Helper.</Link>
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
