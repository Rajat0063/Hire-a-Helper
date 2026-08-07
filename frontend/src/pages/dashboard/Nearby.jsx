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
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&accept-language=en`,
      { headers: { Accept: "application/json", "Accept-Language": "en" } })
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
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}&accept-language=en`,
        { headers: { Accept: "application/json", "Accept-Language": "en" } });
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Nearby Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Discover tasks near your location in real time</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="input h-10 w-auto text-sm">
            {[5, 10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} km</option>)}
          </select>
          <button onClick={locate} className="btn-ghost text-sm py-2 px-3 whitespace-nowrap"><Locate size={14} /> Re-locate</button>
          <button onClick={load} className="btn-primary text-sm py-2 px-3 whitespace-nowrap"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh</button>
        </div>
      </div>

      {/* === Address search bar (geocodes with Nominatim) === */}
      <form onSubmit={searchAddress} className="card p-2 sm:p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={addr} onChange={(e) => setAddr(e.target.value)}
            placeholder="Search by address or city (e.g., Seattle, Downtown, Dehradun)"
            className="input pl-10 h-10 text-sm w-full" />
        </div>
        <button disabled={searching} className="btn-primary text-sm py-2 px-4 whitespace-nowrap w-full sm:w-auto">
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      <div className="card p-3 text-xs sm:text-sm flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
        <MapPin size={15} className="text-brand-600 dark:text-brand-400 shrink-0" />
        <span className="truncate">{title} ({tasks.length} found · {withCoords.length} on map)</span>
      </div>

      {/* ====== Map ====== */}
      <div className="card overflow-hidden h-[360px] sm:h-[460px] min-h-[360px] sm:min-h-[460px] relative z-0">
        <div ref={mapEl} className="h-full w-full min-h-[360px] sm:min-h-[460px]" />
      </div>

      {/* ====== List below ====== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg sm:text-xl text-slate-800 dark:text-white">Tasks Near You</h2>
          {!loading && <span className="text-xs text-slate-500">{tasks.length} available</span>}
        </div>

        {loading ? (
          <NearbySkeleton />
        ) : tasks.length === 0 ? (
          <div className="card p-10 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 grid place-items-center mx-auto">
              <MapPin size={22} />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">No tasks nearby</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Try widening your search radius or entering a different address above to find more open opportunities.
            </p>
            <button onClick={() => setRadius(50)} className="btn-primary text-sm py-2 px-4 inline-flex mt-2">
              Expand radius to 50 km
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {tasks.map((t) => (
              <button key={t._id} onClick={() => nav(`/dashboard/feed?taskId=${t._id}`)}
                className="card overflow-hidden flex flex-col text-left hover:shadow-soft transition group">
                {(t.image || t.picture) && (
                  <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img src={t.image || t.picture} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  </div>
                )}
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[11px]">
                      {t.category || "Other"}
                    </span>
                    {t.distanceKm != null && (
                      <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 text-[11px] font-bold">
                        📍 ~{t.distanceKm} km
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2.5 font-bold text-base sm:text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                    {t.title}
                  </h3>
                  {t.description && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                      {t.description}
                    </p>
                  )}
                  <div className="text-xs text-slate-500 mt-2.5 flex items-center gap-1.5 truncate">
                    <MapPin size={13} className="shrink-0 text-slate-400" /> <span className="truncate">{t.location}</span>
                  </div>
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      ₹{Number(t.paymentAmount || 0).toFixed(2)}
                    </div>
                    <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:underline">
                      View details →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// === Skeleton Loading Component for Nearby Tasks ===
function NearbySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse" aria-label="Loading nearby tasks">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={`nearby-skel-${i}`} className="card overflow-hidden flex flex-col border border-slate-200/80 dark:border-slate-800">
          <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800" />
          <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3.5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-3.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded mt-1" />
            <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
}
