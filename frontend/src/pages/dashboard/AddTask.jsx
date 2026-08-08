import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Sparkles, Upload, X, Locate } from "lucide-react";
import api from "../../services/api";

const CATEGORIES = [
  "Moving", "Cleaning", "Gardening", "Painting", "Repairs",
  "Tech", "Tutoring", "Delivery", "Car Repairing", "Pet Care", "Cooking", "Other",
];
const CURRENCIES = [
  { code: "INR", label: "INR - ₹" }, { code: "USD", label: "USD - $" },
  { code: "EUR", label: "EUR - €" }, { code: "GBP", label: "GBP - £" },
];

// === AddTask ===
// "Use mine" now ALSO reverse-geocodes via OpenStreetMap Nominatim (free, no
// key) and fills the Location text box automatically so the user doesn't
// have to type the city manually.
export default function AddTask() {
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [f, setF] = useState({
    title: "", description: "", location: "",
    startDate: "", startTime: "", endDate: "", endTime: "",
    category: "", paymentAmount: 0, currency: "INR", image: "",
    lat: null, lng: null,
  });
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [categories, setCategories] = useState(CATEGORIES);

  useEffect(() => {
    api.get("/settings").then(({ data }) => {
      if (Array.isArray(data.categories) && data.categories.length) setCategories(data.categories);
    }).catch(() => {});
  }, []);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const aiGenerate = () => {
    if (!f.title) return toast.error("Add a title first");
    const cat = f.category || "task";
    const loc = f.location ? ` in ${f.location}` : "";
    set("description",
      `I need help with ${f.title.toLowerCase()}${loc}. This ${cat.toLowerCase()} task should take a few hours and I'll provide all needed materials. Please reach out if you're interested and available — looking forward to working together!`);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      set("lat", lat); set("lng", lng);
      try {
        // reverse-geocode in English strictly (accept-language=en)
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en,en-US;q=0.9,en-GB;q=0.8&addressdetails=1`,
          { headers: { Accept: "application/json", "Accept-Language": "en,en-US;q=0.9,en-GB;q=0.8" } }
        );
        const d = await r.json();
        const a = d?.address || {};
        const cityOrTown = a["city:en"] || a.city || a["town:en"] || a.town || a["village:en"] || a.village || a.county || a.municipality || "";
        const sub = a["suburb:en"] || a.suburb || a["neighbourhood:en"] || a.neighbourhood || a.district || "";
        const state = a["state:en"] || a.state || a.region || "";
        const country = a["country:en"] || a.country || "";
        const parts = [cityOrTown, sub, state, country].filter(Boolean);
        const label = parts.slice(0, 3).join(", ") || d?.display_name?.split(",").slice(0, 3).join(", ") || "";
        if (label) set("location", label);
        toast.success(label ? `Location set: ${label}` : "Coordinates captured");
      } catch {
        toast.success("Coordinates captured");
      } finally { setLocating(false); }
    }, () => { toast.error("Couldn't get location"); setLocating(false); },
    { enableHighAccuracy: true, timeout: 9000 });
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.type)) return toast.error("Only PNG, JPG, GIF or WebP");
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10 MB");
    const reader = new FileReader();
    reader.onload = () => set("image", reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return toast.error("Task title is required");
    if (!f.description.trim()) return toast.error("Description is required");
    if (!f.location.trim()) return toast.error("Location is required");
    if (!f.startDate || !f.startTime) return toast.error("Pick a start date & time");
    if (!f.category) return toast.error("Category is mandatory. Please select a category.");
    if (!f.paymentAmount || Number(f.paymentAmount) <= 0) return toast.error("Payment amount is mandatory. Please enter a valid amount.");
    if (!f.currency) return toast.error("Currency is mandatory. Please select a currency.");
    if (!f.image) return toast.error("A task image is required");
    const start = new Date(`${f.startDate}T${f.startTime}`);
    const end = f.endDate && f.endTime ? new Date(`${f.endDate}T${f.endTime}`) : undefined;
    setLoading(true);
    try {
      await api.post("/tasks", {
        title: f.title, description: f.description, location: f.location,
        category: f.category,
        startTime: start, endTime: end,
        image: f.image, paymentAmount: Number(f.paymentAmount), currency: f.currency,
        lat: f.lat, lng: f.lng,
      });
      toast.success("Task posted!");
      nav("/dashboard/feed");
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Add Task</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Create a task and connect with local community helpers</p>
      </div>

      <form onSubmit={submit} className="card p-5 sm:p-6 lg:p-8 space-y-5 border border-slate-200/80 dark:border-slate-800 shadow-soft">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">Task Details</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">Fill in the details below. You can also use AI to draft your task description.</p>
        </div>

        <Field label="Task Title">
          <input className="input text-xs sm:text-sm" required placeholder="e.g., Help moving heavy couch and desk"
            value={f.title} onChange={(e) => set("title", e.target.value)} />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label text-xs sm:text-sm">
              Description <span className="text-rose-500 font-bold" title="Required field">*</span>
            </label>
            <button type="button" onClick={aiGenerate}
              className="text-xs font-semibold text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900/50 bg-brand-50/50 dark:bg-brand-900/20 rounded-lg px-2.5 py-1 inline-flex items-center gap-1.5 hover:bg-brand-50 transition">
              <Sparkles size={13} className="text-brand-600 dark:text-brand-400" /> AI Draft
            </button>
          </div>
          <textarea className="input text-xs sm:text-sm min-h-[110px]" required placeholder="Describe what help you need, estimated time, and any materials provided…"
            value={f.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <Field label="Location">
          <div className="flex flex-col sm:flex-row gap-2">
            <input className="input text-xs sm:text-sm flex-1" required placeholder="e.g., Downtown Seattle, WA or Neighborhood"
              value={f.location} onChange={(e) => set("location", e.target.value)} />
            <button type="button" onClick={useMyLocation} disabled={locating}
              className="btn-ghost text-xs sm:text-sm py-2 px-3 whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5">
              <Locate size={14} className={locating ? "animate-spin text-brand-600" : ""} />
              {locating ? "Locating…" : "Use My GPS"}
            </button>
          </div>
          {f.lat != null && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">✓ Coordinates captured — task will display on Nearby map.</p>}
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start Date">
            <input type="date" className="input text-xs sm:text-sm" required value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label="Start Time">
            <input type="time" className="input text-xs sm:text-sm" required value={f.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </Field>
          <Field label="End Date" optional>
            <input type="date" className="input text-xs sm:text-sm" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </Field>
          <Field label="End Time" optional>
            <input type="time" className="input text-xs sm:text-sm" value={f.endTime} onChange={(e) => set("endTime", e.target.value)} />
          </Field>
        </div>

        <Field label="Category">
          <select required className="input text-xs sm:text-sm" value={f.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Select a category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Payment Amount">
            <input required type="number" min="1" step="0.01" className="input text-xs sm:text-sm" placeholder="e.g. 50" value={f.paymentAmount || ""}
              onChange={(e) => set("paymentAmount", e.target.value)} />
          </Field>
          <Field label="Currency">
            <select required className="input text-xs sm:text-sm" value={f.currency} onChange={(e) => set("currency", e.target.value)}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </Field>
        </div>

        <div>
          <label className="label text-xs sm:text-sm flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1">
              Task Image <span className="text-rose-500 font-bold" title="Required field">*</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">PNG, JPG, GIF or WebP up to 10MB</span>
          </label>
          {f.image ? (
            <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <img src={f.image} alt="preview" className="w-full max-h-72 object-cover" />
              <button type="button" onClick={() => set("image", "")}
                className="absolute top-2.5 right-2.5 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 shadow-md transition">
                <X size={15} />
              </button>
            </div>
          ) : (
            <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`mt-2 border-2 border-dashed rounded-xl p-6 sm:p-10 text-center cursor-pointer transition
                ${dragOver ? "border-brand-500 bg-brand-50/40 dark:bg-brand-900/20" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}>
              <Upload className="mx-auto text-slate-400" size={28} />
              <div className="mt-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Upload a task image or drag and drop</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Clear photos help workers understand what needs doing</div>
              <input ref={fileRef} hidden type="file" accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <button className="btn-primary flex-1 py-2.5 text-xs sm:text-sm font-bold shadow-soft" disabled={loading}>
            {loading ? "Posting…" : "Post Task"}
          </button>
          <button type="button" onClick={() => nav(-1)} className="btn-ghost flex-1 py-2.5 text-xs sm:text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, optional, children }) {
  return (
    <div>
      <label className="label text-xs sm:text-sm">
        {label} {optional ? <span className="text-slate-400 font-normal text-xs">(Optional)</span> : <span className="text-rose-500 font-bold">*</span>}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
