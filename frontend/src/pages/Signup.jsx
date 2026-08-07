import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "./Login";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", role: "user",
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await signup(f);
      if (data.token) { toast.success("Account created"); nav("/dashboard"); return; }
      toast.success("Verification code sent to your email");
      nav("/verify-otp", { state: { email: f.email } });
    } catch (e2) {
      const code = e2.response?.data?.code;
      const message = e2.response?.data?.message || "Signup failed";
      if (code === "EMAIL_TAKEN") {
        toast.error("Email is already registered. Please log in.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start posting tasks in minutes">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <input className="input mt-1" required value={f.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input mt-1" required value={f.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <input className="input mt-1" type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} />
        </div>

        <div>
          <label className="label">Phone</label>
          <input className="input mt-1" type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>

        <div>
          <label className="label">Password</label>
          <input className="input mt-1" type="password" required value={f.password} onChange={(e) => set("password", e.target.value)} />
        </div>

        <button className="btn-primary w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-500">
        Already have an account? <Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}