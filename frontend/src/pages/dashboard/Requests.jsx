import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Eye, Inbox, Check, X, MapPin, Clock, MessageSquare, CreditCard, XCircle } from "lucide-react";
import api from "../../services/api";
import { getSocket } from "../../services/socket";
import { Avatar } from "../../components/DashboardLayout";
import { payWithRazorpay } from "../../services/razorpay";
import { useAuth } from "../../context/AuthContext";

// === Requests (received) ===
// Redesigned to match the visual weight of My Tasks — image + owner card +
// contextual actions. Contact details only appear once the request is
// accepted.
export default function Requests() {
  const [list, setList] = useState([]);
  const [tab, setTab] = useState("all");
  const nav = useNavigate();
  const { user } = useAuth();
  const load = () => api.get("/requests/received").then(({ data }) => setList(data.requests || []));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const s = getSocket(); if (!s) return;
    const r = () => load();
    s.on("request:new", r); s.on("request:status", r);
    return () => { s.off("request:new", r); s.off("request:status", r); };
  }, []);

  const decide = async (id, status) => {
    try { await api.patch(`/requests/${id}`, { status }); toast.success(status); load(); }
    catch { toast.error("Failed"); }
  };
  const cancel = async (r) => {
    if (!window.confirm("Cancel this request?")) return;
    try { await api.post(`/requests/${r._id}/cancel`); toast.success("Cancelled"); load(); }
    catch (e) { toast.error(e.response?.data?.message || "Failed"); }
  };
  const pay = (r) => payWithRazorpay({ request: r, user, onSuccess: load });

  const tabs = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "in_progress", label: "In progress" },
    { key: "completed", label: "Completed" },
    { key: "rejected", label: "Rejected" },
  ];
  const filtered = tab === "all" ? list : list.filter((r) => r.status === tab);
  const counts = tabs.reduce((a, t) => {
    a[t.key] = t.key === "all" ? list.length : list.filter((r) => r.status === t.key).length;
    return a;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Requests</h1>
          <p className="text-slate-500 dark:text-slate-400">People who want to help with your tasks.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            <Inbox size={12} /> {list.length} total
          </span>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`chip border transition ${
              tab === t.key
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-400"
            }`}>
            {t.label} <span className="ml-1 opacity-70">({counts[t.key] || 0})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto h-14 w-14 grid place-items-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 mb-3">
            <Inbox size={22} />
          </div>
          <div className="font-semibold text-slate-700 dark:text-slate-200">No requests here</div>
          <div className="text-sm text-slate-500">When helpers request your tasks, they'll show up here.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((r) => {
            const accepted = r.status === "accepted" || r.status === "completed";
            const img = r.task?.image || r.task?.picture;
            const initials = `${r.requester?.firstName?.[0] || ""}${r.requester?.lastName?.[0] || ""}`.toUpperCase();
            return (
              <article key={r._id} className="card overflow-hidden flex flex-col">
                {img && (
                  <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img src={img} alt={r.task?.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className="chip bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-[11px]">
                      {r.task?.category || "Task"}
                    </span>
                    <span className={`chip text-[11px] ${
                      r.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : r.status === "accepted" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : r.status === "in_progress" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : r.status === "completed" ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                      : r.status === "cancelled" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    }`}>{r.status.replace("_"," ")}</span>
                  </div>

                  <h3 className="mt-3 font-bold text-slate-900 dark:text-white line-clamp-1">
                    {r.task?.title}
                  </h3>
                  {r.task?.location && (
                    <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={12} /> {r.task.location}
                    </div>
                  )}

                  {/* Requester card */}
                  <button
                    onClick={() => nav(`/dashboard/profile/${r.requester?._id}`)}
                    className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition text-left"
                    title="View public profile">
                    <Avatar src={r.requester?.profilePicture} initials={initials} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1">
                        {r.requester?.firstName} {r.requester?.lastName}
                        <Eye size={12} className="opacity-60" />
                      </div>
                      {accepted && r.requester?.email ? (
                        <div className="text-xs text-slate-500 truncate">{r.requester.email}</div>
                      ) : (
                        <div className="text-xs text-slate-500">Contact revealed after accepting</div>
                      )}
                    </div>
                  </button>

                  {r.message && (
                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 italic border-l-2 border-brand-300 pl-3">
                      "{r.message}"
                    </div>
                  )}

                  <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock size={11} /> {new Date(r.createdAt).toLocaleString([], {
                      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                  </div>

                  {r.status === "in_progress" && r.distanceKm != null && (
                    <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${r.offSite ? "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"}`}>
                      {r.offSite ? "⚠️ Helper is off-site" : "✅ Helper on-site"} · ~{r.distanceKm} km · checked in {new Date(r.checkinAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                  )}
                  {r.paymentStatus === "paid" && (
                    <div className="mt-3 text-xs px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 font-semibold">
                      💰 Paid · {r.task?.currency || "INR"} {r.task?.paymentAmount}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                    {r.status === "pending" ? (
                      <>
                        <button onClick={() => decide(r._id, "accepted")}
                          className="btn-primary text-sm py-2 flex-1"><Check size={14} /> Accept</button>
                        <button onClick={() => decide(r._id, "rejected")}
                          className="btn-ghost text-sm py-2 flex-1"><X size={14} /> Reject</button>
                      </>
                    ) : r.status === "completed" && r.paymentStatus !== "paid" ? (
                      <>
                        <button onClick={() => pay(r)} className="btn-primary text-sm py-2 flex-1">
                          <CreditCard size={14} /> Pay {r.task?.currency || "INR"} {r.task?.paymentAmount || 0}
                        </button>
                        <button onClick={() => nav("/dashboard/messages")} className="btn-ghost text-sm py-2">
                          <MessageSquare size={14} />
                        </button>
                      </>
                    ) : ["accepted", "in_progress"].includes(r.status) ? (
                      <>
                        <button onClick={() => nav("/dashboard/messages")}
                          className="btn-primary text-sm py-2 flex-1"><MessageSquare size={14} /> Open chat</button>
                        <button onClick={() => cancel(r)}
                          className="btn-ghost text-sm py-2 text-rose-600"><XCircle size={14} /> Cancel</button>
                      </>
                    ) : (
                      <div className="text-xs text-slate-500 py-2">This request was {r.status.replace("_"," ")}.</div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
