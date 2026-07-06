import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Users, ClipboardList, Activity, TrendingUp, Trash2, LogOut, Sun, Moon,
  ShieldCheck, Ban, CheckCircle2, Menu, X, Plus, Check, AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const TABS = [
  { k: "users", label: "Users", icon: Users },
  { k: "tasks", label: "Tasks", icon: ClipboardList },
  { k: "analytics", label: "Analytics", icon: TrendingUp },
  { k: "settings", label: "Settings", icon: ShieldCheck },
];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { resolved, toggle } = useTheme();
  const nav = useNavigate();
  const [tab, setTab] = useState("users");
  const [mobileNav, setMobileNav] = useState(false);

  const [stats, setStats] = useState({ users: 0, tasks: 0, requests: 0, completionPct: 0 });
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [recent, setRecent] = useState([]);
  const [settings, setSettings] = useState(null);
  const [newCat, setNewCat] = useState("");

  // ! Disable browser back
  useEffect(() => {
    const trap = () => window.history.pushState(null, "", window.location.href);
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", trap);
    return () => window.removeEventListener("popstate", trap);
  }, []);

  const load = async () => {
    const [s, u, t, r, st] = await Promise.all([
      api.get("/admin/stats"), api.get("/admin/users"), api.get("/admin/tasks"),
      api.get("/admin/requests/recent"), api.get("/admin/settings"),
    ]);
    setStats(s.data); setUsers(u.data.users); setTasks(t.data.tasks);
    setRecent(r.data.requests); setSettings(st.data.settings);
  };
  useEffect(() => { load().catch(() => toast.error("Failed to load")); }, []);

  const delUser = async (id) => {
    if (!confirm("Delete this user permanently?")) return;
    await api.delete(`/admin/users/${id}`); toast.success("Deleted"); load();
  };
  const delTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    await api.delete(`/admin/tasks/${id}`); toast.success("Deleted"); load();
  };
  const toggleBlock = async (u) => {
    const action = u.isBlocked ? "Unblock" : "Block";
    if (!confirm(`${action} ${u.firstName} ${u.lastName}? ${u.isBlocked ? "" : "They will be force-logged-out and cannot sign in again."}`)) return;
    try {
      await api.patch(`/admin/users/${u._id}/block`, { blocked: !u.isBlocked });
      toast.success(`User ${action.toLowerCase()}ed`);
      load();
    } catch { toast.error("Failed"); }
  };

  const saveSettings = async (patch) => {
    const optimistic = { ...settings, ...patch };
    setSettings(optimistic);
    try { await api.patch("/admin/settings", patch); }
    catch { toast.error("Failed to save"); load(); }
  };
  const addCategory = () => {
    const v = newCat.trim();
    if (!v || settings.categories.includes(v)) { setNewCat(""); return; }
    saveSettings({ categories: [...settings.categories, v] });
    setNewCat("");
  };
  const removeCategory = (c) =>
    saveSettings({ categories: settings.categories.filter((x) => x !== c) });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* ===== top bar ===== */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden text-slate-500" onClick={() => setMobileNav((v) => !v)}>
              {mobileNav ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 grid place-items-center text-white shadow-soft">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xl text-slate-900 dark:text-white truncate">Admin Dashboard</div>
              <div className="text-xs text-slate-500 hidden sm:block">Hire-a-Helper Management</div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={toggle} className="h-10 w-10 grid place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Toggle theme">
              {resolved === "dark" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button onClick={() => { logout(); nav("/admin/login"); }}
              className="btn-ghost text-sm py-2"><LogOut size={14} /> <span className="hidden sm:inline">Logout</span></button>
          </div>
        </div>

        {/* mobile tab strip */}
        {mobileNav && (
          <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 px-2 py-2 grid grid-cols-2 gap-1 bg-white dark:bg-slate-900">
            {TABS.map(({ k, label, icon: Icon }) => (
              <button key={k} onClick={() => { setTab(k); setMobileNav(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${
                  tab === k ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}><Icon size={14} /> {label}</button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* ===== stat cards ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users"      value={stats.users}            Icon={Users}          tone="text-brand-500" />
          <StatCard label="Active Tasks"     value={stats.tasks}            Icon={ClipboardList}  tone="text-amber-500" />
          <StatCard label="Pending Requests" value={stats.requests}         Icon={Activity}       tone="text-rose-500" />
          <StatCard label="Completion Rate"  value={`${stats.completionPct ?? 0}%`} Icon={TrendingUp} tone="text-emerald-500" />
        </div>

        {/* desktop tabs */}
        <div className="card p-1.5 hidden lg:inline-flex">
          {TABS.map(({ k, label, icon: Icon }) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                tab === k ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-soft"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              }`}><Icon size={14} /> {label}</button>
          ))}
        </div>

        {tab === "users" && (
          <div className="card p-5">
            <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Manage Users</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => {
                const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase();
                return (
                  <div key={u._id} className="py-3 flex flex-wrap items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 grid place-items-center font-bold text-sm">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-slate-500 truncate">{u.email}</div>
                    </div>
                    {u.isBlocked ? (
                      <span className="chip bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"><Ban size={12} /> Blocked</span>
                    ) : (
                      <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><CheckCircle2 size={12} /> Active</span>
                    )}
                    <button onClick={() => toggleBlock(u)}
                      title={u.isBlocked ? "Unblock user" : "Block user"}
                      className={`h-9 px-3 rounded-lg text-white text-sm font-semibold inline-flex items-center gap-1 ${
                        u.isBlocked ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"
                      }`}>
                      {u.isBlocked ? <><CheckCircle2 size={14} /> Unblock</> : <><Ban size={14} /> Block</>}
                    </button>
                    <button onClick={() => delUser(u._id)} className="h-9 w-9 grid place-items-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white"><Trash2 size={14} /></button>
                  </div>
                );
              })}
              {users.length === 0 && <p className="text-center text-slate-500 py-8">No users</p>}
            </div>
          </div>
        )}

        {tab === "tasks" && (
          <>
            <div className="card p-5">
              <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Manage Tasks</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((t) => (
                  <div key={t._id} className="py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">{t.title}</div>
                      <div className="text-xs text-slate-500">{t.location} · {t.status}</div>
                    </div>
                    <button onClick={() => delTask(t._id)} className="h-9 w-9 grid place-items-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white"><Trash2 size={14} /></button>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-center text-slate-500 py-8">No tasks</p>}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Recent Requests</h3>
              {recent.length === 0
                ? <p className="text-center text-slate-500 py-6">No requests yet.</p>
                : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recent.map((r) => (
                      <div key={r._id} className="py-3 flex items-center gap-3 flex-wrap">
                        <AlertCircle size={16} className="text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-800 dark:text-slate-100 truncate">
                            <b>{r.requester?.firstName} {r.requester?.lastName}</b> requested help with
                            "{r.task?.title}" {r.task?.location && `in ${r.task.location}`}
                          </div>
                          <div className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</div>
                        </div>
                        <span className={`chip ${
                          r.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                          : r.status === "accepted" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200"}`}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </>
        )}

        {tab === "analytics" && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-900 dark:text-white">Platform Activity</h3>
                <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">Live</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Snapshot metrics from the database.</p>
              <div className="grid sm:grid-cols-4 gap-4 text-sm">
                <Mini label="Users" value={stats.users} />
                <Mini label="Active Tasks" value={stats.tasks} />
                <Mini label="Pending Requests" value={stats.requests} />
                <Mini label="Completion" value={`${stats.completionPct ?? 0}%`} />
              </div>
            </div>

            {/* Graphical distribution */}
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 dark:text-white">Distribution</h3>
              <p className="text-xs text-slate-500 mb-4">Users vs. tasks vs. requests — comparative view.</p>
              <BarChart data={[
                { label: "Users",    value: stats.users,    color: "#4f46e5" },
                { label: "Tasks",    value: stats.tasks,    color: "#f59e0b" },
                { label: "Requests", value: stats.requests, color: "#e11d48" },
              ]} />
            </div>

            {/* Completion progress */}
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Completion Rate</h3>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" className="text-emerald-500"
                      strokeWidth="3" strokeDasharray={`${(stats.completionPct ?? 0) * 1.0053} 100`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 grid place-items-center font-extrabold text-slate-800 dark:text-white">{stats.completionPct ?? 0}%</div>
                </div>
                <div className="text-sm text-slate-500">Share of tasks marked completed across the platform.</div>
              </div>
            </div>
          </div>
        )}

        {tab === "settings" && settings && (
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Platform Settings</h3>
              <Toggle label="Enable New Registrations" value={settings.enableRegistrations}
                onChange={(v) => saveSettings({ enableRegistrations: v })} />
              <Toggle label="Require Email Verification" value={settings.requireEmailVerification}
                onChange={(v) => saveSettings({ requireEmailVerification: v })} />
              <Toggle label="Allow Task Editing" value={settings.allowTaskEditing}
                onChange={(v) => saveSettings({ allowTaskEditing: v })} />
              <Toggle label="Push Notifications" value={settings.pushNotifications}
                onChange={(v) => saveSettings({ pushNotifications: v })} />
              <Toggle label="Maintenance Mode" value={settings.maintenanceMode}
                onChange={(v) => saveSettings({ maintenanceMode: v })} />
            </div>

            <div className="card p-6">
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Categories</h3>
              <p className="text-xs text-slate-500 mb-3">These power the chips on the Feed and the dropdown on Add Task.</p>
              <div className="flex flex-wrap gap-2">
                {settings.categories.map((c) => (
                  <span key={c} className="chip bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    {c}
                    <button onClick={() => removeCategory(c)} className="ml-1 text-slate-400 hover:text-rose-500">×</button>
                  </span>
                ))}
                <form onSubmit={(e) => { e.preventDefault(); addCategory(); }} className="flex items-center gap-1">
                  <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
                    placeholder="+ Add category"
                    className="text-xs px-2 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:border-brand-500" />
                  <button type="submit" className="text-brand-700 dark:text-brand-300"><Plus size={14} /></button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, Icon, tone }) {
  return (
    <div className="card p-5 flex items-center justify-between">
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-3xl font-extrabold mt-1 text-slate-900 dark:text-white">{value}</div>
      </div>
      <Icon className={tone} size={28} />
    </div>
  );
}
function Mini({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer group">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition">{label}</span>
      <button type="button" onClick={() => onChange(!value)} aria-pressed={value}
        className={`relative h-7 w-12 rounded-full transition-all duration-200
                    ${value
                      ? "bg-gradient-to-r from-brand-500 to-brand-700 shadow-inner shadow-brand-900/30"
                      : "bg-slate-300 dark:bg-slate-700"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200
                          ${value ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

// === BarChart ===
// Minimal, dependency-free SVG bar chart used on the analytics tab.
function BarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 520, H = 220, pad = 30, gap = 24;
  const bw = (W - pad * 2 - gap * (data.length - 1)) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <line key={r} x1={pad} x2={W - pad} y1={H - pad - (H - pad * 2) * r} y2={H - pad - (H - pad * 2) * r}
          stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 4"/>
      ))}
      {data.map((d, i) => {
        const h = ((H - pad * 2) * d.value) / max;
        const x = pad + i * (bw + gap);
        const y = H - pad - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={bw} height={h} rx="8" fill={d.color} opacity="0.9"/>
            <text x={x + bw / 2} y={y - 6} textAnchor="middle" className="fill-slate-700 dark:fill-slate-200" fontSize="13" fontWeight="700">{d.value}</text>
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="fill-slate-500" fontSize="12">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
