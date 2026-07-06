import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { MapPin, RefreshCw, Locate, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// ! Fix Leaflet's default marker URLs in a Vite bundle
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const meIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,.35)"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});

// Fallback center so the page never renders blank even when geolocation
// is denied or unavailable (New Delhi coords).
const FALLBACK = { lat: 28.6139, lng: 77.209 };

// === Nearby Tasks ===
// Interactive Leaflet map. Includes an address search box (moved here from
// Feed) that geocodes with Nominatim and re-centers the map on the result.
export default function Nearby() {
  const [coords, setCoords] = useState(FALLBACK);
  const [radius, setRadius] = useState(25);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState("");
  const [addr, setAddr] = useState("");
  const [searching, setSearching] = useState(false);
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const nav = useNavigate();

  const locate = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast("Using default map center", { icon: "📍" }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };
  useEffect(() => { locate(); }, []);

  const load = () => {
    if (!coords) return;
    setLoading(true);
    api.get("/tasks/nearby", { params: { ...coords, radiusKm: radius } })
      .then(({ data }) => setTasks(data.tasks || []))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [coords, radius]);

  useEffect(() => {
    if (!coords) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`,
      { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setCity(d?.address?.city || d?.address?.town || d?.address?.village || d?.address?.state || ""))
      .catch(() => {});
  }, [coords]);

  // ~ Address search — geocodes then re-centers the map ~
  const searchAddress = async (e) => {
    e?.preventDefault();
    const q = addr.trim();
    if (!q) return;
    setSearching(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } });
      const arr = await r.json();
      if (!arr?.[0]) { toast.error("Location not found"); return; }
      setCoords({ lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) });
      toast.success(`Centered on ${arr[0].display_name.split(",").slice(0, 2).join(", ")}`);
    } catch { toast.error("Search failed"); }
    finally { setSearching(false); }
  };

  const title = useMemo(() => city ? `Tasks near ${city}` : "Tasks near you", [city]);
  const withCoords = tasks.filter((t) => t.lat != null && t.lng != null);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { zoomControl: true }).setView([coords.lat, coords.lng], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);
    return () => { map.remove(); mapRef.current = null; layerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    map.setView([coords.lat, coords.lng], map.getZoom() || 12);
    layer.clearLayers();
    L.marker([coords.lat, coords.lng], { icon: meIcon }).addTo(layer).bindPopup("You are here");
    L.circle([coords.lat, coords.lng], {
      radius: radius * 1000,
      color: "#3b82f6",
      fillColor: "#3b82f6",
      fillOpacity: 0.05,
    }).addTo(layer);
    withCoords.forEach((t) => {
      const marker = L.marker([t.lat, t.lng]).addTo(layer);
      const el = document.createElement("div");
      el.className = "text-sm";
      el.innerHTML = `<div style="font-weight:700">${escapeHtml(t.title)}</div><div style="font-size:12px;color:#64748b">${escapeHtml(t.category || "Other")}${t.distanceKm != null ? ` · ${t.distanceKm} km` : ""}</div><div style="margin-top:4px">${escapeHtml(t.location || "")}</div><button style="margin-top:8px;color:#1d4ed8;font-weight:700">View task →</button>`;
      el.querySelector("button")?.addEventListener("click", () => nav(`/dashboard/feed?taskId=${t._id}`));
      marker.bindPopup(el);
    });
    setTimeout(() => map.invalidateSize(), 80);
  }, [coords, radius, withCoords, nav]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Nearby Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400">Discover tasks near your location</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="input h-10 w-auto">
            {[5, 10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} km</option>)}
          </select>
          <button onClick={locate} className="btn-ghost text-sm py-2"><Locate size={14} /> Re-locate</button>
          <button onClick={load} className="btn-primary text-sm py-2"><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {/* === Address search bar (moved here from Feed) === */}
      <form onSubmit={searchAddress} className="card p-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={addr} onChange={(e) => setAddr(e.target.value)}
            placeholder="Search by address (e.g., Dehradun, Downtown Seattle)"
            className="input pl-9 h-10" />
        </div>
        <button disabled={searching} className="btn-primary text-sm py-2 whitespace-nowrap">
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      <div className="card p-3 text-sm flex items-center gap-2 text-slate-600 dark:text-slate-300">
        <MapPin size={14} /> {`${title} (${tasks.length} found · ${withCoords.length} on map)`}
      </div>

      {/* ====== Map ====== */}
      <div className="card overflow-hidden h-[460px] min-h-[460px] relative z-0">
        <div ref={mapEl} className="h-full w-full min-h-[460px]" />
      </div>

      {/* ====== List below ====== */}
      <h2 className="font-bold text-slate-800 dark:text-white">Tasks Near You</h2>
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-slate-500">No tasks nearby. Try widening the radius or searching another location.</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {tasks.map((t) => (
            <button key={t._id} onClick={() => nav(`/dashboard/feed?taskId=${t._id}`)}
              className="card overflow-hidden flex flex-col text-left hover:shadow-soft transition group">
              {(t.image || t.picture) && (
                <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img src={t.image || t.picture} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{t.category || "Other"}</span>
                  {t.distanceKm != null && (
                    <span className="text-xs text-brand-700 dark:text-brand-300 font-bold">{t.distanceKm} km</span>
                  )}
                </div>
                <h3 className="mt-2 font-bold text-slate-900 dark:text-white">{t.title}</h3>
                <div className="text-xs text-slate-500 mt-2 flex items-center gap-1"><MapPin size={12} /> {t.location}</div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-sm font-extrabold text-slate-900 dark:text-white">
                  {Number(t.paymentAmount || 0).toFixed(2)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
}
