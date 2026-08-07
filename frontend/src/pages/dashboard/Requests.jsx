import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Eye, Inbox, Check, X, MapPin, Clock, MessageSquare, CreditCard, XCircle } from "lucide-react";
import api from "../../services/api";
import { getSocket } from "../../services/socket";
import { Avatar } from "../../components/Avatar";
import { payWithRazorpay } from "../../services/razorpay";
import { useAuth } from "../../context/AuthContext";

// === Requests (received) ===
// Redesigned to match the visual weight of My Tasks — image + owner card +
// contextual actions. Contact details only appear once the request is
// accepted.
export default function Requests() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [payingId, setPayingId] = useState(null);
  const nav = useNavigate();
  const { user } = useAuth();

  const load = () => {
    setLoading(true);
    api.get("/requests/received")
      .then(({ data }) => setList(data.requests || []))
      .catch(() => toast.error("Failed to load requests"))
      .finally(() => setLoading(false));
  };
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
  const pay = async (r) => {
    setPayingId(r._id);
    try {
      await payWithRazorpay({ request: r, user, onSuccess: load });
    } finally {
      setPayingId(null);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Requests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">People who want to help with your posted tasks.</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 text-sm self-start">
            <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-bold text-xs">
              <Inbox size={13} /> {list.length} total request{list.length !== 1 && "s"}
            </span>
          </div>
        )}
      </div>

      {/* Status tabs - horizontally scrollable on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 -mx-1 px-1 scrollbar-thin">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`chip border transition text-xs whitespace-nowrap py-1.5 px-3 ${
              tab === t.key
                ? "bg-brand-600 border-brand-600 text-white font-bold"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-400 font-medium"
            }`}>
            {t.label} <span className={`ml-1 ${tab === t.key ? "text-white/80" : "opacity-70"}`}>({counts[t.key] || 0})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <RequestsSkeleton />
      ) : filtered.length === 0 ? (
        <div className="card p-10 sm:p-14 text-center space-y-3">
          <div className="mx-auto h-14 w-14 grid place-items-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300">
            <Inbox size={24} />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-slate-700 dark:text-slate-200">No requests found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {tab === "all" ? "When helpers request to work on your tasks, they'll show up here." : `No requests currently marked as "${tab.replace("_", " ")}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((r) => {
            const accepted = r.status === "accepted" || r.status === "completed";
            const img = r.task?.image || r.task?.picture;
            const initials = `${r.requester?.firstName?.[0] || ""}${r.requester?.lastName?.[0] || ""}`.toUpperCase();
            return (
              <article key={r._id} className="card overflow-hidden flex flex-col hover:shadow-soft transition">
                {img && (
                  <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img src={img} alt={r.task?.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className="chip bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-[11px]">
                      {r.task?.category || "Task"}
                    </span>
                    <span className={`chip text-[11px] font-semibold ${
                      r.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : r.status === "accepted" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : r.status === "in_progress" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : r.status === "completed" ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                      : r.status === "cancelled" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    }`}>{r.status.replace("_"," ")}</span>
                  </div>

                  <h3 className="mt-2.5 font-bold text-base sm:text-lg text-slate-900 dark:text-white line-clamp-1">
                    {r.task?.title}
                  </h3>
                  {r.task?.location && (
                    <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={12} className="shrink-0" /> <span className="truncate">{r.task.location}</span>
                    </div>
                  )}

                  {/* Requester card */}
                  <button
                    onClick={() => nav(`/dashboard/profile/${r.requester?._id}`)}
                    className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition text-left"
                    title="View public profile">
                    <Avatar src={r.requester?.profilePicture} initials={initials} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1">
                        <span className="truncate">{r.requester?.firstName} {r.requester?.lastName}</span>
                        <Eye size={13} className="opacity-60 shrink-0" />
                      </div>
                      {accepted && r.requester?.email ? (
                        <div className="text-xs text-slate-500 truncate">{r.requester.email}</div>
                      ) : (
                        <div className="text-xs text-slate-400 truncate">Contact revealed after accepting</div>
                      )}
                    </div>
                  </button>

                  {r.message && (
                    <div className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic border-l-2 border-brand-400 pl-3 py-0.5">
                      "{r.message}"
                    </div>
                  )}

                  <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock size={11} className="shrink-0" /> {new Date(r.createdAt).toLocaleString([], {
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

                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                    {r.status === "pending" ? (
                      <>
                        <button onClick={() => decide(r._id, "accepted")}
                          className="btn-primary text-xs sm:text-sm py-2 px-3 flex-1 justify-center"><Check size={14} /> Accept</button>
                        <button onClick={() => decide(r._id, "rejected")}
                          className="btn-ghost text-xs sm:text-sm py-2 px-3 flex-1 justify-center"><X size={14} /> Reject</button>
                      </>
                    ) : r.status === "completed" && r.paymentStatus !== "paid" ? (
                      <>
                        <button
                          onClick={() => pay(r)}
                          disabled={payingId === r._id}
                          className="btn-primary text-xs sm:text-sm py-2 px-3 flex-1 justify-center inline-flex items-center gap-1.5"
                        >
                          <CreditCard size={14} />
                          {payingId === r._id ? "Processing..." : `Pay ${r.task?.currency || "INR"} ${r.task?.paymentAmount || 0}`}
                        </button>
                        <button onClick={() => nav("/dashboard/messages")} className="btn-ghost text-xs sm:text-sm py-2 px-3">
                          <MessageSquare size={14} />
                        </button>
                      </>
                    ) : ["accepted", "in_progress"].includes(r.status) ? (
                      <>
                        <button onClick={() => nav("/dashboard/messages")}
                          className="btn-primary text-xs sm:text-sm py-2 px-3 flex-1 justify-center"><MessageSquare size={14} /> Open chat</button>
                        <button onClick={() => cancel(r)}
                          className="btn-ghost text-xs sm:text-sm py-2 px-3 text-rose-600 justify-center"><XCircle size={14} /> Cancel</button>
                      </>
                    ) : (
                      <div className="text-xs text-slate-500 py-1.5 w-full text-center sm:text-left">This request was {r.status.replace("_"," ")}.</div>
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

// === Skeleton Loading Component for Requests ===
function RequestsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse" aria-label="Loading requests">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={`req-skel-${i}`} className="card overflow-hidden flex flex-col border border-slate-200/80 dark:border-slate-800">
          <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800" />
          <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
            {/* Requester card skeleton */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
            <div className="h-3.5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex gap-2 mt-auto">
              <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl flex-1" />
              <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
