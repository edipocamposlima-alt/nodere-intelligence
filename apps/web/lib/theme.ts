export type NodereThemeMode = "dark" | "light" | "system";
export type NodereThemeVariant = "default" | "nodere" | "highContrastDark" | "highContrastLight";
export type NodereFontSize = "compact" | "small" | "normal" | "large" | "extraLarge";
export type NodereDensity = "compact" | "comfortable" | "spacious";
export type NodereLayoutVariant = "standard" | "compact" | "comfortable" | "elevated" | "commercial" | "highDensity";
export type NodereVisualStyle = "cards" | "list" | "glass" | "solid" | "borderless" | "elevated";

export type NodereThemeSettings = {
  theme: "Escuro" | "Claro" | "Sistema" | "Verde NODERE" | "Alto contraste escuro" | "Alto contraste claro";
  mode: NodereThemeMode;
  themeVariant: NodereThemeVariant;
  colorPrimary: string;
  fontFamily: string;
  fontSize: NodereFontSize;
  layoutDensity: NodereDensity;
  density: NodereDensity;
  layoutVariant: NodereLayoutVariant;
  visualStyle: NodereVisualStyle;
  cardStyle: NodereVisualStyle;
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
  themeVariant: "default",
  colorPrimary: "#03624C",
  fontFamily: "Inter",
  fontSize: "normal",
  layoutDensity: "comfortable",
  density: "comfortable",
  layoutVariant: "standard",
  visualStyle: "cards",
  cardStyle: "cards"
};

const FONT_STACKS: Record<string, string> = {
  Inter: "Inter, system-ui, sans-serif",
  Arial: "Arial, Helvetica, sans-serif",
  Roboto: "Roboto, Arial, sans-serif",
  System: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "System default": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Poppins: "Poppins, Inter, system-ui, sans-serif",
  Montserrat: "Montserrat, Inter, system-ui, sans-serif",
  Manrope: "Manrope, Inter, system-ui, sans-serif",
  "Nunito Sans": "'Nunito Sans', Inter, system-ui, sans-serif",
  Lato: "Lato, Inter, system-ui, sans-serif",
  "Open Sans": "'Open Sans', Inter, system-ui, sans-serif",
  "DM Sans": "'DM Sans', Inter, system-ui, sans-serif",
  Urbanist: "Urbanist, Inter, system-ui, sans-serif",
  "Source Sans 3": "'Source Sans 3', Inter, system-ui, sans-serif"
};

function validHex(value: unknown) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;
}

function labelFromMode(mode: NodereThemeMode, variant: NodereThemeVariant): NodereThemeSettings["theme"] {
  if (variant === "nodere") return "Verde NODERE";
  if (variant === "highContrastDark") return "Alto contraste escuro";
  if (variant === "highContrastLight") return "Alto contraste claro";
  if (mode === "light") return "Claro";
  if (mode === "system") return "Sistema";
  return "Escuro";
}

function modeVariantFromLabel(theme?: unknown): { mode?: NodereThemeMode; variant?: NodereThemeVariant } {
  if (theme === "Claro") return { mode: "light", variant: "default" };
  if (theme === "Sistema") return { mode: "system", variant: "default" };
  if (theme === "Verde NODERE") return { mode: "dark", variant: "nodere" };
  if (theme === "Alto contraste escuro") return { mode: "dark", variant: "highContrastDark" };
  if (theme === "Alto contraste claro") return { mode: "light", variant: "highContrastLight" };
  if (theme === "Escuro") return { mode: "dark", variant: "default" };
  return {};
}

export function normalizeThemeMode(value?: unknown): NodereThemeMode | undefined {
  if (value === "light" || value === "dark" || value === "system") return value;
  return modeVariantFromLabel(value).mode;
}

function normalizeVariant(value: unknown, theme: unknown): NodereThemeVariant {
  if (value === "default" || value === "nodere" || value === "highContrastDark" || value === "highContrastLight") return value;
  return modeVariantFromLabel(theme).variant || defaultThemeSettings.themeVariant;
}

function normalizeFontSize(value: unknown): NodereFontSize {
  if (value === "compact" || value === "small" || value === "normal" || value === "large" || value === "extraLarge") return value;
  return defaultThemeSettings.fontSize;
}

function normalizeDensity(value: unknown): NodereDensity {
  if (value === "ultraCompact") return "compact";
  if (value === "executive" || value === "large") return "spacious";
  if (value === "compact" || value === "comfortable" || value === "spacious") return value;
  return defaultThemeSettings.density;
}

function normalizeLayout(value: unknown): NodereLayoutVariant {
  if (value === "standard" || value === "compact" || value === "comfortable" || value === "elevated" || value === "commercial" || value === "highDensity") return value;
  return defaultThemeSettings.layoutVariant;
}

function normalizeVisual(value: unknown): NodereVisualStyle {
  if (value === "cards" || value === "list" || value === "glass" || value === "solid" || value === "borderless" || value === "elevated") return value;
  return defaultThemeSettings.visualStyle;
}

