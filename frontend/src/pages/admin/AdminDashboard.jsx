import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Users, ClipboardList, Activity, TrendingUp, Trash2, LogOut, Sun, Moon,
  ShieldCheck, Ban, CheckCircle2, Menu, X, Plus, Check, AlertCircle, ArrowLeft,
  MessageSquare, Star, Search, Filter, Bug, Lightbulb, ThumbsUp, HelpCircle,
  Clock, CheckCircle
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const TABS = [
  { k: "users", label: "Users", icon: Users },
  { k: "tasks", label: "Tasks", icon: ClipboardList },
  { k: "feedback", label: "Feedback", icon: MessageSquare },
  { k: "analytics", label: "Analytics", icon: TrendingUp },
  { k: "settings", label: "Settings", icon: ShieldCheck },
];

function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 animate-pulse">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 h-16 sm:h-20 flex items-center px-4 lg:px-8">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-1.5">
              <div className="h-5 w-36 sm:w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
          <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={`stat-skel-${i}`} className="card p-4 sm:p-5 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-6 sm:h-8 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>

        <div className="card p-5 space-y-4">
          <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={`row-skel-${i}`} className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { resolved, toggle } = useTheme();
  const nav = useNavigate();
  const [tab, setTab] = useState("users");
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ users: 0, tasks: 0, requests: 0, completionPct: 0 });
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [recent, setRecent] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [settings, setSettings] = useState(null);
  const [newCat, setNewCat] = useState("");

  // Feedback filters
  const [fbStatusFilter, setFbStatusFilter] = useState("all");
  const [fbTypeFilter, setFbTypeFilter] = useState("all");
  const [fbSearch, setFbSearch] = useState("");

  const handleBackToApp = () => {
    if (window.history.length > 1) {
      nav(-1);
    } else {
      nav("/dashboard");
    }
  };

  const load = async () => {
    try {
      const [s, u, t, r, st, fb] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/tasks"),
        api.get("/admin/requests/recent"),
        api.get("/admin/settings"),
        api.get("/feedback").catch(() => ({ data: { feedback: [] } })),
      ]);
      setStats(s.data);
      setUsers(u.data.users);
      setTasks(t.data.tasks);
      setRecent(r.data.requests);
      setSettings(st.data.settings);
      setFeedbacks(fb.data.feedback || []);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

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

  const updateFeedbackStatus = async (id, status, adminNotes) => {
    try {
      await api.patch(`/feedback/${id}`, { status, adminNotes });
      toast.success(`Feedback status updated to ${status}`);
      setFeedbacks((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status, adminNotes: adminNotes ?? item.adminNotes } : item))
      );
    } catch {
      toast.error("Failed to update feedback status");
    }
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

  // Filtered feedbacks calculation
  const filteredFeedbacks = feedbacks.filter((f) => {
    if (fbStatusFilter !== "all" && (f.status || "new") !== fbStatusFilter) return false;
    if (fbTypeFilter !== "all" && f.type !== fbTypeFilter) return false;
    if (fbSearch.trim()) {
      const q = fbSearch.toLowerCase();
      const name = `${f.user?.firstName || ""} ${f.user?.lastName || ""}`.toLowerCase();
      const email = (f.user?.email || "").toLowerCase();
      const subject = (f.subject || "").toLowerCase();
      const message = (f.message || "").toLowerCase();
      return name.includes(q) || email.includes(q) || subject.includes(q) || message.includes(q);
    }
    return true;
  });

  const fbTotal = feedbacks.length;
  const fbNew = feedbacks.filter((f) => !f.status || f.status === "new").length;
  const fbResolved = feedbacks.filter((f) => f.status === "resolved").length;
  const ratings = feedbacks.map((f) => f.rating).filter(Boolean);
  const fbAvgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "N/A";

  if (loading) return <AdminDashboardSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* ===== top bar ===== */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMobileNav((v) => !v)} aria-label="Toggle menu">
              {mobileNav ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 grid place-items-center text-white shadow-soft">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-base sm:text-xl text-slate-900 dark:text-white truncate">Admin Dashboard</div>
              <div className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">Hire-a-Helper Platform Management</div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleBackToApp}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition shadow-2xs"
              title="Return to User Dashboard"
            >
              <ArrowLeft size={15} />
              <span>Back to App</span>
            </button>

            <button onClick={toggle} className="h-9 w-9 sm:h-10 sm:w-10 grid place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Toggle theme">
              {resolved === "dark" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button onClick={() => { logout(); nav("/admin/login"); }}
              className="btn-ghost text-xs sm:text-sm py-1.5 sm:py-2 px-2.5 sm:px-3.5"><LogOut size={14} /> <span className="hidden sm:inline">Logout</span></button>
          </div>
        </div>

        {/* mobile tab strip */}
        {mobileNav && (
          <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 px-3 py-2 grid grid-cols-2 gap-1.5 bg-white dark:bg-slate-900 shadow-md">
            <button
              onClick={handleBackToApp}
              className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-200 mb-1"
            >
              <ArrowLeft size={14} /> Back to User Dashboard
            </button>
            {TABS.map(({ k, label, icon: Icon }) => (
              <button key={k} onClick={() => { setTab(k); setMobileNav(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                  tab === k ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}><Icon size={14} /> {label} {k === "feedback" && fbNew > 0 && <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full">{fbNew}</span>}</button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ===== stat cards ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Users"      value={stats.users}            Icon={Users}          tone="text-brand-500" />
          <StatCard label="Active Tasks"     value={stats.tasks}            Icon={ClipboardList}  tone="text-amber-500" />
          <StatCard label="Pending Requests" value={stats.requests}         Icon={Activity}       tone="text-rose-500" />
          <StatCard label="User Feedback"    value={`${fbTotal} (${fbNew} New)`} Icon={MessageSquare} tone="text-indigo-500" />
        </div>

        {/* desktop tabs */}
        <div className="card p-1.5 hidden lg:inline-flex border border-slate-200/80 dark:border-slate-800 shadow-xs">
          {TABS.map(({ k, label, icon: Icon }) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
                tab === k ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-soft"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              }`}>
              <Icon size={14} /> {label}
              {k === "feedback" && fbNew > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">{fbNew}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <div className="card p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft">
            <h3 className="font-bold text-base sm:text-lg mb-4 text-slate-900 dark:text-white">Manage Users</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => {
                const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase();
                return (
                  <div key={u._id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 grid place-items-center font-bold text-xs sm:text-sm shrink-0">{initials}</div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{u.firstName} {u.lastName}</div>
                        <div className="text-[11px] sm:text-xs text-slate-500 truncate">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.isBlocked ? (
                        <span className="chip bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 text-[11px] py-1 px-2"><Ban size={11} /> Blocked</span>
                      ) : (
                        <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[11px] py-1 px-2"><CheckCircle2 size={11} /> Active</span>
                      )}
                      <button onClick={() => toggleBlock(u)}
                        title={u.isBlocked ? "Unblock user" : "Block user"}
                        className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1 transition ${
                          u.isBlocked ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"
                        }`}>
                        {u.isBlocked ? <><CheckCircle2 size={13} /> Unblock</> : <><Ban size={13} /> Block</>}
                      </button>
                      <button onClick={() => delUser(u._id)} className="h-8 w-8 sm:h-9 sm:w-9 grid place-items-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition" title="Delete User"><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && <p className="text-center text-xs sm:text-sm text-slate-500 py-8">No users found.</p>}
            </div>
          </div>
        )}

        {tab === "tasks" && (
          <div className="space-y-6">
            <div className="card p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <h3 className="font-bold text-base sm:text-lg mb-4 text-slate-900 dark:text-white">Manage Tasks</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((t) => (
                  <div key={t._id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{t.title}</div>
                      <div className="text-[11px] sm:text-xs text-slate-500">{t.location || "Online"} · <span className="capitalize">{t.status}</span></div>
                    </div>
                    <button onClick={() => delTask(t._id)} className="h-8 w-8 sm:h-9 sm:w-9 grid place-items-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white shrink-0" title="Delete Task"><Trash2 size={13} /></button>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-center text-xs sm:text-sm text-slate-500 py-8">No tasks in database.</p>}
              </div>
            </div>

            <div className="card p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <h3 className="font-bold text-base sm:text-lg mb-4 text-slate-900 dark:text-white">Recent Requests</h3>
              {recent.length === 0
                ? <p className="text-center text-xs sm:text-sm text-slate-500 py-6">No requests recorded yet.</p>
                : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recent.map((r) => (
                      <div key={r._id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <AlertCircle size={15} className="text-amber-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                              <b>{r.requester?.firstName} {r.requester?.lastName}</b> requested help with
                              "{r.task?.title}" {r.task?.location && `in ${r.task.location}`}
                            </div>
                            <div className="text-[10px] sm:text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                        <span className={`chip text-[11px] py-0.5 px-2 capitalize shrink-0 ${
                          r.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                          : r.status === "accepted" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200"}`}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ===== FEEDBACK MONITORING TAB ===== */}
        {tab === "feedback" && (
          <div className="space-y-6">
            {/* Feedback Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Mini label="Total Submissions" value={fbTotal} />
              <Mini label="New / Unreviewed" value={fbNew} />
              <Mini label="Resolved Feedbacks" value={fbResolved} />
              <Mini label="Avg Rating" value={fbAvgRating !== "N/A" ? `${fbAvgRating} ★` : "N/A"} />
            </div>

            {/* Filter & Search Bar */}
            <div className="card p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={fbSearch}
                    onChange={(e) => setFbSearch(e.target.value)}
                    placeholder="Search by user name, email, subject, or keywords…"
                    className="input pl-9 text-xs sm:text-sm h-10 w-full"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
                    {["all", "new", "reviewed", "resolved", "dismissed"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFbStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-lg capitalize transition ${
                          fbStatusFilter === st
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <select
                    value={fbTypeFilter}
                    onChange={(e) => setFbTypeFilter(e.target.value)}
                    className="input h-10 text-xs sm:text-sm py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  >
                    <option value="all">All Types</option>
                    <option value="bug">Bugs</option>
                    <option value="suggestion">Suggestions</option>
                    <option value="praise">Praise</option>
                    <option value="complaint">Complaints</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Feedback List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
                {filteredFeedbacks.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                    <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-sm">No feedback matching your filters</p>
                    <p className="text-xs">User submissions from the floating feedback widget will appear here.</p>
                  </div>
                ) : (
                  filteredFeedbacks.map((item) => (
                    <FeedbackCard
                      key={item._id}
                      item={item}
                      onUpdateStatus={(status, adminNotes) => updateFeedbackStatus(item._id, status, adminNotes)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "analytics" && (
          <div className="space-y-6">
            <div className="card p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Platform Activity</h3>
                <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200 text-[11px]">Live Database</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Realtime metrics synchronized across your helper community.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                <Mini label="Users" value={stats.users} />
                <Mini label="Active Tasks" value={stats.tasks} />
                <Mini label="Pending Requests" value={stats.requests} />
                <Mini label="Completion" value={`${stats.completionPct ?? 0}%`} />
              </div>
            </div>

            {/* Graphical distribution */}
            <div className="card p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Distribution</h3>
              <p className="text-xs text-slate-500 mb-4">Users vs. tasks vs. requests comparative view.</p>
              <BarChart data={[
                { label: "Users",    value: stats.users,    color: "#4f46e5" },
                { label: "Tasks",    value: stats.tasks,    color: "#f59e0b" },
                { label: "Requests", value: stats.requests, color: "#e11d48" },
              ]} />
            </div>

            {/* Completion progress */}
            <div className="card p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-4">Completion Rate</h3>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" className="text-emerald-500"
                      strokeWidth="3" strokeDasharray={`${(stats.completionPct ?? 0) * 1.0053} 100`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 grid place-items-center font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">{stats.completionPct ?? 0}%</div>
                </div>
                <div className="text-xs sm:text-sm text-slate-500 leading-relaxed">Percentage of community task requests successfully accepted and marked completed.</div>
              </div>
            </div>
          </div>
        )}

        {tab === "settings" && settings && (
          <div className="space-y-4">
            <div className="card p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <h3 className="font-bold text-base sm:text-lg mb-4 text-slate-900 dark:text-white">Platform Settings</h3>
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

            <div className="card p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <h3 className="font-bold text-base sm:text-lg mb-1 text-slate-900 dark:text-white">Categories</h3>
              <p className="text-xs text-slate-500 mb-3">These power the chips on the Feed and the dropdown options on Add Task.</p>
              <div className="flex flex-wrap gap-2">
                {settings.categories.map((c) => (
                  <span key={c} className="chip bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs py-1 px-2.5">
                    {c}
                    <button onClick={() => removeCategory(c)} className="ml-1.5 text-slate-400 hover:text-rose-500">×</button>
                  </span>
                ))}
                <form onSubmit={(e) => { e.preventDefault(); addCategory(); }} className="flex items-center gap-1">
                  <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
                    placeholder="+ Add category"
                    className="text-xs px-2.5 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:border-brand-500" />
                  <button type="submit" className="text-brand-700 dark:text-brand-300 p-1"><Plus size={14} /></button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// === Individual Feedback Card Component ===
function FeedbackCard({ item, onUpdateStatus }) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(item.adminNotes || "");

  const user = item.user || {};
  const fullName = `${user.firstName || "Anonymous"} ${user.lastName || ""}`.trim();
  const initials = `${user.firstName?.[0] || "A"}${user.lastName?.[0] || ""}`.toUpperCase();
  const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now";
  const currentStatus = item.status || "new";

  const typeConfig = {
    bug: { bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-900/50", icon: Bug },
    suggestion: { bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/50", icon: Lightbulb },
    praise: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-900/50", icon: ThumbsUp },
    complaint: { bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900/50", icon: AlertCircle },
    other: { bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700", icon: HelpCircle },
  };

  const currentType = typeConfig[item.type] || typeConfig.other;
  const TypeIcon = currentType.icon;

  const handleSaveNotes = () => {
    onUpdateStatus(currentStatus, notesText);
    setEditingNotes(false);
  };

  return (
    <div className="py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* User Info & Type */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 grid place-items-center font-bold text-xs shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{fullName}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border flex items-center gap-1 capitalize shrink-0 ${currentType.bg}`}>
                <TypeIcon size={10} /> {item.type || "feedback"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate">{user.email || "No email provided"} • {dateStr}</div>
          </div>
        </div>

        {/* Rating & Status controls */}
        <div className="flex items-center gap-2 shrink-0">
          {item.rating > 0 && (
            <div className="flex items-center gap-0.5 text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs font-bold">
              <span>{item.rating}</span>
              <Star size={12} fill="currentColor" />
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {currentStatus === "new" && (
              <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                New
              </span>
            )}
            {currentStatus === "reviewed" && (
              <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                Reviewed
              </span>
            )}
            {currentStatus === "resolved" && (
              <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Resolved
              </span>
            )}
            {currentStatus === "dismissed" && (
              <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Dismissed
              </span>
            )}

            <select
              value={currentStatus}
              onChange={(e) => onUpdateStatus(e.target.value)}
              className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
            >
              <option value="new">Mark New</option>
              <option value="reviewed">Mark Reviewed</option>
              <option value="resolved">Mark Resolved</option>
              <option value="dismissed">Dismiss</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subject & Message */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{item.subject}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{item.message}</p>
      </div>

      {/* Admin Notes Section */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        {editingNotes ? (
          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add admin resolution notes…"
              className="input text-xs py-1 px-2.5 h-8 flex-1"
            />
            <button onClick={handleSaveNotes} className="btn-primary py-1 px-3 text-xs">Save</button>
            <button onClick={() => setEditingNotes(false)} className="btn-ghost py-1 px-2.5 text-xs">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-400 italic">
              {item.adminNotes ? `Admin Note: "${item.adminNotes}"` : "No resolution notes added."}
            </span>
            <button
              onClick={() => setEditingNotes(true)}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline text-[11px]"
            >
              {item.adminNotes ? "Edit Note" : "+ Add Admin Note"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, Icon, tone }) {
  return (
    <div className="card p-4 sm:p-5 flex items-center justify-between border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div>
        <div className="text-xs sm:text-sm text-slate-500">{label}</div>
        <div className="text-xl sm:text-3xl font-extrabold mt-1 text-slate-900 dark:text-white">{value}</div>
      </div>
      <Icon className={tone} size={24} />
    </div>
  );
}
function Mini({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-800/40">
      <div className="text-[11px] sm:text-xs text-slate-500">{label}</div>
      <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{value}</div>
    </div>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between py-3 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer group">
      <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition">{label}</span>
      <button type="button" onClick={() => onChange(!value)} aria-pressed={value}
        className={`relative h-6 sm:h-7 w-11 sm:w-12 rounded-full transition-all duration-200 shrink-0
                    ${value
                      ? "bg-gradient-to-r from-brand-500 to-brand-700 shadow-inner shadow-brand-900/30"
                      : "bg-slate-300 dark:bg-slate-700"}`}>
        <span className={`absolute top-0.5 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white shadow-md transition-transform duration-200
                          ${value ? "translate-x-[22px] sm:translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

// === BarChart ===
function BarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 520, H = 200, pad = 30, gap = 24;
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
            <text x={x + bw / 2} y={y - 6} textAnchor="middle" className="fill-slate-700 dark:fill-slate-200 text-xs font-bold">{d.value}</text>
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="fill-slate-500 text-xs">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
