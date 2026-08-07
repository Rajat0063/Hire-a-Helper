import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Camera, Lock, Mail, Phone, Check, Shield, KeyRound, Locate } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import ImageCropper from "../../components/ImageCropper";

// === Settings ===
// Cover/profile pictures, personal info, bio, phone verification (OTP).
// All images are stored as base64 strings in MongoDB so no object storage is
// required. After save we replace the user in AuthContext with the server's
// response — that's why the image persists across refresh.
export default function SettingsPage() {
  const { user, setUser, refreshUser } = useAuth();
  const [f, setF] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    address: user?.address || "",
    profilePicture: user?.profilePicture || "",
    coverImage: user?.coverImage || "",
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [passBusy, setPassBusy] = useState(false);

  // ~ phone verification flow ~
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);

  const avatarRef = useRef(null);
  const coverRef = useRef(null);
  // ~ crop modal state: { src, key: 'profilePicture'|'coverImage', outWidth, outHeight, circle } ~
  const [crop, setCrop] = useState(null);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const readFile = (file, key) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return toast.error("JPG, PNG or WebP only");
    if (file.size > 8 * 1024 * 1024) return toast.error("Max 8MB");
    const r = new FileReader();
    r.onload = () => {
      // Open the cropper with the size template for that slot.
      const preset = key === "profilePicture"
        ? { outWidth: 400, outHeight: 400, circle: true }
        : { outWidth: 1600, outHeight: 500, circle: false };
      setCrop({ src: r.result, key, ...preset });
    };
    r.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await api.put("/users/me", f);
      setUser(data.user);          // !! immediate state update from server
      await refreshUser();          // !! re-pull from /users/me so localStorage matches DB
      toast.success("Profile updated");
    } catch { toast.error("Failed to update"); }
    finally { setLoading(false); }
  };

  const sendOtp = async () => {
    if (!f.phone) return toast.error("Enter your phone number first");
    setOtpBusy(true);
    try {
      const { data } = await api.post("/auth/phone/send-otp", { phone: f.phone });
      setOtpSent(true);
      toast.success(data.devCode ? `OTP sent (dev: ${data.devCode})` : "OTP sent to your phone");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally { setOtpBusy(false); }
  };

  const verifyOtp = async () => {
    if (!otp) return;
    setOtpBusy(true);
    try {
      const { data } = await api.post("/auth/phone/verify-otp", { phone: f.phone, otp });
      setUser(data.user); setOtpSent(false); setOtp("");
      toast.success("Phone verified");
    } catch (e) {
      toast.error(e.response?.data?.message || "Invalid code");
    } finally { setOtpBusy(false); }
  };

  const changePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) return toast.error("Fill all password fields");
    if (passwords.newPassword.length < 6) return toast.error("Use at least 6 characters");
    if (passwords.newPassword !== passwords.confirm) return toast.error("Passwords do not match");
    setPassBusy(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to change password"); }
    finally { setPassBusy(false); }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`,
            { headers: { Accept: "application/json", "Accept-Language": "en" } }
          );
          const d = await r.json();
          const a = d?.address || {};
          const parts = [
            a.city || a.town || a.village || a.county || a.municipality,
            a.suburb || a.neighbourhood || a.district,
            a.state,
            a.country,
          ].filter(Boolean);
          const label = parts.slice(0, 3).join(", ") || d?.display_name?.split(",").slice(0, 3).join(", ") || "";
          if (label) set("address", label);
          toast.success(label ? `Address detected: ${label}` : "Coordinates captured");
        } catch {
          toast.error("Could not determine address");
        } finally {
          setLocating(false);
        }
      },
      () => {
        toast.error("Couldn't get location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  };

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your profile, pictures, and account preferences</p>
      </div>

      <form onSubmit={submit} className="card p-5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* ===== Profile & Cover ===== */}
        <section>
          <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Profile & Cover</h2>

          <div className="mt-3 relative h-36 sm:h-44 rounded-xl overflow-hidden bg-gradient-to-r from-brand-100 to-brand-50 dark:from-slate-800 dark:to-slate-700">
            {f.coverImage && <img src={f.coverImage} alt="cover" className="w-full h-full object-cover" />}
            <button type="button" onClick={() => coverRef.current?.click()}
              className="absolute bottom-3 right-3 btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-3 shadow-soft">
              <Camera size={15} /> Change cover
            </button>
            <input hidden ref={coverRef} type="file" accept="image/*"
              onChange={(e) => readFile(e.target.files?.[0], "coverImage")} />
          </div>
          <p className="text-xs text-slate-500 mt-2">Cover crops to <b>1600×500px</b> — you'll preview the exact size before saving.</p>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="shrink-0 self-start sm:self-auto">
              {f.profilePicture ? (
                <img src={f.profilePicture} alt="avatar" className="h-20 w-20 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-md" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 grid place-items-center font-extrabold text-xl shadow-md">
                  {initials || <Camera size={22} />}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => avatarRef.current?.click()} className="btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-3">
                  <Camera size={15} /> Change
                </button>
                <button type="button" onClick={() => set("profilePicture", "")} className="btn-ghost text-xs sm:text-sm py-1.5 sm:py-2 px-3" disabled={!f.profilePicture}>
                  Remove
                </button>
                <input hidden ref={avatarRef} type="file" accept="image/*"
                  onChange={(e) => readFile(e.target.files?.[0], "profilePicture")} />
              </div>
              <div className="text-xs text-slate-500">JPG / PNG / WebP up to 8MB — cropped to <b>400×400px</b> circle.</div>
            </div>
          </div>
        </section>

        {/* ===== Personal info ===== */}
        <section className="space-y-4">
          <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name">
              <input className="input text-sm" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </Field>
            <Field label="Last Name">
              <input className="input text-sm" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </Field>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="label flex items-center gap-1"><Mail size={14} /> Email Address</label>
              <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-[11px]">
                <Lock size={11} /> Locked
              </span>
            </div>
            <input className="input text-sm mt-1 bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-600 dark:text-slate-300" disabled value={user?.email || ""} />
            <p className="text-xs text-slate-500 mt-1">
              Your verified email cannot be changed. To use a different email, please create a new account.
            </p>
          </div>

          {/* phone + OTP verification */}
          <div>
            <div className="flex items-center justify-between">
              <label className="label flex items-center gap-1"><Phone size={14} /> Phone Number</label>
              {user?.phoneVerified
                ? <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[11px]"><Check size={11} /> Verified</span>
                : <span className="chip bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[11px]"><Shield size={11} /> Unverified</span>}
            </div>
            <div className="mt-1 flex gap-2">
              <input className="input text-sm" placeholder="e.g. +1 555 0123" value={f.phone}
                onChange={(e) => set("phone", e.target.value)} />
              <button type="button" onClick={sendOtp} disabled={otpBusy || !f.phone}
                className="btn-ghost text-xs sm:text-sm py-2 px-3 whitespace-nowrap">Send OTP</button>
            </div>
            {otpSent && (
              <div className="mt-2 flex gap-2">
                <input className="input text-sm" placeholder="Enter 6-digit code" value={otp} maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                <button type="button" onClick={verifyOtp} disabled={otpBusy || otp.length !== 6}
                  className="btn-primary text-xs sm:text-sm py-2 px-4 whitespace-nowrap">Verify</button>
              </div>
            )}
          </div>

          <div>
            <Field label="Address">
              <div className="flex flex-col sm:flex-row gap-2">
                <input className="input text-sm flex-1" placeholder="City, State / Region" value={f.address} onChange={(e) => set("address", e.target.value)} />
                <button type="button" onClick={useMyLocation} disabled={locating}
                  className="btn-ghost text-xs sm:text-sm py-2 px-3 whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5">
                  <Locate size={14} className={locating ? "animate-spin text-brand-600" : ""} />
                  {locating ? "Locating…" : "Use My GPS"}
                </button>
              </div>
            </Field>
          </div>

          <div>
            <Field label="Bio">
              <textarea className="input text-sm min-h-[100px]" placeholder="Tell others a bit about your skills and background..." value={f.bio}
                onChange={(e) => set("bio", e.target.value)} maxLength={500} />
            </Field>
          </div>
        </section>

        <button className="btn-primary w-full py-2.5 text-sm sm:text-base font-bold shadow-soft" disabled={loading}>
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <section className="card p-5 sm:p-6 lg:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-200 grid place-items-center shrink-0"><KeyRound size={18} /></div>
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Change Password</h2>
            <p className="text-xs text-slate-500">Update your password without changing your email.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="password" className="input text-sm" placeholder="Current password" value={passwords.currentPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))} />
          <input type="password" className="input text-sm" placeholder="New password" value={passwords.newPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} />
          <input type="password" className="input text-sm" placeholder="Confirm new password" value={passwords.confirm}
            onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} />
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={changePassword} disabled={passBusy} className="btn-primary text-xs sm:text-sm py-2 px-4 w-full sm:w-auto">
            {passBusy ? "Updating…" : "Update Password"}
          </button>
        </div>
      </section>

      {crop && (
        <ImageCropper
          src={crop.src}
          outWidth={crop.outWidth}
          outHeight={crop.outHeight}
          circle={crop.circle}
          onCancel={() => setCrop(null)}
          onConfirm={(dataUrl) => { set(crop.key, dataUrl); setCrop(null); }}
        />
      )}
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
