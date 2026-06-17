"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bell, CheckCircle2, Code2, Download, FileText, Mail, Palette, Save, Server, ShieldCheck, Smartphone, Stamp, UsersRound } from "lucide-react";
import { getBackendRootUrl } from "@/lib/apiBase";
import { getPublicSettings, savePublicSettings } from "@/lib/api";
import { AdminFetchError, adminFetch, getAdminToken } from "@/lib/adminAuth";

const STORAGE_KEY = "nodere_settings";
const BACKEND_ROOT_URL = getBackendRootUrl();

const themePresets: Record<string, { primary: string; mode: Settings["mode"]; cyan: string; panel: string; ink: string; line: string }> = {
  "Escuro": { primary: "#03624C", mode: "dark", cyan: "#00DF82", panel: "#111827", ink: "#081018", line: "#243244" },
  "Claro": { primary: "#03624C", mode: "light", cyan: "#03624C", panel: "#FFFFFF", ink: "#F8FAFC", line: "#E2E8F0" },
  "Sistema": { primary: "#03624C", mode: "system", cyan: "#00DF82", panel: "#111827", ink: "#081018", line: "#243244" }
};

type Settings = {
  theme: string;
  colorPrimary: string;
  mode: "dark" | "light" | "system";
  fontFamily: string;
  fontSize: "small" | "normal" | "large";
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
  theme: "Escuro",
  colorPrimary: "#03624C",
  mode: "dark",
  fontFamily: "Inter",
  fontSize: "normal",
  layoutDensity: "compact",
  cardStyle: "cards",
  backendUrl: BACKEND_ROOT_URL
};

function normalizeSettings(settings: Settings): Settings {
  const theme = settings.theme in themePresets ? settings.theme : "Escuro";
  const preset = themePresets[theme];
  return {
    ...settings,
    theme,
    mode: preset.mode,
    colorPrimary: "#03624C"
  };
}

function applySettings(settings: Settings) {
  const normalized = normalizeSettings(settings);
  const preset = themePresets[normalized.theme];
  const resolvedMode = normalized.mode === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : normalized.mode;
  document.documentElement.style.setProperty("--nodere-primary", "#03624C");
  document.documentElement.style.setProperty("--color-cyan", resolvedMode === "light" ? "#03624C" : preset.cyan);
  document.documentElement.style.setProperty("--color-panel", resolvedMode === "light" ? "#FFFFFF" : preset.panel);
  document.documentElement.style.setProperty("--color-ink", resolvedMode === "light" ? "#F8FAFC" : preset.ink);
  document.documentElement.style.setProperty("--color-line", resolvedMode === "light" ? "#E2E8F0" : preset.line);
  document.documentElement.dataset.theme = resolvedMode;
  document.documentElement.classList.toggle("light", resolvedMode === "light");
  document.documentElement.classList.toggle("dark", resolvedMode === "dark");
  document.documentElement.dataset.fontSize = normalized.fontSize;
  document.documentElement.dataset.density = normalized.layoutDensity;
  document.documentElement.dataset.cardStyle = normalized.cardStyle;
  const font = normalized.fontFamily === "System default" ? "system-ui" : normalized.fontFamily;
  document.body.style.fontFamily = `${font}, Inter, system-ui, sans-serif`;
}

function normalizeAuditEvent(row: Record<string, unknown>): AuditEvent {
  return {
    id: String(row.id || crypto.randomUUID()),
    category: typeof row.category === "string" ? row.category : typeof row.entity_type === "string" ? row.entity_type : undefined,
    action: typeof row.action === "string" ? row.action : "Evento administrativo",
    description: typeof row.description === "string" ? row.description : typeof row.entity_id === "string" ? row.entity_id : undefined,
    operatorId: typeof row.user_id === "string" ? row.user_id : undefined,
    at: typeof row.created_at === "string" ? row.created_at : typeof row.at === "string" ? row.at : new Date().toISOString()
  };
}

