import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "./Login";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ firstName:"", lastName:"", email:"", phone:"", password:"" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await signup(f);
      toast.success("OTP sent to your email");
      nav("/verify-otp", { state: { email: f.email } });
    } catch (err) { toast.error(err.response?.data?.message || "Signup failed"); }
    finally { setLoading(false); }
  };

  return <AuthShell title="Create your account" subtitle="Start posting tasks in minutes">
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
    <p className="text-sm text-slate-600 text-center mt-6">
      Already have an account? <Link to="/login" className="text-brand-700 font-semibold">Sign in</Link>
    </p>
  </AuthShell>;
}
