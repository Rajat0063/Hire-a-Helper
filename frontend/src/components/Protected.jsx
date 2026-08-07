import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Protected({ children, role }) {
  const { user, token, booting } = useAuth();
  
  // If we have token & user stored in localStorage, render children immediately while background revalidation finishes
  if (booting && (!token || !user)) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading…</div>
        </div>
      </div>
    );
  }
  if (!token || !user) return <Navigate to={role === "admin" ? "/admin/login" : "/login"} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
