import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "./Login";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const nav = useNavigate();
  const { state } = useLocation();
  const [f, setF] = useState({
    email: state?.email || "", otp: "", newPassword: "", confirm: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (f.newPassword !== f.confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await resetPassword(f.email, f.otp, f.newPassword);
      toast.success("Password reset! Please log in.");
      nav("/login");
    } catch (e2) {
      toast.error(e2.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="Enter the 6-digit code we emailed you">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input mt-1" type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="label">Verification code</label>
          <input className="input mt-1 text-center tracking-[0.5em] text-xl font-bold" maxLength={6}
            placeholder="000000" required value={f.otp} onChange={(e) => set("otp", e.target.value.replace(/\D/g, ""))} />
        </div>
        <div>
          <label className="label">New password</label>
          <input className="input mt-1" type="password" required value={f.newPassword} onChange={(e) => set("newPassword", e.target.value)} />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input className="input mt-1" type="password" required value={f.confirm} onChange={(e) => set("confirm", e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Resetting…" : "Set new password"}</button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-500">
        Remembered password? <Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}