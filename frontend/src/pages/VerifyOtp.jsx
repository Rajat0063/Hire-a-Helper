import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "./Login";
import api from "../services/api";

export default function VerifyOtp() {
  const { state } = useLocation();
  const email = state?.email || "";
  const { verifyOtp } = useAuth();
  const nav = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return;
    try {
      setLoading(true);
      await verifyOtp(email, otp);
      toast.success("Email verified!");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) return toast.error("No email to resend to");
    try {
      setResendBusy(true);
      await api.post("/auth/resend-otp", { email });
      toast.success("Verification code sent to your email");
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <AuthShell title="Verify your email" subtitle={`We sent a 6-digit code to ${email || "your inbox"}`}>
      <form onSubmit={submit} className="space-y-4">
        <input className="input text-center tracking-[0.5em] text-2xl font-bold" maxLength={6} required
          placeholder="000000" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))}/>
        <button className="btn-primary w-full" disabled={loading || otp.length<6}>{loading?"Verifying…":"Verify"}</button>
      </form>
      <button onClick={resend} disabled={resendBusy || !email}
        className="mt-4 text-xs text-brand-600 dark:text-brand-400 hover:underline w-full text-center block">
        {resendBusy?"Sending…":"Resend code"}
      </button>
    </AuthShell>
  );
}