import { createContext, useContext, useEffect, useMemo, useState } from "react";

// === ThemeContext ===
// Supports "light" | "dark" | "system". `resolved` is the actual class applied
// to <html>. Persists choice in localStorage under hh_theme.
const ThemeCtx = createContext(null);
export const useTheme = () => useContext(ThemeCtx);

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("hh_theme") || "system");

  const resolved = useMemo(
    () => (theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme),
    [theme]
  );

  useEffect(() => {
    const root = document.documentElement;
    if (resolved === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("hh_theme", theme);
  }, [resolved, theme]);

  // ~ react to OS theme changes when "system" is selected ~
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const root = document.documentElement;
      mq.matches ? root.classList.add("dark") : root.classList.remove("dark");
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [theme]);

  const toggle = () => setTheme((t) => (resolved === "dark" ? "light" : "dark"));
  return (
    <ThemeCtx.Provider value={{ theme, setTheme, toggle, resolved }}>
      {children}
    </ThemeCtx.Provider>
  );
}
