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

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await verifyOtp(email, otp); toast.success("Verified!"); nav("/dashboard"); }
    catch (err) { toast.error(err.response?.data?.message || "Invalid OTP"); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    try { await api.post("/auth/resend-otp", { email }); toast.success("OTP resent"); }
    catch { toast.error("Failed to resend"); }
  };

  return <AuthShell title="Verify your email" subtitle={`We sent a 6-digit code to ${email || "your inbox"}`}>
    <form onSubmit={submit} className="space-y-4">
      <input className="input text-center tracking-[0.5em] text-2xl font-bold" maxLength={6} required
        value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))}/>
      <button className="btn-primary w-full" disabled={loading || otp.length<6}>{loading?"Verifying…":"Verify"}</button>
    </form>
    <button onClick={resend} className="block mx-auto mt-4 text-sm text-brand-700 font-semibold">Resend code</button>
  </AuthShell>;
}
