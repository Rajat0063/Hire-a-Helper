import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Sparkles, Upload, X } from "lucide-react";
import api from "../../services/api";

const CATEGORIES = [
  "Moving", "Cleaning", "Gardening", "Painting", "Repairs",
  "Tech", "Tutoring", "Delivery", "Car Repairing", "Pet Care", "Cooking", "Other",
];
const CURRENCIES = [
  { code: "USD", label: "USD - $" },
  { code: "EUR", label: "EUR - €" },
  { code: "GBP", label: "GBP - £" },
  { code: "INR", label: "INR - ₹" },
];

// === AddTask ===
// Drag & drop image upload — file is read as base64 and submitted as a
// data URL so it persists in MongoDB (no external storage needed).
export default function AddTask() {
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [f, setF] = useState({
    title: "", description: "", location: "",
    startDate: "", startTime: "", endDate: "", endTime: "",
    category: "", paymentAmount: 0, currency: "USD", image: "",
  });
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  // ~ AI description generator: builds a friendly description client-side ~
  const aiGenerate = () => {
    if (!f.title) return toast.error("Add a title first");
    const cat = f.category || "task";
    const loc = f.location ? ` in ${f.location}` : "";
    const desc =
      `I need help with ${f.title.toLowerCase()}${loc}. ` +
      `This ${cat.toLowerCase()} task should take a few hours and I'll provide all needed materials. ` +
      `Please reach out if you're interested and available — looking forward to working together!`;
    set("description", desc);
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.type))
      return toast.error("Only PNG, JPG, GIF or WebP");
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10 MB");
    const reader = new FileReader();
    reader.onload = () => set("image", reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!f.startDate || !f.startTime) return toast.error("Pick a start date & time");

    const start = new Date(`${f.startDate}T${f.startTime}`);
    const end = f.endDate && f.endTime ? new Date(`${f.endDate}T${f.endTime}`) : undefined;

    setLoading(true);
    try {
      await api.post("/tasks", {
        title: f.title, description: f.description, location: f.location,
        category: f.category || "Other",
        startTime: start, endTime: end,
        image: f.image, paymentAmount: Number(f.paymentAmount) || 0, currency: f.currency,
      });
      toast.success("Task posted!");
      nav("/dashboard/feed");
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Add Task</h1>
        <p className="text-slate-500">Create a task and find someone to help you</p>
      </div>

      <form onSubmit={submit} className="card p-6 lg:p-8 space-y-5 max-w-3xl mx-auto">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Add New Task</h2>
          <p className="text-slate-500 text-sm">Fill in the details and let AI help with the description</p>
        </div>

        <Field label="Task Title">
          <input className="input" required placeholder="e.g., Help moving furniture"
            value={f.title} onChange={(e) => set("title", e.target.value)} />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label">Description</label>
            <button type="button" onClick={aiGenerate}
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 inline-flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Sparkles size={14} className="text-brand-600" /> AI Generate
            </button>
          </div>
          <textarea className="input min-h-[120px]" required placeholder="Describe what help you need…"
            value={f.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <Field label="Location">
          <input className="input" required placeholder="e.g., Downtown Seattle, WA"
            value={f.location} onChange={(e) => set("location", e.target.value)} />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Start Date">
            <input type="date" className="input" required value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label="Start Time">
            <input type="time" className="input" required value={f.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </Field>
          <Field label="End Date" optional>
            <input type="date" className="input" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </Field>
          <Field label="End Time" optional>
            <input type="time" className="input" value={f.endTime} onChange={(e) => set("endTime", e.target.value)} />
          </Field>
        </div>

        <Field label="Category">
          <select className="input" value={f.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Payment Amount">
            <input type="number" min="0" step="0.01" className="input" value={f.paymentAmount}
              onChange={(e) => set("paymentAmount", e.target.value)} />
          </Field>
          <Field label="Currency">
            <select className="input" value={f.currency} onChange={(e) => set("currency", e.target.value)}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </Field>
        </div>

        {/* ~ Drag & drop image upload ~ */}
        <div>
          <label className="label">Task Image <span className="text-slate-400">(Optional)</span></label>
          {f.image ? (
            <div className="mt-2 relative">
              <img src={f.image} alt="preview" className="rounded-xl w-full max-h-72 object-cover" />
              <button type="button" onClick={() => set("image", "")}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`mt-2 border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition
                ${dragOver ? "border-brand-500 bg-brand-50/40 dark:bg-brand-900/20" : "border-slate-200 dark:border-slate-700"}`}
            >
              <Upload className="mx-auto text-slate-400" />
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Upload a file or drag and drop</div>
              <div className="text-xs text-slate-400">PNG, JPG, GIF up to 10MB</div>
              <input ref={fileRef} hidden type="file" accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button className="btn-primary flex-1" disabled={loading}>{loading ? "Posting…" : "Post Task"}</button>
          <button type="button" onClick={() => nav(-1)} className="btn-ghost flex-1">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, optional, children }) {
  return (
    <div>
      <label className="label">
        {label} {optional && <span className="text-slate-400">(Optional)</span>}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
