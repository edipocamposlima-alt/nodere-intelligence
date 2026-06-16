"use client";

import { useEffect } from "react";
import { getPublicSettings } from "@/lib/api";

const STORAGE_KEY = "nodere_settings";

const themePresets: Record<string, { primary: string; cyan: string; panel: string; ink: string; line: string }> = {
  "NODERI Verde": { primary: "#03624C", cyan: "#00DF82", panel: "#111827", ink: "#081018", line: "rgba(255,255,255,0.08)" },
  "Atlântico premium": { primary: "#0284C7", cyan: "#22D3EE", panel: "#071827", ink: "#020817", line: "#164E63" },
  "Azul executivo": { primary: "#2563EB", cyan: "#06B6D4", panel: "#0D1B2A", ink: "#050A14", line: "#1D3557" },
  "Executivo Escuro": { primary: "#2DD4BF", cyan: "#38BDF8", panel: "#0D1624", ink: "#040812", line: "#223047" },
  "Preto absoluto": { primary: "#3B82F6", cyan: "#06B6D4", panel: "#030712", ink: "#000000", line: "#1F2937" },
  "Aço premium": { primary: "#64748B", cyan: "#38BDF8", panel: "#111827", ink: "#030712", line: "#334155" },
  "Verde Performance": { primary: "#16C784", cyan: "#22D3EE", panel: "#071B18", ink: "#04100E", line: "#174239" },
  "Verde comercial": { primary: "#10B981", cyan: "#2DD4BF", panel: "#06251F", ink: "#03110E", line: "#14532D" },
  "Esmeralda forte": { primary: "#059669", cyan: "#10B981", panel: "#052E2B", ink: "#021412", line: "#047857" },
  "Roxo SaaS": { primary: "#8B5CF6", cyan: "#38BDF8", panel: "#111029", ink: "#070716", line: "#2B2852" },
  "Roxo tecnológico": { primary: "#A855F7", cyan: "#60A5FA", panel: "#17102A", ink: "#080512", line: "#3B2463" },
  "Violeta sólido": { primary: "#7C3AED", cyan: "#A78BFA", panel: "#160B2E", ink: "#070316", line: "#4C1D95" },
  "Laranja performance": { primary: "#F97316", cyan: "#22D3EE", panel: "#1F1307", ink: "#0F0803", line: "#7C2D12" },
  "Solar executivo": { primary: "#F59E0B", cyan: "#F97316", panel: "#211407", ink: "#0F0702", line: "#92400E" },
  "Vermelho conversão": { primary: "#EF4444", cyan: "#F97316", panel: "#220A0A", ink: "#100303", line: "#7F1D1D" },
  "Magenta premium": { primary: "#EC4899", cyan: "#A78BFA", panel: "#201020", ink: "#100712", line: "#831843" },
  "Ciano neon": { primary: "#03624C", cyan: "#00DF82", panel: "#111827", ink: "#081018", line: "#243244" },
  "Grafite claro": { primary: "#334155", cyan: "#2563EB", panel: "#FFFFFF", ink: "#F1F5F9", line: "#CBD5E1" },
  "Alto contraste": { primary: "#FACC15", cyan: "#00E5FF", panel: "#000000", ink: "#000000", line: "#FFFFFF" }
};

type StoredSettings = {
  theme?: string;
  colorPrimary?: string;
  mode?: "dark" | "light";
  fontFamily?: string;
  layoutDensity?: "ultraCompact" | "compact" | "comfortable" | "executive" | "large";
  cardStyle?: "cards" | "list" | "glass" | "solid" | "borderless" | "elevated";
};

function applyTheme(settings: StoredSettings) {
  const preset = themePresets[settings.theme || "NODERI Verde"] || themePresets["NODERI Verde"];
  const root = document.documentElement;

  root.style.setProperty("--nodere-primary", settings.colorPrimary || preset.primary);
  root.style.setProperty("--color-cyan", preset.cyan);
  root.style.setProperty("--color-panel", settings.mode === "light" ? "#FFFFFF" : preset.panel);
  root.style.setProperty("--color-ink", settings.mode === "light" ? "#F6F8FC" : preset.ink);
  root.style.setProperty("--color-line", settings.mode === "light" ? "#D9E2EF" : preset.line);
  root.dataset.theme = settings.mode || "dark";
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
