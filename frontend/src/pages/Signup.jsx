import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "./Login";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ firstName:"", lastName:"", email:"", phone:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null); // { code, message }

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setErr(null);
    try {
      const data = await signup(f);
      if (data.token) { toast.success("Account created"); nav("/dashboard"); return; }
      toast.success("OTP sent to your email");
      nav("/verify-otp", { state: { email: f.email } });
    } catch (e2) {
      const code = e2.response?.data?.code;
      const message = e2.response?.data?.message || "Signup failed";
      setErr({ code, message });
      if (!["EMAIL_EXISTS", "USER_BLOCKED", "REGISTRATION_DISABLED"].includes(code)) toast.error(message);
    } finally { setLoading(false); }
  };

  return <AuthShell title="Create your account" subtitle="Start posting tasks in minutes">
    {err && (
      <div className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
        err.code === "USER_BLOCKED"
          ? "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200"
          : "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200"
      }`}>
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-semibold">
            {err.code === "EMAIL_EXISTS" ? "Email already registered" :
             err.code === "USER_BLOCKED" ? "Email blocked" : "Signup failed"}
          </div>
          <div>{err.message}</div>
          {err.code === "EMAIL_EXISTS" && (
            <Link to="/login" className="inline-block mt-1 font-semibold underline">Go to sign in →</Link>
          )}
        </div>
      </div>
    )}

    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">First name</label>
          <input className="input mt-1" required value={f.firstName} onChange={e=>setF({...f,firstName:e.target.value})}/></div>
        <div><label className="label">Last name</label>
          <input className="input mt-1" required value={f.lastName} onChange={e=>setF({...f,lastName:e.target.value})}/></div>
      </div>
      <div><label className="label">Email</label>
        <input type="email" className="input mt-1" required value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div>
      <div><label className="label">Phone</label>
        <input className="input mt-1" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></div>
      <div><label className="label">Password</label>
        <input type="password" className="input mt-1" required minLength={6} value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></div>
      <button className="btn-primary w-full" disabled={loading}>{loading?"Creating…":"Create account"}</button>
    </form>
    <p className="text-sm text-slate-600 dark:text-slate-400 text-center mt-6">
      Already have an account? <Link to="/login" className="text-brand-700 dark:text-brand-300 font-semibold">Sign in</Link>
    </p>
  </AuthShell>;
}
