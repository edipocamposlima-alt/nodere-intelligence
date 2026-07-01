"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyThemeSettings, persistAndApplyThemeSettings, readThemeSettings, type NodereThemeMode } from "@/lib/theme";

type Theme = NodereThemeMode;

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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = readThemeSettings();
    setThemeState(saved.mode);
    setResolvedTheme(applyThemeSettings(saved));
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      const saved = readThemeSettings();
      setThemeState(saved.mode);
      setResolvedTheme(applyThemeSettings(saved));
    };
    window.addEventListener("storage", syncTheme);
    window.addEventListener("nodere:theme-change", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("nodere:theme-change", syncTheme);
    };
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const listener = () => setResolvedTheme(applyThemeSettings(readThemeSettings()));
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    setTheme: (newTheme) => {
      setThemeState(newTheme);
      const { resolved } = persistAndApplyThemeSettings({ mode: newTheme });
      setResolvedTheme(resolved);
    }
  }), [resolvedTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
