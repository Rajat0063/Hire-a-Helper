import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "./Login";

// === ForgotPassword ===
// Step 1 of password reset. Asks for email, triggers OTP send, then sends
// the user to /reset-password with the email pre-filled.
export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("If that email exists, a reset code has been sent.");
      nav("/reset-password", { state: { email } });
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Forgot password?" subtitle="We'll email you a 6-digit code to reset it">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input mt-1" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset code"}
        </button>
      </form>
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center mt-6">
        Remembered it? <Link to="/login" className="text-brand-700 dark:text-brand-300 font-semibold">Sign in</Link>
      </p>
    </AuthShell>
  );
}
