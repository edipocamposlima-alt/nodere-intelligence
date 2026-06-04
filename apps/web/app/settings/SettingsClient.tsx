"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bell, CheckCircle2, Code2, Download, FileText, Palette, Save, Server, ShieldCheck, Smartphone, Stamp, UsersRound } from "lucide-react";
import { getBackendRootUrl } from "@/lib/apiBase";
import { getPublicSettings, savePublicSettings } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";

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

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "operator" | "viewer";
  active: boolean;
  createdAt: string;
};

type AuditEvent = {
  id: string;
  category?: string;
  action: string;
  description?: string;
  operatorId?: string;
  at: string;
};

type DownloadLog = {
  id: string;
  userId?: string;
  fileType: string;
  fileName?: string;
  createdAt: string;
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
  const [adminMessage, setAdminMessage] = useState("");
  const [adminUsers, setAdminUsers] = useState<SettingsUser[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([]);
  const [adminPanelsStatus, setAdminPanelsStatus] = useState("");

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

    void loadAdminPanels(next.backendUrl);
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

  async function enablePush() {
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) throw new Error("Este navegador não suporta push.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Permissão de notificação negada.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) throw new Error("VAPID_PUBLIC_KEY precisa estar configurada no frontend para criar assinatura push.");
      const response = await fetch(`${settings.backendUrl.replace(/\/$/, "")}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify(subscription)
      });
      const payload = await response.json();
      setAdminMessage(payload.message || "Push configurado.");
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "Não foi possível habilitar push.");
    }
  }

  async function generateApiKey() {
    const name = window.prompt("Nome da chave de API");
    if (!name) return;
    try {
      const response = await fetch(`${settings.backendUrl.replace(/\/$/, "")}/api/developer/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ name, scopes: ["leads:read", "search:write"] })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Falha ao gerar chave.");
      window.prompt("Copie a chave agora. Ela não será exibida novamente:", payload.key);
      setAdminMessage("Chave de API criada.");
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "Erro ao gerar chave.");
    }
  }

  async function loadAdminPanels(backendUrl = settings.backendUrl) {
    const token = getAdminToken();
    if (!token) return;
    setAdminPanelsStatus("Carregando usuários e auditoria...");
    const root = backendUrl.replace(/\/$/, "");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [usersResponse, auditResponse, downloadsResponse] = await Promise.all([
        fetch(`${root}/api/admin/users`, { headers, cache: "no-store" }),
        fetch(`${root}/api/audit?limit=50`, { headers, cache: "no-store" }),
        fetch(`${root}/api/audit/downloads?limit=50`, { headers, cache: "no-store" })
      ]);
      const usersPayload = await usersResponse.json().catch(() => ({ users: [] }));
      const auditPayload = await auditResponse.json().catch(() => []);
      const downloadPayload = await downloadsResponse.json().catch(() => []);
      if (!usersResponse.ok) throw new Error(usersPayload.message || `Usuários HTTP ${usersResponse.status}`);
      setAdminUsers(Array.isArray(usersPayload.users) ? usersPayload.users : []);
      setAuditEvents(Array.isArray(auditPayload) ? auditPayload : []);
      setDownloadLogs(Array.isArray(downloadPayload) ? downloadPayload : []);
      setAdminPanelsStatus("Usuários e auditoria carregados.");
    } catch (error) {
      setAdminPanelsStatus(error instanceof Error ? error.message : "Não foi possível carregar usuários/auditoria.");
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

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan" />
            <h3 className="font-semibold text-white">Templates de proposta</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Templates padrão e personalizados ficam em <code className="text-cyan">/api/proposals/templates</code>. Use a ficha do lead para gerar proposta com dados reais e salvar versões.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-cyan" />
            <h3 className="font-semibold text-white">Developer API</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Gere chaves para parceiros consumirem <code className="text-cyan">/v1/leads</code> e <code className="text-cyan">/v1/search</code>. Somente Owner/Admin.
          </p>
          <button type="button" onClick={generateApiKey} className="mt-3 rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan hover:bg-cyan/20">
            Gerar chave de API
          </button>
        </div>
        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-cyan" />
            <h3 className="font-semibold text-white">Notificações push</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Requer VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY no Render e assinatura do navegador.
          </p>
          <button type="button" onClick={enablePush} className="mt-3 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-electric">
            Habilitar notificações
          </button>
        </div>
        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <div className="flex items-center gap-2">
            <Stamp className="h-4 w-4 text-cyan" />
            <h3 className="font-semibold text-white">White-label</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Disponível no plano Agency via <code className="text-cyan">/api/workspace/branding</code>. Configure nome, domínio, logo e cor principal do workspace.
          </p>
        </div>
      </section>

      {getAdminToken() && (
        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-cyan" />
                <h3 className="font-semibold text-white">Usuários</h3>
              </div>
              <button type="button" onClick={() => loadAdminPanels()} className="rounded-lg border border-line bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-electric">
                Atualizar
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-400">Somente Owner/Admin. Cada usuário acessa o workspace da própria conta.</p>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
              {adminUsers.length === 0 && <p className="rounded-lg border border-line bg-ink p-3 text-sm text-slate-400">Nenhum usuário retornado ou sessão admin ausente.</p>}
              {adminUsers.map((user) => (
                <div key={user.id} className="rounded-lg border border-line bg-ink p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${user.active ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Perfil: {user.role} · Criado em {new Date(user.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan" />
              <h3 className="font-semibold text-white">Auditoria</h3>
            </div>
            <p className="mt-2 text-sm text-slate-400">Atividades operacionais e eventos técnicos do workspace.</p>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
              {auditEvents.length === 0 && <p className="rounded-lg border border-line bg-ink p-3 text-sm text-slate-400">Nenhum evento de auditoria registrado ainda.</p>}
              {auditEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-line bg-ink p-3">
                  <p className="text-sm font-semibold text-white">{event.action}</p>
                  <p className="mt-1 text-xs text-slate-400">{event.description || event.category || "Evento do sistema"}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(event.at).toLocaleString("pt-BR")}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel/90 p-5 xl:col-span-2">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-cyan" />
              <h3 className="font-semibold text-white">Downloads e exportações</h3>
            </div>
            <p className="mt-2 text-sm text-slate-400">Lista arquivos exportados quando a operação passa pelo backend.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Arquivo</th>
                    <th className="px-3 py-2">Usuário</th>
                    <th className="px-3 py-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {downloadLogs.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-4 text-slate-400">Nenhum download registrado ainda.</td></tr>
                  )}
                  {downloadLogs.map((item) => (
                    <tr key={item.id} className="border-t border-line">
                      <td className="px-3 py-2 text-white">{item.fileType}</td>
                      <td className="px-3 py-2 text-slate-300">{item.fileName || "Sem nome"}</td>
                      <td className="px-3 py-2 text-slate-400">{item.userId || "Sistema"}</td>
                      <td className="px-3 py-2 text-slate-400">{new Date(item.createdAt).toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {adminPanelsStatus && <p className="mt-3 text-xs text-slate-500">{adminPanelsStatus}</p>}
          </div>
        </section>
      )}

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
        {adminMessage && <span className="text-sm text-cyan">{adminMessage}</span>}
      </div>
    </form>
  );
}
