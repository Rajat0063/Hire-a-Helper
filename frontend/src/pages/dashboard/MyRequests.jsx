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
  const [busy, setBusy] = useState(null);
  const nav = useNavigate();

  const load = () => api.get("/requests/sent").then(({ data }) => setList(data.requests || []));
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
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">My Requests</h1>
        <p className="text-slate-500 dark:text-slate-400">Track the tasks you've offered to help with.</p>
      </div>

      {list.length === 0 ? (
        <p className="text-slate-500">You haven't requested any tasks yet.</p>
      ) : (
        <div className="space-y-3">
          {list.map((r) => {
            const b = busy === r._id;
            return (
              <div key={r._id} className="card p-5 flex flex-wrap items-center gap-4 justify-between">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white">{r.task?.title}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Posted by {r.task?.user?.firstName} {r.task?.user?.lastName}
                  </div>
                  {r.status === "in_progress" && r.distanceKm != null && (
                    <div className="text-xs text-slate-500 mt-1">
                      Checked in {r.offSite ? `~${r.distanceKm} km off-site` : "on-site"} ·
                      {new Date(r.checkinAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                  )}
                  {r.paymentStatus === "paid" && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                      💰 Paid · {r.task?.currency || "INR"} {r.task?.paymentAmount}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge s={r.status} />

                  {r.status === "accepted" && (
                    <button disabled={b} onClick={() => startWork(r)} className="btn-primary text-sm py-2">
                      {b ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />} Start work
                    </button>
                  )}
                  {r.status === "in_progress" && (
                    <button disabled={b} onClick={() => markComplete(r)} className="btn-primary text-sm py-2">
                      {b ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Mark complete
                    </button>
                  )}
                  {["accepted", "in_progress"].includes(r.status) && (
                    <button disabled={b} onClick={() => cancel(r)} className="btn-ghost text-sm py-2 text-rose-600">
                      <XCircle size={14} /> Cancel
                    </button>
                  )}
                  {["accepted", "in_progress", "completed"].includes(r.status) && r.conversation && (
                    <button onClick={() => nav(`/dashboard/messages?c=${r.conversation}`)}
                      className="btn-ghost text-sm py-2">
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
