import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MessageSquare, Navigation, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "../../services/api";
import { getSocket } from "../../services/socket";

// === MyRequests ===
// Requests the user has sent (as a helper).
// Adds the worker-side task lifecycle:
//   Accepted → Start work (geolocation check-in) → Mark complete → owner pays.
export default function MyRequests() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const nav = useNavigate();

  const load = () => {
    setLoading(true);
    api.get("/requests/sent")
      .then(({ data }) => setList(data.requests || []))
      .catch(() => toast.error("Failed to load requests"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const s = getSocket(); if (!s) return;
    const r = () => load();
    s.on("request:status", r);
    return () => s.off("request:status", r);
  }, []);

  const startWork = async (r) => {
    setBusy(r._id);
    const send = (coords) =>
      api.post(`/requests/${r._id}/progress`, coords)
        .then(({ data }) => {
          if (data.request.offSite)
            toast("Checked in, but you look off-site. The owner has been notified.", { icon: "⚠️" });
          else toast.success("You're checked in — owner notified.");
          load();
        })
        .catch((e) => toast.error(e.response?.data?.message || "Check-in failed"))
        .finally(() => setBusy(null));

    if (!navigator.geolocation) return send({});
    navigator.geolocation.getCurrentPosition(
      (pos) => send({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => send({}),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const markComplete = async (r) => {
    setBusy(r._id);
    try { await api.post(`/requests/${r._id}/complete`); toast.success("Marked complete — waiting on payment."); load(); }
    catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setBusy(null); }
  };

  const cancel = async (r) => {
    if (!window.confirm("Cancel this request?")) return;
    setBusy(r._id);
    try { await api.post(`/requests/${r._id}/cancel`); toast.success("Cancelled"); load(); }
    catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">My Requests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track and manage tasks you've offered to help with.</p>
        </div>
        {!loading && list.length > 0 && (
          <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 self-start text-xs font-bold">
            {list.length} task{list.length !== 1 && "s"} requested
          </span>
        )}
      </div>

      {loading ? (
        <MyRequestsSkeleton />
      ) : list.length === 0 ? (
        <div className="card p-10 sm:p-14 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 grid place-items-center mx-auto">
            <CheckCircle2 size={22} />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">You haven't requested any tasks yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Browse the Feed to discover open tasks and offer your skills to help people in need.
          </p>
          <button onClick={() => nav("/dashboard/feed")} className="btn-primary text-sm py-2 px-4 inline-flex mt-2">
            Explore Open Tasks
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {list.map((r) => {
            const b = busy === r._id;
            return (
              <div key={r._id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between hover:shadow-soft transition">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                    {r.task?.title || "Task"}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                    Posted by <span className="font-medium text-slate-800 dark:text-slate-200">{r.task?.user?.firstName} {r.task?.user?.lastName}</span>
                  </div>
                  {r.status === "in_progress" && r.distanceKm != null && (
                    <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                      <span className={`chip text-[11px] ${r.offSite ? "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"}`}>
                        {r.offSite ? `⚠️ ~${r.distanceKm} km off-site` : "✅ On-site"}
                      </span>
                      <span>· checked in {new Date(r.checkinAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                    </div>
                  )}
                  {r.status === "completed" && (
                    <div className={`text-xs mt-1.5 font-bold flex items-center gap-1.5 ${
                      r.paymentStatus === "paid"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {r.paymentStatus === "paid" ? (
                        <span>💰 Paid · {r.task?.currency || "INR"} {r.task?.paymentAmount}</span>
                      ) : (
                        <span>⏳ Completed · Payment pending from owner ({r.task?.currency || "INR"} {r.task?.paymentAmount || 0})</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <StatusBadge s={r.status} />

                  {r.status === "accepted" && (
                    <button disabled={b} onClick={() => startWork(r)} className="btn-primary text-xs sm:text-sm py-2 px-3">
                      {b ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />} Start work
                    </button>
                  )}
                  {r.status === "in_progress" && (
                    <button disabled={b} onClick={() => markComplete(r)} className="btn-primary text-xs sm:text-sm py-2 px-3">
                      {b ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Mark complete
                    </button>
                  )}
                  {["accepted", "in_progress"].includes(r.status) && (
                    <button disabled={b} onClick={() => cancel(r)} className="btn-ghost text-xs sm:text-sm py-2 px-3 text-rose-600">
                      <XCircle size={14} /> Cancel
                    </button>
                  )}
                  {["accepted", "in_progress", "completed"].includes(r.status) && r.conversation && (
                    <button onClick={() => nav(`/dashboard/messages?c=${r.conversation}`)}
                      className="btn-ghost text-xs sm:text-sm py-2 px-3">
                      <MessageSquare size={14} /> Message
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// === Skeleton Loading Component for My Requests ===
function MyRequestsSkeleton() {
  return (
    <div className="space-y-3.5 animate-pulse" aria-label="Loading my requests">
      {[1, 2, 3, 4].map((i) => (
        <div key={`myreq-skel-${i}`} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between border border-slate-200/80 dark:border-slate-800">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="h-5 w-2/3 max-w-sm bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ s }) {
  const map = {
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    accepted: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    in_progress: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    rejected: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    completed: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200",
    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };
  return <span className={`chip ${map[s] || "bg-slate-100 text-slate-700"}`}>{s.replace("_", " ")}</span>;
}
