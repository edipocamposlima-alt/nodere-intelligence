"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Palette, Save, Server, Smartphone } from "lucide-react";
import { getBackendRootUrl } from "@/lib/apiBase";
import { getPublicSettings, savePublicSettings } from "@/lib/api";

const STORAGE_KEY = "nodere_settings";
const BACKEND_ROOT_URL = getBackendRootUrl();

const themePresets: Record<string, { primary: string; mode: Settings["mode"]; cyan: string; panel: string; ink: string; line: string }> = {
  "Nodere Azul": { primary: "#1E6FDB", mode: "dark", cyan: "#42D7FF", panel: "#0B1220", ink: "#050914", line: "#18243A" },
  "Atlântico premium": { primary: "#0284C7", mode: "dark", cyan: "#22D3EE", panel: "#071827", ink: "#020817", line: "#164E63" },
  "Azul executivo": { primary: "#2563EB", mode: "dark", cyan: "#06B6D4", panel: "#0D1B2A", ink: "#050A14", line: "#1D3557" },
  "Executivo Escuro": { primary: "#2DD4BF", mode: "dark", cyan: "#38BDF8", panel: "#0D1624", ink: "#040812", line: "#223047" },
  "Preto absoluto": { primary: "#3B82F6", mode: "dark", cyan: "#06B6D4", panel: "#030712", ink: "#000000", line: "#1F2937" },
  "Aço premium": { primary: "#64748B", mode: "dark", cyan: "#38BDF8", panel: "#111827", ink: "#030712", line: "#334155" },
  "Verde Performance": { primary: "#16C784", mode: "dark", cyan: "#22D3EE", panel: "#071B18", ink: "#04100E", line: "#174239" },
  "Verde comercial": { primary: "#10B981", mode: "dark", cyan: "#2DD4BF", panel: "#06251F", ink: "#03110E", line: "#14532D" },
  "Esmeralda forte": { primary: "#059669", mode: "dark", cyan: "#10B981", panel: "#052E2B", ink: "#021412", line: "#047857" },
  "Roxo SaaS": { primary: "#8B5CF6", mode: "dark", cyan: "#38BDF8", panel: "#111029", ink: "#070716", line: "#2B2852" },
  "Roxo tecnológico": { primary: "#A855F7", mode: "dark", cyan: "#60A5FA", panel: "#17102A", ink: "#080512", line: "#3B2463" },
  "Violeta sólido": { primary: "#7C3AED", mode: "dark", cyan: "#A78BFA", panel: "#160B2E", ink: "#070316", line: "#4C1D95" },
  "Laranja performance": { primary: "#F97316", mode: "dark", cyan: "#22D3EE", panel: "#1F1307", ink: "#0F0803", line: "#7C2D12" },
  "Solar executivo": { primary: "#F59E0B", mode: "dark", cyan: "#F97316", panel: "#211407", ink: "#0F0702", line: "#92400E" },
  "Vermelho conversão": { primary: "#EF4444", mode: "dark", cyan: "#F97316", panel: "#220A0A", ink: "#100303", line: "#7F1D1D" },
  "Magenta premium": { primary: "#EC4899", mode: "dark", cyan: "#A78BFA", panel: "#201020", ink: "#100712", line: "#831843" },
  "Ciano neon": { primary: "#06B6D4", mode: "dark", cyan: "#67E8F9", panel: "#061D24", ink: "#031014", line: "#155E75" },
  "Grafite claro": { primary: "#334155", mode: "light", cyan: "#2563EB", panel: "#FFFFFF", ink: "#F1F5F9", line: "#CBD5E1" },
  "Alto contraste": { primary: "#FACC15", mode: "dark", cyan: "#00E5FF", panel: "#000000", ink: "#000000", line: "#FFFFFF" },
  "Claro": { primary: "#2563EB", mode: "light", cyan: "#0EA5E9", panel: "#FFFFFF", ink: "#F6F8FC", line: "#D9E2EF" },
  "Escuro": { primary: "#1E6FDB", mode: "dark", cyan: "#42D7FF", panel: "#0B1220", ink: "#050914", line: "#18243A" }
};

type Settings = {
  theme: string;
  colorPrimary: string;
  mode: "dark" | "light";
  fontFamily: string;
  layoutDensity: "ultraCompact" | "compact" | "comfortable" | "executive" | "large";
  cardStyle: "cards" | "list" | "glass" | "solid" | "borderless" | "elevated";
  backendUrl: string;
};

const defaults: Settings = {
  theme: "Nodere Azul",
  colorPrimary: "#1E6FDB",
  mode: "dark",
  fontFamily: "Inter",
  layoutDensity: "compact",
  cardStyle: "cards",
  backendUrl: BACKEND_ROOT_URL
};

function applySettings(settings: Settings) {
  const preset = themePresets[settings.theme] || themePresets["Nodere Azul"];
  document.documentElement.style.setProperty("--nodere-primary", settings.colorPrimary);
  document.documentElement.style.setProperty("--color-cyan", preset.cyan);
  document.documentElement.style.setProperty("--color-panel", settings.mode === "light" ? "#FFFFFF" : preset.panel);
  document.documentElement.style.setProperty("--color-ink", settings.mode === "light" ? "#F6F8FC" : preset.ink);
  document.documentElement.style.setProperty("--color-line", settings.mode === "light" ? "#D9E2EF" : preset.line);
  document.documentElement.dataset.theme = settings.mode;
  document.documentElement.dataset.density = settings.layoutDensity;
  document.documentElement.dataset.cardStyle = settings.cardStyle;
  const font = settings.fontFamily === "System default" ? "system-ui" : settings.fontFamily;
  document.body.style.fontFamily = `${font}, Inter, system-ui, sans-serif`;
}

