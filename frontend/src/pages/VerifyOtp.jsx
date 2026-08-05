import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "./Login";
import api from "../services/api";

export default function VerifyOtp() {
  const { state } = useLocation();
  const email = state?.email || "";
  const devCode = state?.devCode || "";
  const { verifyOtp } = useAuth();
  const nav = useNavigate();
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (import.meta.env.DEV && devCode) setOtp(String(devCode).trim());
  }, [devCode]);
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await verifyOtp(email, otp); toast.success("Verified!"); nav("/dashboard"); }
    catch (err) { toast.error(err.response?.data?.message || "Invalid OTP"); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    if (!email) return toast.error("No email to resend to");
    try {
      setResendBusy(true);
      const { data } = await api.post("/auth/resend-otp", { email });
      if (data.devCode) {
        toast.success(`OTP resent (dev code: ${data.devCode})`);
      } else {
        toast.success("OTP resent");
      }
    } catch {
      toast.error("Failed to resend");
    } finally {
      setResendBusy(false);
    }
  };

  return <AuthShell title="Verify your email" subtitle={devCode ? `We sent a 6-digit code to ${email || "your inbox"} (dev code: ${devCode})` : `We sent a 6-digit code to ${email || "your inbox"}`}>
    <form onSubmit={submit} className="space-y-4">
      <input className="input text-center tracking-[0.5em] text-2xl font-bold" maxLength={6} required
        value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))}/>
      <button className="btn-primary w-full" disabled={loading || otp.length<6}>{loading?"Verifying…":"Verify"}</button>
    </form>
    <button onClick={resend} disabled={resendBusy || !email}
      className="block mx-auto mt-4 text-sm text-brand-700 font-semibold">{resendBusy?"Resending…":"Resend code"}</button>
  </AuthShell>;
}
