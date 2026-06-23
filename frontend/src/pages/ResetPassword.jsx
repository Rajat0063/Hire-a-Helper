import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "./Login";

// === ResetPassword ===
// Step 2 — user pastes the OTP and picks a new password.
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
    if (f.newPassword.length < 6) return toast.error("Use at least 6 characters");
    setLoading(true);
    try {
      await resetPassword({ email: f.email, otp: f.otp, newPassword: f.newPassword });
      toast.success("Password updated — sign in with your new password");
      nav("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Reset password" subtitle="Enter the 6-digit code we emailed you">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input mt-1" type="email" required value={f.email}
            onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="label">Verification code</label>
          <input className="input mt-1 text-center tracking-[0.5em] text-xl font-bold" maxLength={6}
            required value={f.otp} onChange={(e) => set("otp", e.target.value.replace(/\D/g, ""))} />
        </div>
        <div>
          <label className="label">New password</label>
          <input className="input mt-1" type="password" required minLength={6}
            value={f.newPassword} onChange={(e) => set("newPassword", e.target.value)} />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input className="input mt-1" type="password" required minLength={6}
            value={f.confirm} onChange={(e) => set("confirm", e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center mt-6">
        Back to <Link to="/login" className="text-brand-700 dark:text-brand-300 font-semibold">Sign in</Link>
      </p>
    </AuthShell>
  );
}
