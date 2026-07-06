// !! Axios instance — base URL comes from VITE_API_URL
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("hh_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ! Force-logout on blocked accounts. The backend returns
//   { code: "USER_BLOCKED" } on a 403 the moment an admin flips the switch;
//   this interceptor wipes the session and bounces to /login with a flag so
//   the login page can show the explanation banner.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const code = err?.response?.data?.code;
    if (err?.response?.status === 403 && code === "USER_BLOCKED") {
      try {
        localStorage.removeItem("hh_token");
        localStorage.removeItem("hh_user");
        sessionStorage.setItem("hh_blocked", "1");
      } catch {}
      if (!/\/login|\/admin\/login/.test(window.location.pathname)) {
        window.location.replace("/login?blocked=1");
      }
    }
    return Promise.reject(err);
  }
);

export default api;
