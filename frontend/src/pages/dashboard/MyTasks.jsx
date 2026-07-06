import { useEffect, useRef, useState } from "react";
import { MapPin, Clock, Pencil, Trash2, X, Camera } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getSocket } from "../../services/socket";

// === MyTasks ===
// Owner view — cards mirror the Feed layout. Hover reveals a delete (top-right)
// and click "Edit" opens a dialog to update endTime, image, description, payment.
export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [edit, setEdit] = useState(null);
  const [canEdit, setCanEdit] = useState(true);

  const load = () => api.get("/tasks/mine").then(({ data }) => setTasks(data.tasks || []));
  useEffect(() => {
    load();
    // ~ respect the admin platform toggle: hide edit/delete on all cards when off ~
    api.get("/settings").then(({ data }) => setCanEdit(data.allowTaskEditing !== false)).catch(() => {});
  }, []);
  useEffect(() => {
    const s = getSocket(); if (!s) return;
    const r = () => load();
    const onSettings = ({ settings }) => setCanEdit(settings?.allowTaskEditing !== false);
    s.on("task:updated", r); s.on("task:deleted", r); s.on("request:new", r);
    s.on("settings:updated", onSettings);
    return () => { s.off("task:updated", r); s.off("task:deleted", r); s.off("request:new", r); s.off("settings:updated", onSettings); };
  }, []);

  const remove = async (id) => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    try { await api.delete(`/tasks/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(e?.response?.data?.message || "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">My Tasks</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {canEdit ? "Tasks you posted — hover any card to edit or delete." : "Tasks you posted — editing has been disabled by the platform administrator."}
        </p>
      </div>

      {tasks.length === 0 ? (
        <p className="text-slate-500">You haven't posted any tasks yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {tasks.map((t) => (
            <Card key={t._id} t={t} canEdit={canEdit}
              onEdit={() => setEdit(t)} onDelete={() => remove(t._id)} />
          ))}
        </div>
      )}

      {edit && <EditDialog t={edit} onClose={() => setEdit(null)} onSaved={(u) => {
        setEdit(null);
        setTasks((p) => p.map((x) => x._id === u._id ? u : x));
      }} />}
    </div>
  );
}

function Card({ t, canEdit, onEdit, onDelete }) {
  const img = t.image || t.picture;
  return (
    <article className="card overflow-hidden flex flex-col relative group">
      {/* delete (top-right, on hover) — hidden when platform locks editing */}
      {canEdit && (
        <button onClick={onDelete}
          className="absolute top-3 right-3 z-10 h-8 w-8 grid place-items-center rounded-lg
                     bg-rose-500/90 text-white opacity-0 group-hover:opacity-100 transition shadow-soft"
          title="Delete task">
          <Trash2 size={14} />
        </button>
      )}

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
          <span className={`chip ${
            t.status === "open" ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
            : t.status === "completed" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}>{t.status}</span>
        </div>
        <h3 className="mt-3 font-bold text-lg text-slate-900 dark:text-white">{t.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mt-1">{t.description}</p>

        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
          <MapPin size={12} /> {t.location}
        </div>
        <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
          <Clock size={12} /> {new Date(t.startTime).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          {t.endTime && <> · Ends {new Date(t.endTime).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</>}
        </div>

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-lg font-extrabold text-slate-900 dark:text-white">
            ₹{Number(t.paymentAmount || 0).toFixed(2)}
          </div>
          {canEdit
            ? <button onClick={onEdit} className="btn-ghost text-sm py-2"><Pencil size={14} /> Edit</button>
            : <span className="text-xs text-slate-400 italic">Editing disabled</span>}
        </div>
      </div>
    </article>
  );
}

function EditDialog({ t, onClose, onSaved }) {
  const [f, setF] = useState({
    description: t.description || "",
    paymentAmount: t.paymentAmount || 0,
    endTime: t.endTime ? new Date(t.endTime).toISOString().slice(0, 16) : "",
    image: t.image || "",
  });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const onFile = (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast.error("Image only");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    const r = new FileReader();
    r.onload = () => setF((p) => ({ ...p, image: r.result }));
    r.readAsDataURL(file);
  };

  const save = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/tasks/${t._id}`, {
        description: f.description,
        paymentAmount: Number(f.paymentAmount) || 0,
        endTime: f.endTime ? new Date(f.endTime).toISOString() : null,
        image: f.image,
      });
      toast.success("Updated");
      onSaved(data.task);
    } catch { toast.error("Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg shadow-soft">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Edit Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[100px] mt-1" value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Payment ($)</label>
              <input type="number" min="0" step="0.01" className="input mt-1"
                value={f.paymentAmount} onChange={(e) => setF({ ...f, paymentAmount: e.target.value })} />
            </div>
            <div>
              <label className="label">Ends</label>
              <input type="datetime-local" className="input mt-1"
                value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Image</label>
            <div className="mt-1 flex items-center gap-3">
              {f.image && <img src={f.image} alt="" className="h-16 w-16 rounded-lg object-cover" />}
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost text-sm py-2">
                <Camera size={14} /> Change
              </button>
              {f.image && <button type="button" onClick={() => setF({ ...f, image: "" })} className="btn-ghost text-sm py-2">Remove</button>}
              <input hidden ref={fileRef} type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost text-sm py-2">Cancel</button>
          <button onClick={save} disabled={busy} className="btn-primary text-sm py-2">{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