function normalizeDownloadLog(row: Record<string, unknown>): DownloadLog {
  return {
    id: String(row.id || crypto.randomUUID()),
    userId: typeof row.user_id === "string" ? row.user_id : typeof row.userId === "string" ? row.userId : undefined,
    fileType: typeof row.file_type === "string" ? row.file_type : typeof row.fileType === "string" ? row.fileType : "arquivo",
    fileName: typeof row.file_name === "string" ? row.file_name : typeof row.fileName === "string" ? row.fileName : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at : typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString()
  };
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
  const [pushAvailable, setPushAvailable] = useState(false);
  const [pushStatus, setPushStatus] = useState("Não testado");
  const [smtpSettings, setSmtpSettings] = useState({
    host: "",
    port: "587",
    user: "",
    pass: "",
    fromName: "NODERE Nexus",
    fromEmail: ""
  });
  const [smtpStatus, setSmtpStatus] = useState("Não testado");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const next = normalizeSettings(saved ? { ...defaults, ...JSON.parse(saved) } : defaults);
    setSettings(next);
    applySettings(next);

    getPublicSettings()
      .then((payload) => {
        const remote = payload.preferences ?? {};
        const merged = normalizeSettings({ ...next, ...remote } as Settings);
        setSettings(merged);
        applySettings(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        setStatus("Preferências carregadas do backend persistente.");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Não foi possível carregar preferências do backend.");
      });

    void loadAdminPanels();
    void checkPushStatus(next.backendUrl);
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    let next = { ...settings, [key]: value };
    if (key === "theme") {
      const preset = themePresets[String(value)];
      if (preset) next = { ...next, colorPrimary: preset.primary, mode: preset.mode };
    } else if (key === "colorPrimary") {
      next = { ...next, colorPrimary: "#03624C" };
    }
    setSettings(next);
    applySettings(next);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = { ...settings, colorPrimary: "#03624C" };
    setSettings(normalized);
    applySettings(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event("nodere:theme-change"));
    setStatus("Configurações salvas neste navegador.");

    try {
      await savePublicSettings(normalized as unknown as Record<string, unknown>);
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
      const root = settings.backendUrl.replace(/\/$/, "");
      const statusResponse = await fetch(`${root}/api/notifications/status`, { cache: "no-store" });
      const statusPayload = await statusResponse.json().catch(() => ({}));
      if (!statusResponse.ok || statusPayload.available === false) {
        setPushStatus(statusPayload.message || "Notificações push indisponíveis no momento.");
        throw new Error("Notificações push ainda não estão configuradas no servidor.");
      }
      if (!("Notification" in window) || !("serviceWorker" in navigator)) throw new Error("Este navegador não suporta push.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Permissão de notificação negada.");
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const keyResponse = await fetch(`${root}/api/push/vapid-public-key`, { cache: "no-store" });
        if (!keyResponse.ok) throw new Error("Chave pública VAPID indisponível no backend.");
        const { publicKey } = await keyResponse.json();
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }
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

  async function checkPushStatus(backendUrl = settings.backendUrl) {
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/notifications/status`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      const available = response.ok && payload.available === true;
      setPushAvailable(available);
      setPushStatus(payload.message || (available ? "Notificações push disponíveis." : "Notificações push indisponíveis no momento."));
    } catch {
      setPushAvailable(false);
      setPushStatus("Não foi possível verificar notificações push agora.");
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

  async function testSmtp() {
    setSmtpStatus("Testando SMTP...");
    try {
      const response = await fetch(`${settings.backendUrl.replace(/\/$/, "")}/api/settings/test-smtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({
          host: smtpSettings.host,
          port: smtpSettings.port,
          user: smtpSettings.user,
          pass: smtpSettings.pass,
          fromName: smtpSettings.fromName,
          from: smtpSettings.fromEmail
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `HTTP ${response.status}`);
      setSmtpStatus(payload.message || "Conexão SMTP verificada.");
    } catch (error) {
      setSmtpStatus(error instanceof Error ? error.message : "Falha ao testar SMTP.");
    }
  }

  async function loadAdminPanels() {
    setAdminPanelsStatus("Carregando usuários e auditoria...");
    try {
      const [usersPayload, auditPayload] = await Promise.all([
        adminFetch<{ users: SettingsUser[] }>("/admin/users"),
        adminFetch<{ activityLogs: Array<Record<string, unknown>>; downloadLogs: Array<Record<string, unknown>> }>("/admin/audit")
      ]);
      setAdminUsers(Array.isArray(usersPayload.users) ? usersPayload.users : []);
      setAuditEvents(Array.isArray(auditPayload.activityLogs) ? auditPayload.activityLogs.map(normalizeAuditEvent) : []);
      setDownloadLogs(Array.isArray(auditPayload.downloadLogs) ? auditPayload.downloadLogs.map(normalizeDownloadLog) : []);
      setAdminPanelsStatus("Usuários e auditoria carregados.");
    } catch (error) {
      if (error instanceof AdminFetchError && [401, 403].includes(error.status)) {
        setAdminPanelsStatus("Área restrita a Owner/Admin. Faça login com permissão administrativa para ver usuários e auditoria.");
      } else {
        setAdminPanelsStatus("Não foi possível carregar usuários/auditoria agora. Tente novamente em instantes.");
      }
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
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={generateApiKey} className="rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan hover:bg-cyan/20">
              Gerar chave de API
            </button>
            <a href={`${settings.backendUrl.replace(/\/$/, "")}/docs`} target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-electric">
              Ver documentação completa da API →
            </a>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-cyan" />
            <h3 className="font-semibold text-white">Notificações push</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {pushStatus}
          </p>
          <button type="button" disabled={!pushAvailable} title={!pushAvailable ? "Configure VAPID no backend para ativar push real." : "Ativar notificações neste navegador"} onClick={enablePush} className="mt-3 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-electric disabled:cursor-not-allowed disabled:opacity-50">
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

      <section className="rounded-lg border border-line bg-panel/90 p-5">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-cyan" />
          <h3 className="font-semibold text-white">SMTP para automações</h3>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Teste as credenciais de envio real. Em produção, mantenha os valores finais protegidos no backend.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input value={smtpSettings.host} onChange={(event) => setSmtpSettings((current) => ({ ...current, host: event.target.value }))} placeholder="SMTP Host" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
          <input value={smtpSettings.port} onChange={(event) => setSmtpSettings((current) => ({ ...current, port: event.target.value }))} placeholder="SMTP Port" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
          <input value={smtpSettings.user} onChange={(event) => setSmtpSettings((current) => ({ ...current, user: event.target.value }))} placeholder="SMTP User" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
          <input type="password" value={smtpSettings.pass} onChange={(event) => setSmtpSettings((current) => ({ ...current, pass: event.target.value }))} placeholder="SMTP Password" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
          <input value={smtpSettings.fromName} onChange={(event) => setSmtpSettings((current) => ({ ...current, fromName: event.target.value }))} placeholder="From name" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
          <input value={smtpSettings.fromEmail} onChange={(event) => setSmtpSettings((current) => ({ ...current, fromEmail: event.target.value }))} placeholder="From email" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={testSmtp} className="rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan hover:bg-cyan/20">
            Testar conexão SMTP
          </button>
          <span className="text-sm text-slate-400">{smtpStatus}</span>
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
              {adminUsers.length === 0 && <p className="rounded-lg border border-line bg-ink p-3 text-sm text-slate-400">Usuários disponíveis apenas para contas Owner/Admin.</p>}
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
              {["Escuro", "Claro", "Sistema"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Cor principal oficial
            <input type="color" value="#03624C" disabled className="h-11 w-full rounded-lg border border-line bg-ink px-2 opacity-80" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Modo
            <select value={settings.mode} onChange={(event) => update("mode", event.target.value as Settings["mode"])} className="w-full rounded-lg border border-line bg-ink px-3 py-2">
              <option value="dark">Escuro</option>
              <option value="light">Claro</option>
              <option value="system">Sistema</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Fonte
            <select value={settings.fontFamily} onChange={(event) => update("fontFamily", event.target.value)} className="w-full rounded-lg border border-line bg-ink px-3 py-2">
              {["Inter", "Roboto", "Poppins", "Montserrat", "Manrope", "Nunito Sans", "Lato", "Open Sans", "DM Sans", "Urbanist", "Source Sans 3", "Merriweather", "System default", "Arial"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Tamanho da fonte
            <select value={settings.fontSize} onChange={(event) => update("fontSize", event.target.value as Settings["fontSize"])} className="w-full rounded-lg border border-line bg-ink px-3 py-2">
              <option value="small">Pequena</option>
              <option value="normal">Normal</option>
              <option value="large">Grande</option>
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

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
