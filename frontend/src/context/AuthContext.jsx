import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { getSocket, disconnectSocket } from "../services/socket";

// === AuthContext ===
// Holds the JWT + user. Re-fetches /users/me on every mount so a page refresh
// shows the latest profile (no stale cache). Also (re)connects the realtime
// socket whenever the token changes.
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hh_user")); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("hh_token"));
  const [booting, setBooting] = useState(!!localStorage.getItem("hh_token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) { localStorage.setItem("hh_token", token); getSocket(); }
    else { localStorage.removeItem("hh_token"); disconnectSocket(); }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const s = getSocket();
    if (!s) return;
    const onBlocked = () => {
      sessionStorage.setItem("hh_blocked", "1");
      setToken(null);
      setUser(null);
      disconnectSocket();
      window.location.replace("/login?blocked=1");
    };
    const onMaintenance = (payload) => {
      // Admins keep working — everyone else is logged out with the friendly banner.
      if (user?.role === "admin") return;
      sessionStorage.setItem("hh_maintenance_msg", payload?.message || "The platform is under maintenance.");
      setToken(null);
      setUser(null);
      disconnectSocket();
      window.location.replace("/login?maintenance=1");
    };
    s.on("account:blocked", onBlocked);
    s.on("maintenance:on", onMaintenance);
    return () => {
      s.off("account:blocked", onBlocked);
      s.off("maintenance:on", onMaintenance);
    };
  }, [token, user?.role]);

  useEffect(() => {
    if (user) localStorage.setItem("hh_user", JSON.stringify(user));
    else localStorage.removeItem("hh_user");
  }, [user]);

  useEffect(() => {
    if (!token) { setBooting(false); return; }
    api.get("/users/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => { setToken(null); setUser(null); })
      .finally(() => setBooting(false));
  }, []); // eslint-disable-line

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (data.requireOtp) return { requireOtp: true, email: data.email };
      setToken(data.token); setUser(data.user);
      return { user: data.user };
    } finally { setLoading(false); }
  };

  const signup = async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    if (data.token) { setToken(data.token); setUser(data.user); }
    return data;
  };
  const verifyOtp = async (email, otp) => {
    const { data } = await api.post("/auth/verify-otp", { email, otp });
    setToken(data.token); setUser(data.user);
    return data;
  };
  const adminLogin = async (email, password) => {
    const { data } = await api.post("/admin/login", { email, password });
    setToken(data.token); setUser(data.user);
    return data;
  };
  const forgotPassword = (email) => api.post("/auth/forgot-password", { email });
  const resetPassword = (payload) => api.post("/auth/reset-password", payload);
  const refreshUser = async () => {
    const { data } = await api.get("/users/me");
    setUser(data.user);
    return data.user;
  };
  const logout = () => { setToken(null); setUser(null); disconnectSocket(); };

  return (
    <AuthCtx.Provider value={{
      user, token, loading, booting,
      login, signup, verifyOtp, adminLogin,
      forgotPassword, resetPassword, refreshUser,
      logout, setUser,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}
