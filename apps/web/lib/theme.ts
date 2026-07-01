export type NodereThemeMode = "dark" | "light" | "system";

export type NodereThemeSettings = {
  theme: "Escuro" | "Claro" | "Sistema";
  mode: NodereThemeMode;
  colorPrimary: string;
  fontFamily: string;
  fontSize: "small" | "normal" | "large";
  layoutDensity: "ultraCompact" | "compact" | "comfortable" | "executive" | "large";
  cardStyle: "cards" | "list" | "glass" | "solid" | "borderless" | "elevated";
  backendUrl?: string;
  themeUpdatedAt?: string;
};

export const THEME_STORAGE_KEY = "nodere_settings";
export const THEME_DIRECT_KEY = "nodere-theme";
export const THEME_LEGACY_KEY = "nodere_theme";
export const USER_PREFS_KEY = "nodere_user_preferences";

export const defaultThemeSettings: NodereThemeSettings = {
  theme: "Escuro",
  mode: "dark",
  colorPrimary: "#03624C",
  fontFamily: "Inter",
  fontSize: "normal",
  layoutDensity: "compact",
  cardStyle: "cards"
};

function themeLabelFromMode(mode: NodereThemeMode): NodereThemeSettings["theme"] {
  if (mode === "light") return "Claro";
  if (mode === "system") return "Sistema";
  return "Escuro";
}

function modeFromThemeLabel(theme?: unknown): NodereThemeMode | undefined {
  if (theme === "Claro") return "light";
  if (theme === "Sistema") return "system";
  if (theme === "Escuro") return "dark";
  return undefined;
}

export function normalizeThemeMode(value?: unknown): NodereThemeMode | undefined {
  if (value === "light" || value === "dark" || value === "system") return value;
  return modeFromThemeLabel(value);
}

export function normalizeThemeSettings(input: unknown = {}): NodereThemeSettings {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const mode = normalizeThemeMode(data.mode) || modeFromThemeLabel(data.theme) || defaultThemeSettings.mode;
  return {
    ...defaultThemeSettings,
    ...data,
    theme: themeLabelFromMode(mode),
    mode,
    colorPrimary: "#03624C",
    fontFamily: typeof data.fontFamily === "string" && data.fontFamily ? data.fontFamily : defaultThemeSettings.fontFamily,
    fontSize: data.fontSize === "small" || data.fontSize === "large" ? data.fontSize : "normal",
    layoutDensity: ["ultraCompact", "compact", "comfortable", "executive", "large"].includes(String(data.layoutDensity))
      ? data.layoutDensity as NodereThemeSettings["layoutDensity"]
      : defaultThemeSettings.layoutDensity,
    cardStyle: ["cards", "list", "glass", "solid", "borderless", "elevated"].includes(String(data.cardStyle))
      ? data.cardStyle as NodereThemeSettings["cardStyle"]
      : defaultThemeSettings.cardStyle
  };
}

export function resolveThemeMode(mode: NodereThemeMode): "dark" | "light" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function readThemeSettings(): NodereThemeSettings {
  if (typeof window === "undefined") return defaultThemeSettings;
  try {
    const saved = JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) || "{}") as Record<string, unknown>;
    const direct = normalizeThemeMode(window.localStorage.getItem(THEME_DIRECT_KEY));
    const legacy = normalizeThemeMode(window.localStorage.getItem(THEME_LEGACY_KEY));
    const prefs = JSON.parse(window.localStorage.getItem(USER_PREFS_KEY) || "{}") as Record<string, unknown>;
    return normalizeThemeSettings({
      ...saved,
      mode: normalizeThemeMode(saved.mode) || modeFromThemeLabel(saved.theme) || direct || legacy || normalizeThemeMode(prefs.theme)
    });
  } catch {
    return defaultThemeSettings;
  }
}

export function writeThemeSettings(next: unknown) {
  if (typeof window === "undefined") return normalizeThemeSettings(next);
  const current = readThemeSettings();
  const data = (next && typeof next === "object" ? next : {}) as Record<string, unknown>;
  const normalized = normalizeThemeSettings({ ...current, ...data, themeUpdatedAt: new Date().toISOString() });
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(normalized));
  window.localStorage.setItem(THEME_DIRECT_KEY, normalized.mode);
  window.localStorage.setItem(THEME_LEGACY_KEY, normalized.mode);
  try {
    const prefs = JSON.parse(window.localStorage.getItem(USER_PREFS_KEY) || "{}") as Record<string, unknown>;
    window.localStorage.setItem(USER_PREFS_KEY, JSON.stringify({ ...prefs, theme: normalized.mode }));
  } catch {
    window.localStorage.setItem(USER_PREFS_KEY, JSON.stringify({ theme: normalized.mode }));
  }
  return normalized;
}

export function applyThemeSettings(settings: unknown) {
  if (typeof document === "undefined") return "dark";
  const normalized = normalizeThemeSettings(settings);
  const resolvedMode = resolveThemeMode(normalized.mode);
  const root = document.documentElement;

  root.style.setProperty("--nodere-primary", "#03624C");
  root.style.setProperty("--color-cyan", resolvedMode === "light" ? "#03624C" : "#00DF82");
  root.style.setProperty("--color-panel", resolvedMode === "light" ? "#FFFFFF" : "#111827");
  root.style.setProperty("--color-ink", resolvedMode === "light" ? "#F8FAFC" : "#081018");
  root.style.setProperty("--color-line", resolvedMode === "light" ? "#E2E8F0" : "#243244");
  root.dataset.theme = resolvedMode;
  root.classList.toggle("light", resolvedMode === "light");
  root.classList.toggle("dark", resolvedMode === "dark");
  root.dataset.fontSize = normalized.fontSize;
  root.dataset.density = normalized.layoutDensity;
  root.dataset.cardStyle = normalized.cardStyle;

  if (document.body) {
    const font = normalized.fontFamily === "System default" ? "system-ui" : normalized.fontFamily;
    document.body.style.fontFamily = `${font}, Inter, system-ui, sans-serif`;
  }

  return resolvedMode;
}

export function readAndApplyThemeSettings() {
  return applyThemeSettings(readThemeSettings());
}

export function persistAndApplyThemeSettings(settings: unknown) {
  const normalized = writeThemeSettings(settings);
  const resolved = applyThemeSettings(normalized);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nodere:theme-change"));
  return { settings: normalized, resolved };
}