export function normalizeThemeSettings(input: unknown = {}): NodereThemeSettings {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const label = modeVariantFromLabel(data.theme);
  const mode = normalizeThemeMode(data.mode) || label.mode || defaultThemeSettings.mode;
  const themeVariant = normalizeVariant(data.themeVariant, data.theme);
  const density = normalizeDensity(data.density || data.layoutDensity);
  const visualStyle = normalizeVisual(data.visualStyle || data.cardStyle);
  return {
    ...defaultThemeSettings,
    ...data,
    mode,
    themeVariant,
    theme: labelFromMode(mode, themeVariant),
    colorPrimary: validHex(data.colorPrimary) || defaultThemeSettings.colorPrimary,
    fontFamily: typeof data.fontFamily === "string" && data.fontFamily ? data.fontFamily : defaultThemeSettings.fontFamily,
    fontSize: normalizeFontSize(data.fontSize),
    layoutDensity: density,
    density,
    layoutVariant: normalizeLayout(data.layoutVariant),
    visualStyle,
    cardStyle: visualStyle
  };
}

export function resolveThemeMode(mode: NodereThemeMode, variant: NodereThemeVariant = "default"): "dark" | "light" {
  if (variant === "highContrastLight") return "light";
  if (variant === "highContrastDark" || variant === "nodere") return "dark";
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
      mode: normalizeThemeMode(saved.mode) || modeVariantFromLabel(saved.theme).mode || direct || legacy || normalizeThemeMode(prefs.theme)
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

function applyPalette(root: HTMLElement, resolvedMode: "dark" | "light", settings: NodereThemeSettings) {
  const primary = settings.colorPrimary;
  root.style.setProperty("--nodere-primary", primary);
  root.style.setProperty("--brand-primary", primary);
  root.style.setProperty("--brand-primary-hover", `color-mix(in srgb, ${primary} 82%, #ffffff)`);
  root.style.setProperty("--brand-primary-dark", `color-mix(in srgb, ${primary} 72%, #020617)`);
  root.style.setProperty("--brand-primary-active", `color-mix(in srgb, ${primary} 78%, #020617)`);
  root.style.setProperty("--color-cyan", resolvedMode === "light" ? primary : "#00DF82");

  if (settings.themeVariant === "highContrastDark") {
    root.style.setProperty("--bg-main", "#000000");
    root.style.setProperty("--bg-card", "#050505");
    root.style.setProperty("--bg-hover", "#111111");
    root.style.setProperty("--border", "#f8fafc");
    root.style.setProperty("--text-primary", "#ffffff");
    root.style.setProperty("--text-secondary", "#f1f5f9");
    root.style.setProperty("--text-muted", "#cbd5e1");
  } else if (settings.themeVariant === "highContrastLight") {
    root.style.setProperty("--bg-main", "#ffffff");
    root.style.setProperty("--bg-card", "#ffffff");
    root.style.setProperty("--bg-hover", "#f1f5f9");
    root.style.setProperty("--border", "#0f172a");
    root.style.setProperty("--text-primary", "#020617");
    root.style.setProperty("--text-secondary", "#1e293b");
    root.style.setProperty("--text-muted", "#334155");
  } else if (settings.themeVariant === "nodere") {
    root.style.setProperty("--bg-main", "#06130f");
    root.style.setProperty("--bg-card", "#0b1b16");
    root.style.setProperty("--bg-hover", "#102820");
    root.style.setProperty("--border", "rgba(0,223,130,0.22)");
    root.style.setProperty("--text-primary", "#f8fffb");
    root.style.setProperty("--text-secondary", "#b7d8cd");
    root.style.setProperty("--text-muted", "#86a79c");
  }

  root.style.setProperty("--color-panel", resolvedMode === "light" ? "#ffffff" : "var(--bg-card)");
  root.style.setProperty("--color-ink", resolvedMode === "light" ? "#f8fafc" : "var(--bg-main)");
  root.style.setProperty("--color-line", "var(--border)");
}

export function applyThemeSettings(settings: unknown) {
  if (typeof document === "undefined") return "dark";
  const normalized = normalizeThemeSettings(settings);
  const resolvedMode = resolveThemeMode(normalized.mode, normalized.themeVariant);
  const root = document.documentElement;
  const fontStack = FONT_STACKS[normalized.fontFamily] || FONT_STACKS.Inter;

  root.dataset.theme = resolvedMode;
  root.dataset.themeMode = normalized.mode;
  root.dataset.themeVariant = normalized.themeVariant;
  root.dataset.fontFamily = normalized.fontFamily.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  root.dataset.fontSize = normalized.fontSize;
  root.dataset.density = normalized.density;
  root.dataset.layout = normalized.layoutVariant;
  root.dataset.cardStyle = normalized.cardStyle;
  root.dataset.visual = normalized.visualStyle;
  root.classList.toggle("light", resolvedMode === "light");
  root.classList.toggle("dark", resolvedMode === "dark");
  root.style.setProperty("--nodere-font-family", fontStack);
  applyPalette(root, resolvedMode, normalized);

  if (document.body) document.body.style.fontFamily = "var(--nodere-font-family)";

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
