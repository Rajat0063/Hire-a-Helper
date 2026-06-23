import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Clock, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// === Feed ===
// Lists all open tasks (from MongoDB). Honors `?q=` in the URL (set by
// the global header search). "AI Picks" / "AI Recommended" are simple
// client-side heuristics over the same list — no external AI required.
export default function Feed() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPicks, setShowPicks] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/tasks", { params: q ? { q } : {} })
      .then(({ data }) => setTasks(data.tasks || []))
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setLoading(false));
  }, [q]);

  const aiPicks = useMemo(() => {
    // ~ naive "recommendation": highest-paying, most recent open tasks ~
    return [...tasks]
      .sort((a, b) => (b.paymentAmount || 0) - (a.paymentAmount || 0))
      .slice(0, 4);
  }, [tasks]);

  const request = async (id) => {
    try { await api.post(`/tasks/${id}/request`); toast.success("Request sent!"); }
    catch (e) { toast.error(e.response?.data?.message || "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Feed</h1>
          <p className="text-slate-500 dark:text-slate-400">Find tasks that need help</p>
        </div>
        <button
          onClick={() => setShowPicks((v) => !v)}
          className="btn-primary text-sm py-2"
        >
          <Sparkles size={16} /> AI Picks
        </button>
      </div>

      {q && (
        <div className="card p-3 px-4 flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            Search results for <b>"{q}"</b> · {tasks.length} found
          </span>
          <button onClick={() => setParams({})} className="text-brand-700 dark:text-brand-300 font-semibold">Clear</button>
        </div>
      )}

      {showPicks && aiPicks.length > 0 && (
        <section className="card p-5">
          <h2 className="font-bold text-brand-700 dark:text-brand-300 flex items-center gap-2 mb-4">
            <Sparkles size={18} /> AI Recommended for You
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {aiPicks.slice(0, 2).map((t) => <TaskCard key={`pick-${t._id}`} t={t} onRequest={request} />)}
          </div>
        </section>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-slate-500">No open tasks yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {tasks.map((t) => <TaskCard key={t._id} t={t} onRequest={request} />)}
        </div>
      )}
    </div>
  );
}

function TaskCard({ t, onRequest }) {
  const img = t.image || t.picture;
  return (
    <article className="card overflow-hidden flex flex-col">
      {img && (
        <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <img src={img} alt={t.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {t.category || "Other"}
          </span>
          <span className="text-[11px] text-slate-400">{new Date(t.createdAt).toISOString()}</span>
        </div>
        <h3 className="mt-3 font-bold text-lg text-slate-900 dark:text-white">{t.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mt-1">{t.description}</p>

        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
          <MapPin size={12} /> {t.location}
        </div>
        <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1"><Clock size={12} />
            {new Date(t.startTime).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </span>
          {t.endTime && (
            <span className="flex items-center gap-1">Ends · <Clock size={12} />
              {new Date(t.endTime).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-lg font-extrabold text-slate-900 dark:text-white">
            {currencySymbol(t.currency)}{Number(t.paymentAmount || 0).toFixed(2)}
          </div>
          <button onClick={() => onRequest(t._id)} className="btn-primary text-sm py-2">Request</button>
        </div>
      </div>
    </article>
  );
}

function currencySymbol(c) {
  return { USD: "$", EUR: "€", GBP: "£", INR: "₹" }[c] || "$";
}
