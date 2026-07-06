import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, Check } from "lucide-react";

// === ImageCropper ===
// Lightweight canvas-based crop/resize modal (no external deps).
// Given a source image, shows a fixed-aspect crop window (target width/height
// in output pixels). User can drag to reposition and zoom in/out; final crop
// is rendered to an offscreen canvas at exactly `outWidth × outHeight` and
// returned as a data URL to the parent.
//
// Props:
//   src        base64 or URL of the source image
//   outWidth   final output pixel width
//   outHeight  final output pixel height
//   circle     draw circular preview (avatars) — output is still square
//   onCancel() / onConfirm(dataUrl)
export default function ImageCropper({ src, outWidth, outHeight, circle = false, onCancel, onConfirm }) {
  const boxRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef({ dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  // Frame (preview) size — scaled to fit the output aspect ratio in ~380px width.
  const aspect = outWidth / outHeight;
  const frameW = Math.min(380, Math.round(320 * Math.max(1, aspect)));
  const frameH = Math.round(frameW / aspect);

  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // Fit-to-cover on load
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const cover = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight);
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setMinScale(cover);
      setScale(cover);
      setPos({ x: (frameW - img.naturalWidth * cover) / 2, y: (frameH - img.naturalHeight * cover) / 2 });
      imgRef.current = img;
    };
    img.src = src;
  }, [src, frameW, frameH]);

  const clamp = (p, s) => {
    const w = natural.w * s, h = natural.h * s;
    return {
      x: Math.min(0, Math.max(frameW - w, p.x)),
      y: Math.min(0, Math.max(frameH - h, p.y)),
    };
  };

  const onDown = (e) => {
    dragRef.current = { dragging: true, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };
  const onMove = (e) => {
    const d = dragRef.current; if (!d.dragging) return;
    setPos(clamp({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) }, scale));
  };
  const onUp = () => { dragRef.current.dragging = false; };

  useEffect(() => {
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  const bumpScale = (delta) => {
    const next = Math.max(minScale, Math.min(minScale * 4, scale + delta));
    setScale(next); setPos((p) => clamp(p, next));
  };

  const confirm = () => {
    if (!imgRef.current) return;
    const cvs = document.createElement("canvas");
    cvs.width = outWidth; cvs.height = outHeight;
    const ctx = cvs.getContext("2d");
    // Map preview frame → output pixels.
    const sx = -pos.x / scale;
    const sy = -pos.y / scale;
    const sw = frameW / scale;
    const sh = frameH / scale;
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, outWidth, outHeight);
    onConfirm(cvs.toDataURL("image/jpeg", 0.9));
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] grid place-items-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md shadow-soft">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white">Crop & resize</h3>
            <p className="text-xs text-slate-500">Output size: <b>{outWidth}×{outHeight}px</b> — drag to reposition, zoom to fit.</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={18}/></button>
        </div>
        <div className="p-4 grid place-items-center">
          <div
            ref={boxRef}
            onMouseDown={onDown} onMouseMove={onMove}
            style={{ width: frameW, height: frameH }}
            className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 select-none cursor-move
                        ${circle ? "rounded-full" : "rounded-xl"} border-2 border-brand-500`}
          >
            {imgRef.current && (
              <img
                src={src} alt="crop"
                draggable={false}
                style={{
                  position: "absolute",
                  left: pos.x, top: pos.y,
                  width: natural.w * scale, height: natural.h * scale,
                  maxWidth: "none",
                }}
              />
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={() => bumpScale(-0.1)} className="btn-ghost text-sm py-2"><ZoomOut size={14}/></button>
            <input type="range" min={minScale} max={minScale * 4} step={0.01}
              value={scale} onChange={(e) => { const s = +e.target.value; setScale(s); setPos((p) => clamp(p, s)); }}
              className="w-40 accent-brand-600"/>
            <button onClick={() => bumpScale(0.1)} className="btn-ghost text-sm py-2"><ZoomIn size={14}/></button>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost text-sm py-2">Cancel</button>
          <button onClick={confirm} className="btn-primary text-sm py-2"><Check size={14}/> Use image</button>
        </div>
      </div>
    </div>
  );
}
