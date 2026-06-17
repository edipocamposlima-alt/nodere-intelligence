"use client";

import { useEffect } from "react";
import { getPublicSettings } from "@/lib/api";

const STORAGE_KEY = "nodere_settings";

type StoredSettings = {
  theme?: "Sistema" | "Claro" | "Escuro" | string;
  colorPrimary?: string;
  mode?: "dark" | "light" | "system";
  fontFamily?: string;
  layoutDensity?: "ultraCompact" | "compact" | "comfortable" | "executive" | "large";
  cardStyle?: "cards" | "list" | "glass" | "solid" | "borderless" | "elevated";
};

function applyTheme(settings: StoredSettings) {
  const root = document.documentElement;
  const requestedMode =
    settings.mode === "system" || settings.theme === "Sistema"
      ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
      : settings.mode === "light" || settings.theme === "Claro"
        ? "light"
        : "dark";

  root.style.setProperty("--nodere-primary", "#03624C");
  root.style.setProperty("--color-cyan", requestedMode === "light" ? "#03624C" : "#00DF82");
  root.style.setProperty("--color-panel", requestedMode === "light" ? "#FFFFFF" : "#111827");
  root.style.setProperty("--color-ink", requestedMode === "light" ? "#F8FAFC" : "#081018");
  root.style.setProperty("--color-line", requestedMode === "light" ? "#E2E8F0" : "#243244");
  root.dataset.theme = requestedMode;
  root.classList.toggle("light", requestedMode === "light");
  root.classList.toggle("dark", requestedMode === "dark");
  root.dataset.density = settings.layoutDensity || "compact";
  root.dataset.cardStyle = settings.cardStyle || "cards";
  const font = settings.fontFamily === "System default" ? "system-ui" : settings.fontFamily || "Inter";
  document.body.style.fontFamily = `${font}, Inter, system-ui, sans-serif`;
}

function readStoredSettings() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? (JSON.parse(saved) as StoredSettings) : {};
}

function applyStoredTheme() {
  applyTheme(readStoredSettings());
}

export function ThemeRuntime() {
  useEffect(() => {
    try {
      applyStoredTheme();
      getPublicSettings()
        .then((payload) => {
          const settings = { ...readStoredSettings(), ...(payload.preferences ?? {}) } as StoredSettings;
          if (!["Claro", "Escuro", "Sistema"].includes(String(settings.theme || ""))) settings.theme = "Escuro";
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
          applyTheme(settings);
        })
        .catch(() => undefined);
      window.addEventListener("storage", applyStoredTheme);
      window.addEventListener("nodere:theme-change", applyStoredTheme);
      return () => {
        window.removeEventListener("storage", applyStoredTheme);
        window.removeEventListener("nodere:theme-change", applyStoredTheme);
      };
    } catch {
      return undefined;
    }
  }, []);

  return null;
}
