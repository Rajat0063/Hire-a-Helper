import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await adminLogin(f.email, f.password); toast.success("Admin signed in"); nav("/admin"); }
    catch (err) { toast.error(err.response?.data?.message || "Invalid credentials"); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen grid place-items-center overflow-hidden bg-slate-950 text-white p-4">
      {/* Decorative red glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-red-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-rose-700/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.18),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
           style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative w-full max-w-md rounded-3xl border border-red-500/30 bg-slate-950/80 backdrop-blur-xl p-8 text-white shadow-[0_0_60px_-10px_rgba(239,68,68,0.55)]">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white grid place-items-center shadow-lg shadow-red-900/40"><ShieldCheck/></div>
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-1">Admin sign in <Zap className="text-red-400 fill-red-400" size={18}/></h1>
            <p className="text-sm text-red-200/70">HireHelper restricted area</p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label className="text-sm font-medium text-slate-300">Email</label>
            <input type="email" required className="input mt-1 !bg-slate-900/80 !border-red-900/50 !text-white focus:!border-red-500"
              value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div>
          <div><label className="text-sm font-medium text-slate-300">Password</label>
            <input type="password" required className="input mt-1 !bg-slate-900/80 !border-red-900/50 !text-white focus:!border-red-500"
              value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></div>
          <button className="btn w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-900/40" disabled={loading}>{loading?"Signing in…":"Sign in as admin"}</button>
        </form>
        <Link to="/" className="block text-center mt-6 text-sm text-slate-400 hover:text-white">← Back to site</Link>
      </div>
    </div>
  );
}
