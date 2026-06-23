import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Protected({ children, role }) {
  const { user, token, booting } = useAuth();
  if (booting) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    );
  }
  if (!token || !user) return <Navigate to={role === "admin" ? "/admin/login" : "/login"} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
