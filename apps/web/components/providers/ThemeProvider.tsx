"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyThemeSettings, persistAndApplyThemeSettings, readThemeSettings, type NodereThemeMode } from "@/lib/theme";
import { getPublicSettings } from "@/lib/api";

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
    getPublicSettings()
      .then((payload) => {
        if (!payload.preferences || Object.keys(payload.preferences).length === 0) return;
        const current = readThemeSettings();
        const remoteUpdatedAt = typeof payload.preferences.themeUpdatedAt === "string" ? Date.parse(payload.preferences.themeUpdatedAt) : 0;
        const localUpdatedAt = typeof current.themeUpdatedAt === "string" ? Date.parse(current.themeUpdatedAt) : 0;
        if (localUpdatedAt > remoteUpdatedAt && remoteUpdatedAt > 0) return;
        const { settings, resolved } = persistAndApplyThemeSettings({ ...current, ...payload.preferences });
        setThemeState(settings.mode);
        setResolvedTheme(resolved);
      })
      .catch(() => undefined);
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