export function SettingsClient() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [status, setStatus] = useState<string>("Preferências carregadas localmente.");
  const [health, setHealth] = useState<string>("Não testado");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const next = saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    setSettings(next);
    applySettings(next);

    getPublicSettings()
      .then((payload) => {
        const remote = payload.preferences ?? {};
        const merged = { ...next, ...remote } as Settings;
        setSettings(merged);
        applySettings(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        setStatus("Preferências carregadas do backend persistente.");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Não foi possível carregar preferências do backend.");
      });
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    let next = { ...settings, [key]: value };
    if (key === "theme") {
      const preset = themePresets[String(value)];
      if (preset) next = { ...next, colorPrimary: preset.primary, mode: preset.mode };
    }
    setSettings(next);
    applySettings(next);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("nodere:theme-change"));
    setStatus("Configurações salvas neste navegador.");

    try {
      await savePublicSettings(settings as unknown as Record<string, unknown>);
      setStatus("Configurações salvas localmente e enviadas ao backend.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Configurações salvas localmente. Backend indisponível para sincronizar.");
    }
  }

  async function testBackend() {
    setHealth("Testando...");
    try {
      const response = await fetch(`${settings.backendUrl.replace(/\/$/, "")}/api/health`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      setHealth(payload.ok ? "Backend conectado" : "Backend respondeu sem OK");
    } catch (error) {
      setHealth(error instanceof Error ? `Erro: ${error.message}` : "Erro ao testar backend");
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <section className="rounded-lg border border-line bg-panel/90 p-5">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-cyan" />
          <h3 className="font-semibold text-white">Backend e produção</h3>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input value={settings.backendUrl} onChange={(event) => update("backendUrl", event.target.value)} className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
          <button type="button" onClick={testBackend} className="rounded-lg border border-line bg-ink px-4 py-2 text-sm font-semibold text-white hover:border-electric">Testar conexão</button>
        </div>
        <p className="mt-2 text-sm text-slate-400">{health}</p>
      </section>

      <section className="rounded-lg border border-line bg-panel/90 p-5">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-cyan" />
          <h3 className="font-semibold text-white">Tema, fonte e layout</h3>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2 text-sm text-slate-300">
            Tema
            <select value={settings.theme} onChange={(event) => update("theme", event.target.value)} className="w-full rounded-lg border border-line bg-ink px-3 py-2">
              {["Claro", "Grafite claro", "Escuro", "Nodere Azul", "Atlântico premium", "Azul executivo", "Executivo Escuro", "Preto absoluto", "Aço premium", "Ciano neon", "Roxo tecnológico", "Roxo SaaS", "Violeta sólido", "Magenta premium", "Verde comercial", "Verde Performance", "Esmeralda forte", "Laranja performance", "Solar executivo", "Vermelho conversão", "Alto contraste"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Cor principal
            <input type="color" value={settings.colorPrimary} onChange={(event) => update("colorPrimary", event.target.value)} className="h-11 w-full rounded-lg border border-line bg-ink px-2" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Modo
            <select value={settings.mode} onChange={(event) => update("mode", event.target.value as Settings["mode"])} className="w-full rounded-lg border border-line bg-ink px-3 py-2">
              <option value="dark">Escuro</option>
              <option value="light">Claro</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Fonte
            <select value={settings.fontFamily} onChange={(event) => update("fontFamily", event.target.value)} className="w-full rounded-lg border border-line bg-ink px-3 py-2">
              {["Inter", "Roboto", "Poppins", "Montserrat", "Manrope", "Nunito Sans", "Lato", "Open Sans", "DM Sans", "Urbanist", "Source Sans 3", "Merriweather", "System default", "Arial"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Densidade
            <select value={settings.layoutDensity} onChange={(event) => update("layoutDensity", event.target.value as Settings["layoutDensity"])} className="w-full rounded-lg border border-line bg-ink px-3 py-2">
              <option value="ultraCompact">Ultra compacto</option>
              <option value="compact">Compacto</option>
              <option value="comfortable">Expandido</option>
              <option value="executive">Executivo</option>
              <option value="large">Cards grandes</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Visual
            <select value={settings.cardStyle} onChange={(event) => update("cardStyle", event.target.value as Settings["cardStyle"])} className="w-full rounded-lg border border-line bg-ink px-3 py-2">
              <option value="cards">Cards</option>
              <option value="list">Listas</option>
              <option value="glass">Glass premium</option>
              <option value="solid">Sólido corporativo</option>
              <option value="borderless">Sem bordas</option>
              <option value="elevated">Elevado premium</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-panel/90 p-5">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-1 h-4 w-4 text-cyan" />
          <div>
            <h3 className="font-semibold text-white">App via web / PWA</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              No Android/Chrome, abra o menu do navegador e escolha "Instalar app". No iPhone/Safari, use Compartilhar e "Adicionar à Tela de Início".
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-lg bg-electric px-5 py-3 text-sm font-semibold text-white">
          <Save className="h-4 w-4" />
          Salvar configurações
        </button>
        <span className="inline-flex items-center gap-2 text-sm text-slate-400">
          <CheckCircle2 className="h-4 w-4 text-success" />
          {status}
        </span>
      </div>
    </form>
  );
}
