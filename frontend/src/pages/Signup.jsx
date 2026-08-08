import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Phone, KeyRound, Check, X, Wand2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "./Login";

// Helper for password strength criteria evaluation
function evaluatePassword(pwd) {
  const reqs = [
    { label: "At least 8 characters", met: pwd.length >= 8 },
    { label: "Contains uppercase letter (A-Z)", met: /[A-Z]/.test(pwd) },
    { label: "Contains lowercase letter (a-z)", met: /[a-z]/.test(pwd) },
    { label: "Contains number (0-9)", met: /[0-9]/.test(pwd) },
    { label: "Contains special character (!@#$%^&*)", met: /[^A-Za-z0-9]/.test(pwd) },
  ];
  const score = reqs.filter((r) => r.met).length;
  let label = "Very Weak";
  let color = "bg-rose-500";
  let textColor = "text-rose-500";
  if (score === 2) { label = "Weak"; color = "bg-amber-500"; textColor = "text-amber-500"; }
  else if (score === 3) { label = "Fair"; color = "bg-yellow-500"; textColor = "text-yellow-600 dark:text-yellow-400"; }
  else if (score === 4) { label = "Strong"; color = "bg-emerald-500"; textColor = "text-emerald-600 dark:text-emerald-400"; }
  else if (score === 5) { label = "Very Strong"; color = "bg-green-600"; textColor = "text-green-600 dark:text-green-400"; }

  return { reqs, score, label, color, textColor };
}

// Generate a high-entropy strong password
function generateStrongPassword() {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowers = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%^&*";
  const all = uppers + lowers + numbers + symbols;

  let pwd = "";
  pwd += uppers[Math.floor(Math.random() * uppers.length)];
  pwd += lowers[Math.floor(Math.random() * lowers.length)];
  pwd += numbers[Math.floor(Math.random() * numbers.length)];
  pwd += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 0; i < 10; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", role: "user",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const pwdAnalysis = evaluatePassword(f.password);

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    set("password", generated);
    setShowPassword(true);
    toast.success("Strong password generated!");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (f.password && pwdAnalysis.score < 3) {
      toast.error("Please choose a stronger password before continuing");
      return;
    }
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
    <AuthShell title="Create your account" subtitle="Start posting tasks or offering help in minutes">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name *</label>
            <input className="input mt-1" required placeholder="John" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </div>
          <div>
            <label className="label">Last name *</label>
            <input className="input mt-1" required placeholder="Doe" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Email address *</label>
          <input className="input mt-1" type="email" required placeholder="john.doe@example.com" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label flex items-center gap-1.5">
              <Phone size={13} className="text-slate-400" />
              Phone number
            </label>
            <span className="text-[11px] text-slate-400">(Optional for SMS updates)</span>
          </div>
          <input
            className="input mt-1"
            type="tel"
            placeholder="e.g. +1 234 567 8900 or +91 98765 43210"
            value={f.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label flex items-center gap-1.5">
              <KeyRound size={13} className="text-slate-400" />
              Password *
            </label>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <Wand2 size={12} /> Suggest Strong
            </button>
          </div>

          <div className="relative">
            <input
              className="input pr-10"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Create a strong password"
              value={f.password}
              onChange={(e) => set("password", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition"
              title={showPassword ? "Hide password" : "Show password"}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Password strength visual meter & rules */}
          {f.password && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">Password Strength:</span>
                <span className={`text-xs font-bold ${pwdAnalysis.textColor}`}>{pwdAnalysis.label}</span>
              </div>

              {/* Multi-segment strength bar */}
              <div className="grid grid-cols-5 gap-1.5 h-1.5">
                {[1, 2, 3, 4, 5].map((seg) => (
                  <div
                    key={seg}
                    className={`h-full rounded-full transition-colors duration-200 ${
                      seg <= pwdAnalysis.score ? pwdAnalysis.color : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                ))}
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[11px]">
                {pwdAnalysis.reqs.map((r) => (
                  <div
                    key={r.label}
                    className={`flex items-center gap-1.5 ${
                      r.met ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400"
                    }`}
                  >
                    {r.met ? <Check size={12} className="shrink-0" /> : <X size={12} className="shrink-0 opacity-40" />}
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="btn-primary w-full py-2.5 mt-2 font-bold shadow-soft" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
