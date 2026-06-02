import { getSupabase, hasSupabase } from "../db/supabase.js";

export interface PublicPreferences {
  theme?: string;
  mode?: "dark" | "light";
  colorPrimary?: string;
  fontFamily?: string;
  layoutDensity?: string;
  cardStyle?: string;
  backendUrl?: string;
}

export interface PipelineSettings {
  stages?: string[];
  stageColors?: Record<string, string>;
}

export interface AppSettings {
  preferences: PublicPreferences;
  pipeline: PipelineSettings;
}

const memSettings: AppSettings = {
  preferences: {},
  pipeline: {}
};

const memSettingsRecord = memSettings as unknown as Record<string, unknown>;

function canUseVolatileFallback() {
  return !hasSupabase() || process.env.NODE_ENV !== "production";
}

function persistenceError(action: string, error: unknown) {
  const detail = error instanceof Error ? error.message : JSON.stringify(error);
  const err = new Error(
    `Persistencia indisponivel: nao foi possivel ${action} no Supabase. ` +
    "Para evitar perda de dados em atualizacoes/deploys, o NODERE nao salva configuracoes criticas apenas em memoria temporaria."
  ) as Error & { status?: number; code?: string; reason?: string };
  err.status = 503;
  err.code = "PERSISTENCE_UNAVAILABLE";
  err.reason = detail;
  return err;
}

function sanitizePreferences(input: Partial<PublicPreferences>): PublicPreferences {
  return {
    theme: typeof input.theme === "string" ? input.theme : undefined,
    mode: input.mode === "light" || input.mode === "dark" ? input.mode : undefined,
    colorPrimary: typeof input.colorPrimary === "string" ? input.colorPrimary : undefined,
    fontFamily: typeof input.fontFamily === "string" ? input.fontFamily : undefined,
    layoutDensity: typeof input.layoutDensity === "string" ? input.layoutDensity : undefined,
    cardStyle: typeof input.cardStyle === "string" ? input.cardStyle : undefined,
    backendUrl: typeof input.backendUrl === "string" ? input.backendUrl : undefined
  };
}

function sanitizePipeline(input: Partial<PipelineSettings>): PipelineSettings {
  const stages = Array.isArray(input.stages)
    ? input.stages.map((stage) => String(stage).trim()).filter(Boolean).slice(0, 40)
    : undefined;
  const stageColors = input.stageColors && typeof input.stageColors === "object"
    ? Object.fromEntries(
      Object.entries(input.stageColors)
        .filter(([stage, color]) => typeof stage === "string" && typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color))
        .slice(0, 80)
    )
    : undefined;
  return { stages, stageColors };
}

async function readSetting<T>(key: string): Promise<T | undefined> {
  if (!hasSupabase()) return memSettingsRecord[key] as T | undefined;
  const sb = getSupabase()!;
  const { data, error } = await sb.from("nodere_app_settings").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return data?.value as T | undefined;
}

async function writeSetting(key: keyof AppSettings, value: unknown): Promise<void> {
  if (!hasSupabase()) {
    memSettingsRecord[key] = value;
    return;
  }
  const sb = getSupabase()!;
  const { error } = await sb.from("nodere_app_settings").upsert({
    key,
    value,
    updated_at: new Date().toISOString()
  }, { onConflict: "key" });
  if (error) throw error;
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const [preferences, pipeline] = await Promise.all([
      readSetting<PublicPreferences>("preferences"),
      readSetting<PipelineSettings>("pipeline")
    ]);
    return {
      preferences: { ...memSettings.preferences, ...(preferences ?? {}) },
      pipeline: { ...memSettings.pipeline, ...(pipeline ?? {}) }
    };
  } catch (error) {
    if (!canUseVolatileFallback()) {
      console.warn("NODERE settings persistence read unavailable:", error);
    }
    return memSettings;
  }
}

export async function savePreferences(input: Partial<PublicPreferences>) {
  const current = await getAppSettings();
  const preferences = { ...current.preferences, ...sanitizePreferences(input) };
  try {
    await writeSetting("preferences", preferences);
    memSettings.preferences = preferences;
    return preferences;
  } catch (error) {
    if (canUseVolatileFallback()) {
      memSettings.preferences = preferences;
      return preferences;
    }
    throw persistenceError("salvar preferencias", error);
  }
}

export async function savePipelineSettings(input: Partial<PipelineSettings>) {
  const current = await getAppSettings();
  const sanitized = sanitizePipeline(input);
  const pipeline = {
    stages: sanitized.stages ?? current.pipeline.stages,
    stageColors: { ...(current.pipeline.stageColors ?? {}), ...(sanitized.stageColors ?? {}) }
  };
  try {
    await writeSetting("pipeline", pipeline);
    memSettings.pipeline = pipeline;
    return pipeline;
  } catch (error) {
    if (canUseVolatileFallback()) {
      memSettings.pipeline = pipeline;
      return pipeline;
    }
    throw persistenceError("salvar etapas e cores do funil", error);
  }
}
