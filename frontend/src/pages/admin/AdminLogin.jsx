import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Shield } from "lucide-react";
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
    <div className="min-h-screen grid place-items-center bg-slate-900 text-white p-4">
      <div className="w-full max-w-md card !bg-slate-800 !border-slate-700 p-8 text-white">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-brand-500/20 text-brand-300 grid place-items-center"><Shield/></div>
          <div>
            <h1 className="text-2xl font-extrabold">Admin sign in</h1>
            <p className="text-sm text-slate-400">Restricted area</p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label className="text-sm font-medium text-slate-300">Email</label>
            <input type="email" required className="input mt-1 !bg-slate-900 !border-slate-700 !text-white"
              value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div>
          <div><label className="text-sm font-medium text-slate-300">Password</label>
            <input type="password" required className="input mt-1 !bg-slate-900 !border-slate-700 !text-white"
              value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></div>
          <button className="btn-primary w-full" disabled={loading}>{loading?"Signing in…":"Sign in as admin"}</button>
        </form>
        <Link to="/" className="block text-center mt-6 text-sm text-slate-400 hover:text-white">← Back to site</Link>
      </div>
    </div>
  );
}
