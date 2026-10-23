import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "devwell-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem("atelier-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage may be unavailable; system preference still provides a usable default.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The selected theme remains active for this page even if it cannot be persisted.
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, setTheme, toggle };
}
