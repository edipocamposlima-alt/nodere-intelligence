"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {}
});

function resolveTheme(theme: Theme): "dark" | "light" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function readSavedTheme(): Theme {
  const direct = localStorage.getItem("nodere-theme") as Theme | null;
  if (direct === "dark" || direct === "light" || direct === "system") return direct;

  try {
    const settings = JSON.parse(localStorage.getItem("nodere_settings") || "{}") as { mode?: string; theme?: string };
    if (settings.mode === "dark" || settings.mode === "light" || settings.mode === "system") return settings.mode;
    if (settings.theme === "Claro") return "light";
    if (settings.theme === "Sistema") return "system";
  } catch {
    // Settings can be user-edited in localStorage; ignore malformed values.
  }

  return "dark";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const resolved = resolveTheme(theme);
  root.dataset.theme = resolved;
  root.classList.toggle("light", resolved === "light");
  root.classList.toggle("dark", resolved === "dark");
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = readSavedTheme();
    setThemeState(saved);
    setResolvedTheme(applyTheme(saved));
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const listener = () => setResolvedTheme(applyTheme("system"));
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    setTheme: (newTheme) => {
      setThemeState(newTheme);
      localStorage.setItem("nodere-theme", newTheme);
      setResolvedTheme(applyTheme(newTheme));
    }
  }), [resolvedTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
