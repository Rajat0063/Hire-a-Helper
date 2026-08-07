import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Clock, Sparkles, Check, X, Filter } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getSocket } from "../../services/socket";

// === Feed ===
// Lists all open tasks. Filters by:
//   • search ?q=
//   • single-task focus ?taskId=
//   • category chips (client-side)
//   • location text (client-side, matches t.location case-insensitively)
// Categories are pulled from /api/settings (admin-managed).
export default function Feed() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const focusId = params.get("taskId") || "";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPicks, setShowPicks] = useState(true);
  const [sent, setSent] = useState({});
  const [dlgTask, setDlgTask] = useState(null);
  const [dlgText, setDlgText] = useState("");

  const [categories, setCategories] = useState([
    "Car Repairing", "Painting", "Moving", "Cleaning", "Gardening", "Car Washing",
  ]);
  const [cat, setCat] = useState("All");

  // settings -> categories
  useEffect(() => {
    api.get("/settings").then(({ data }) => {
      if (Array.isArray(data.categories) && data.categories.length) setCategories(data.categories);
    }).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    api.get("/tasks", { params: q ? { q } : {} })
      .then(({ data }) => setTasks(data.tasks || []))
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setLoading(false));
    api.get("/requests/sent").then(({ data }) => {
      const m = {};
      for (const r of data.requests || []) if (r.task?._id) m[r.task._id] = "sent";
      setSent(m);
    }).catch(() => {});
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);

  useEffect(() => {
    const s = getSocket(); if (!s) return;
    const r = () => load();
    s.on("task:created", r); s.on("task:updated", r); s.on("task:deleted", r);
    return () => { s.off("task:created", r); s.off("task:updated", r); s.off("task:deleted", r); };
    // eslint-disable-next-line
  }, [q]);

  const filtered = useMemo(() => {
    let arr = focusId ? tasks.filter((t) => t._id === focusId) : tasks;
    if (cat !== "All") arr = arr.filter((t) => (t.category || "Other") === cat);
    return arr;
  }, [tasks, focusId, cat]);

  const aiPicks = useMemo(
    () => [...tasks].sort((a, b) => (b.paymentAmount || 0) - (a.paymentAmount || 0)).slice(0, 4),
    [tasks]
  );

  const openRequest = (t) => {
    setDlgTask(t);
    setDlgText(`Hi, I'd like to help with "${t.title}"${t.location ? ` in ${t.location}` : ""}.`);
  };
  const sendRequest = async () => {
    if (!dlgTask) return;
    const id = dlgTask._id;
    setSent((p) => ({ ...p, [id]: "sending" }));
    try {
      await api.post(`/tasks/${id}/request`, { message: dlgText });
      setSent((p) => ({ ...p, [id]: "sent" }));
      toast.success("Request sent");
      setDlgTask(null);
    } catch (e) {
      setSent((p) => { const n = { ...p }; delete n[id]; return n; });
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Feed</h1>
          <p className="text-slate-500 dark:text-slate-400">Find tasks that need help</p>
        </div>
        <button onClick={() => setShowPicks((v) => !v)} className="btn-primary text-sm py-2">
          <Sparkles size={16} /> AI Picks
        </button>
      </div>

      {(q || focusId) && (
        <div className="card p-3 px-4 flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            {focusId ? "Showing 1 selected task" : <>Search results for <b>"{q}"</b> · {tasks.length} found</>}
          </span>
          <button onClick={() => setParams({})} className="text-brand-700 dark:text-brand-300 font-semibold">Clear</button>
        </div>
      )}

      {/* ====== Filters — only show categories that have actual open tasks ====== */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Filter size={14} /> Filters
        </div>
        <div className="flex flex-wrap gap-2">
          {(() => {
            const present = new Set(tasks.map((t) => t.category || "Other"));
            const available = categories.filter((c) => present.has(c));
            const chips = ["All", ...available];
            return chips.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`chip border transition ${
                  cat === c
                    ? "bg-brand-600 border-brand-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-400"
                }`}
              >
                {c}
              </button>
            ));
          })()}
        </div>
        {cat !== "All" && (
          <button onClick={() => setCat("All")} className="btn-ghost text-sm py-2 whitespace-nowrap">
            Reset
          </button>
        )}
      </div>

      {loading ? (
        <FeedSkeleton showPicks={showPicks && !focusId} />
      ) : (
        <>
          {!focusId && showPicks && aiPicks.length > 0 && (
            <section className="card p-5">
              <h2 className="font-bold text-brand-700 dark:text-brand-300 flex items-center gap-2 mb-4">
                <Sparkles size={18} /> AI Recommended for You
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {aiPicks.slice(0, 2).map((t) => (
                  <TaskCard key={`pick-${t._id}`} t={t} state={sent[t._id]} onRequest={() => openRequest(t)} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 grid place-items-center mx-auto">
                <Filter size={22} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">No tasks match your filters</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Try searching for a different term or clearing your category filters to find more available tasks.
              </p>
              {cat !== "All" && (
                <button onClick={() => setCat("All")} className="btn-primary text-sm py-2 px-4 inline-flex mt-2">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((t) => (
                <TaskCard key={t._id} t={t} state={sent[t._id]} onRequest={() => openRequest(t)} />
              ))}
            </div>
          )}
        </>
      )}

      {dlgTask && (
        <RequestDialog
          task={dlgTask}
          text={dlgText}
          setText={setDlgText}
          onClose={() => setDlgTask(null)}
          onSend={sendRequest}
          busy={sent[dlgTask._id] === "sending"}
        />
      )}
    </div>
  );
}

// === Skeleton Loading Component for Feed ===
function FeedSkeleton({ showPicks }) {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading tasks feed">
      {/* AI Picks Skeleton */}
      {showPicks && (
        <section className="card p-5 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 bg-brand-200 dark:bg-brand-900/40 rounded-full" />
            <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={`pick-skel-${i}`} className="card border border-slate-200/70 dark:border-slate-800/80 p-4 flex gap-3.5">
                <div className="h-20 w-20 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Task Grid Skeleton */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((idx) => {
          const hasImage = idx % 2 === 1; // realistic variation of image/non-image cards
          return (
            <div
              key={`feed-card-skel-${idx}`}
              className="card overflow-hidden flex flex-col border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft"
            >
              {hasImage && (
                <div className="aspect-[16/9] w-full bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col space-y-3.5">
                {/* Header chip + date */}
                <div className="flex items-center justify-between">
                  <div className="h-5 w-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>

                {/* Title */}
                <div className="space-y-1.5 pt-1">
                  <div className="h-5 w-5/6 bg-slate-200 dark:bg-slate-700/80 rounded-md" />
                  <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3.5 w-4/6 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>

                {/* Location & Time info */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>

                {/* Bottom row */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-md" />
                  <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ t, state, onRequest }) {
  const img = t.image || t.picture;
  const isSending = state === "sending";
  const isSent = state === "sent";
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
          <span className="text-[11px] text-slate-400">
            {new Date(t.createdAt).toLocaleDateString()}
          </span>
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
          <button onClick={onRequest} disabled={isSent || isSending}
            className={`text-sm py-2 ${isSent
              ? "btn bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 cursor-default"
              : "btn-primary"}`}
          >
            {isSent ? (<><Check size={14} /> Sent</>) : isSending ? "Sending…" : "Request"}
          </button>
        </div>
      </div>
    </article>
  );
}

function RequestDialog({ task, text, setText, onClose, onSend, busy }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg shadow-soft">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Send Request</h2>
            <p className="text-sm text-slate-500 mt-1">Write a short message to the task owner.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            {(task.image || task.picture) && (
              <img src={task.image || task.picture} alt="" className="h-12 w-12 rounded-xl object-cover" />
            )}
            <div>
              <div className="font-bold text-slate-800 dark:text-white">{task.title}</div>
              <div className="text-xs text-slate-500">{task.location} · {task.category}</div>
              <div className="text-xs text-slate-500">Payment: <b>{currencySymbol(task.currency)}{Number(task.paymentAmount||0).toFixed(2)}</b></div>
            </div>
          </div>
          <div>
            <label className="label">Your message</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              className="input min-h-[120px] mt-1" placeholder="Add a personal note (optional)" />
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost text-sm py-2">Cancel</button>
          <button onClick={onSend} disabled={busy} className="btn-primary text-sm py-2">{busy ? "Sending…" : "Send"}</button>
        </div>
      </div>
    </div>
  );
}

function currencySymbol(c) { return { USD: "$", EUR: "€", GBP: "£", INR: "₹" }[c] || "$"; }
