import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Camera, Lock, Mail } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// === Settings ===
// Cover image, profile picture, name, locked email, phone, bio.
// All images are stored as base64 data URLs in MongoDB.
export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    profilePicture: user?.profilePicture || "",
    coverImage: user?.coverImage || "",
  });
  const [loading, setLoading] = useState(false);
  const avatarRef = useRef(null);
  const coverRef = useRef(null);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const readFile = (file, key, maxMb = 5) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return toast.error("JPG, PNG or WebP only");
    if (file.size > maxMb * 1024 * 1024) return toast.error(`Max ${maxMb}MB`);
    const r = new FileReader();
    r.onload = () => set(key, r.result);
    r.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await api.put("/users/me", f);
      setUser(data.user);
      toast.success("Profile updated");
    } catch { toast.error("Failed to update"); }
    finally { setLoading(false); }
  };

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500">Manage your profile and account preferences</p>
      </div>

      <form onSubmit={submit} className="card p-6 lg:p-8 space-y-8">
        {/* ===== Profile & Cover ===== */}
        <section>
          <h2 className="font-bold text-slate-800 dark:text-white">Profile & Cover</h2>

          {/* cover */}
          <div className="mt-3 relative h-44 rounded-xl overflow-hidden bg-gradient-to-r from-brand-100 to-brand-50 dark:from-slate-800 dark:to-slate-700">
            {f.coverImage && <img src={f.coverImage} alt="cover" className="w-full h-full object-cover" />}
            <button type="button" onClick={() => coverRef.current?.click()}
              className="absolute bottom-3 right-3 btn-primary text-sm py-2">
              <Camera size={16} /> Change cover
            </button>
            <input hidden ref={coverRef} type="file" accept="image/*"
              onChange={(e) => readFile(e.target.files?.[0], "coverImage", 8)} />
          </div>

          {/* avatar */}
          <div className="mt-5 flex items-center gap-4">
            {f.profilePicture ? (
              <img src={f.profilePicture} alt="avatar" className="h-20 w-20 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 grid place-items-center font-extrabold text-xl">
                {initials || <Camera size={22} />}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button type="button" onClick={() => avatarRef.current?.click()} className="btn-primary text-sm py-2">
                  <Camera size={16} /> Change
                </button>
                <button type="button" onClick={() => set("profilePicture", "")}
                  className="btn-ghost text-sm py-2" disabled={!f.profilePicture}>
                  Remove
                </button>
                <input hidden ref={avatarRef} type="file" accept="image/*"
                  onChange={(e) => readFile(e.target.files?.[0], "profilePicture", 5)} />
              </div>
              <div className="text-xs text-slate-500">JPG, PNG, WebP up to 5MB</div>
            </div>
          </div>
        </section>

        {/* ===== Personal info ===== */}
        <section>
          <h2 className="font-bold text-slate-800 dark:text-white">Personal Information</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            <Field label="First Name">
              <input className="input" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </Field>
            <Field label="Last Name">
              <input className="input" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </Field>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label className="label flex items-center gap-1"><Mail size={14} /> Email Address</label>
              <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                <Lock size={12} /> Locked
              </span>
            </div>
            <input className="input mt-1 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" disabled value={user?.email} />
            <p className="text-xs text-slate-500 mt-1">
              Your verified email cannot be changed. To use a different email, please delete your account and create a new one.
            </p>
          </div>

          <div className="mt-4">
            <Field label="Phone Number">
              <input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Bio">
              <textarea className="input min-h-[110px]" value={f.bio}
                onChange={(e) => set("bio", e.target.value)} maxLength={500} />
            </Field>
          </div>
        </section>

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
