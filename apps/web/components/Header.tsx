"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, CreditCard, Search, X } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";
import { getInboxUnreadCount } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useCredits } from "@/context/CreditsProvider";

type CompanyListItem = { id: string; name: string };
type TaskItem = { id: string; title: string; dueAt?: string; status: string; companyId: string; companyName: string };
type UserPrefs = {
  theme: "dark" | "light";
  fontSize: "small" | "normal" | "large";
  density: "compact" | "comfortable" | "large";
  avatarUrl: string;
  displayName: string;
};

const API_URL = getApiBaseUrl();
const PREFS_KEY = "nodere_user_preferences";
const SETTINGS_KEY = "nodere_settings";

const defaultPrefs: UserPrefs = {
  theme: "dark",
  fontSize: "normal",
  density: "compact",
  avatarUrl: "",
  displayName: ""
};

function readPrefs(): UserPrefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const profile = JSON.parse(localStorage.getItem("nodere_user_profile") || "{}");
    return { ...defaultPrefs, displayName: profile.name || "", ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    return defaultPrefs;
  }
}

function applyPrefs(prefs: UserPrefs) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = prefs.theme;
  root.dataset.fontSize = prefs.fontSize;
  root.dataset.density = prefs.density;
  const currentSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...currentSettings, mode: prefs.theme, layoutDensity: prefs.density }));
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event("nodere:theme-change"));
}

export function Header() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [open, setOpen] = useState(false);
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs>(defaultPrefs);
  const [globalQuery, setGlobalQuery] = useState("");
  const [unreadInbox, setUnreadInbox] = useState(0);
  const [brandName, setBrandName] = useState("NODERE Nexus");
  const pathname = usePathname();
  const router = useRouter();
  const { user, workspace, logout } = useAuth();
  const { credits } = useCredits();

  const pageTitle = useMemo(() => {
    const path = pathname || "/";
    if (path.startsWith("/searches") || path.startsWith("/busca-de-empresas")) return "Busca de empresas";
    if (path.startsWith("/companies")) return "Ficha 360° da empresa";
    if (path.startsWith("/crm") || path.startsWith("/pipeline")) return "CRM Comercial";
    if (path.startsWith("/reports") || path.startsWith("/relatorios")) return "Relatórios executivos";
    if (path.startsWith("/integrations") || path.startsWith("/integracoes")) return "Integrações";
    if (path.startsWith("/operators")) return "Operadores";
    if (path.startsWith("/manual") || path.startsWith("/ajuda") || path.startsWith("/help")) return "Ajuda / Manual";
    if (path.startsWith("/settings") || path.startsWith("/configuracoes")) return "Configurações";
    if (path.startsWith("/admin")) return "Administrador";
    if (path.startsWith("/intelligence") || path.startsWith("/ia")) return "Inteligência comercial";
    if (path.startsWith("/inbox")) return "Caixa de entrada";
    if (path.startsWith("/calendar") || path.startsWith("/calendario")) return "Calendário comercial";
    if (path.startsWith("/marketing")) return "Marketing";
    if (path.startsWith("/billing")) return "Faturamento";
    return "Dashboard Executivo";
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readPrefs();
    setPrefs(stored);
    applyPrefs(stored);
    setGlobalQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, [pathname]);

  useEffect(() => {
    async function loadBranding() {
      try {
        const response = await fetch(`${API_URL}/workspace/branding?domain=${encodeURIComponent(window.location.hostname)}`, { cache: "no-store" });
        if (!response.ok) return;
        const brand = await response.json();
        if (brand?.name) {
          setBrandName(brand.name);
          document.title = brand.name;
        }
        if (brand?.primaryColor) document.documentElement.style.setProperty("--color-primary", brand.primaryColor);
      } catch {
        // Keep NODERE default branding.
      }
    }
    if (typeof window !== "undefined") void loadBranding();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadTasks() {
      try {
        const companies = (await fetch(`${API_URL}/companies`, { cache: "no-store" }).then((res) => res.json())) as CompanyListItem[];
        const taskGroups = await Promise.all(
          companies.slice(0, 80).map(async (company) => {
            const companyTasks = await fetch(`${API_URL}/companies/${company.id}/tasks`, { cache: "no-store" }).then((res) => res.ok ? res.json() : []);
            return (companyTasks as TaskItem[]).map((task) => ({ ...task, companyName: company.name }));
          })
        );
        if (!cancelled) setTasks(taskGroups.flat().filter((task) => task.status !== "done"));
      } catch {
        if (!cancelled) setTasks([]);
      }
    }
    void loadTasks();
    const timer = window.setInterval(loadTasks, 1000 * 60 * 5);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadUnreadInbox() {
      try {
        const payload = await getInboxUnreadCount();
        if (!cancelled) setUnreadInbox(payload.unread || 0);
      } catch {
        if (!cancelled) setUnreadInbox(0);
      }
    }
    void loadUnreadInbox();
    const timer = window.setInterval(loadUnreadInbox, 1000 * 60);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const alerts = useMemo(() => {
    const now = new Date();
    const endToday = new Date(now);
    endToday.setHours(23, 59, 59, 999);
    return tasks
      .filter((task) => task.dueAt && new Date(task.dueAt) <= endToday)
      .sort((a, b) => new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime());
  }, [tasks]);

  const displayName = user?.name || user?.email || "Usuário";
  const shownName = prefs.displayName || user?.name || displayName;
  const avatarUrl = prefs.avatarUrl || user?.avatar_url || "";
  const initial = (shownName || user?.email || "U").charAt(0).toUpperCase();

  function submitGlobalSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = globalQuery.trim();
    if (!query) {
      router.push("/companies");
      return;
    }
    router.push(`/companies?q=${encodeURIComponent(query)}`);
  }

  function updatePrefs(next: Partial<UserPrefs>) {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    applyPrefs(merged);
  }

  function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updatePrefs({ avatarUrl: String(reader.result || "") });
    reader.readAsDataURL(file);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="min-w-0">
          <span className="block truncate text-base font-semibold text-white md:text-lg">{pageTitle}</span>
          <span className="hidden text-xs text-slate-500 sm:block">{brandName} · Operação comercial e inteligência de prospecção</span>
        </Link>

        <form onSubmit={submitGlobalSearch} className="hidden w-full max-w-md items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={globalQuery}
            onChange={(event) => setGlobalQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-slate-200 outline-none"
            placeholder="Buscar empresa, cidade ou segmento"
            aria-label="Buscar empresas salvas no CRM"
          />
        </form>

        <div className="flex items-center gap-2">
          {credits && (
            <Link
              href="/billing"
              className={`hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold sm:inline-flex ${
                credits.remaining < 5 || credits.blocked
                  ? "border-rose-400/50 bg-rose-500/15 text-rose-200"
                  : credits.remaining <= 10
                    ? "border-amber-300/50 bg-amber-300/15 text-amber-100"
                    : "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
              }`}
              title={`Créditos: ${credits.remaining} / ${credits.total} (${credits.plan})`}
            >
              <CreditCard className="h-4 w-4" />
              {credits.remaining}
            </Link>
          )}

          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-line bg-white/5 px-2 py-1.5 text-left hover:border-electric/60 hover:bg-electric/10"
            onClick={() => setShowPrefsModal(true)}
            title="Preferências"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {initial}
              </div>
            )}
            <span className="hidden max-w-64 truncate text-sm font-medium text-slate-100 lg:block" title={shownName}>{shownName}</span>
            <span aria-hidden="true" title="Preferências">⚙️</span>
          </button>

          <button onClick={logout} className="hidden rounded-lg border border-line px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white sm:inline-flex">
            Sair
          </button>
          <div className="relative">
            <button
              onClick={() => setOpen((value) => !value)}
              className="relative rounded-lg border border-line bg-white/5 p-2 text-slate-300 hover:text-white"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              {alerts.length + unreadInbox > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-ink">
                  {alerts.length + unreadInbox}
                </span>
              )}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-line bg-panel p-3 shadow-glow">
                <p className="text-sm font-semibold text-white">Lembretes e follow-ups</p>
                {unreadInbox > 0 && (
                  <Link href="/inbox" className="mt-3 block rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-100 hover:border-emerald-300">
                    {unreadInbox} mensagem{unreadInbox === 1 ? "" : "s"} não lida{unreadInbox === 1 ? "" : "s"} no Inbox
                  </Link>
                )}
                {alerts.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">Nenhum lembrete vencido ou para hoje.</p>
                ) : (
                  <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                    {alerts.slice(0, 8).map((task) => (
                      <Link key={task.id} href={`/companies/${encodeURIComponent(task.companyId)}`} className="block rounded-md border border-line bg-ink px-3 py-2 hover:border-electric/60">
                        <p className="truncate text-sm font-medium text-white">{task.title}</p>
                        <p className="mt-1 truncate text-xs text-slate-400">{task.companyName} · {new Date(task.dueAt || "").toLocaleString("pt-BR")}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPrefsModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <section className="w-full max-w-lg rounded-2xl border border-line bg-panel p-5 shadow-glow">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Preferências rápidas</h2>
                <p className="text-sm text-slate-400">Tema, leitura, densidade e foto ficam salvos neste navegador.</p>
              </div>
              <button type="button" onClick={() => setShowPrefsModal(false)} className="rounded-lg border border-line p-2 text-slate-300 hover:text-white" aria-label="Fechar preferências">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Tema</span>
                <select value={prefs.theme} onChange={(event) => updatePrefs({ theme: event.target.value as UserPrefs["theme"] })} className="mt-2 min-h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm outline-none">
                  <option value="dark">Escuro</option>
                  <option value="light">Claro</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Fonte</span>
                <select value={prefs.fontSize} onChange={(event) => updatePrefs({ fontSize: event.target.value as UserPrefs["fontSize"] })} className="mt-2 min-h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm outline-none">
                  <option value="small">Pequena</option>
                  <option value="normal">Normal</option>
                  <option value="large">Grande</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Densidade</span>
                <select value={prefs.density} onChange={(event) => updatePrefs({ density: event.target.value as UserPrefs["density"] })} className="mt-2 min-h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm outline-none">
                  <option value="compact">Compacto</option>
                  <option value="comfortable">Confortável</option>
                  <option value="large">Amplo</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Foto</span>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-300">Nome exibido</span>
                <input value={prefs.displayName} onChange={(event) => updatePrefs({ displayName: event.target.value })} placeholder="Ex.: ÉDIPO LIMA" className="mt-2 min-h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm outline-none" />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => updatePrefs({ ...defaultPrefs, avatarUrl })} className="btn-secondary-action px-4 py-2 text-sm">Restaurar</button>
              <button type="button" onClick={() => setShowPrefsModal(false)} className="btn-action px-4 py-2 text-sm">Salvar</button>
            </div>
          </section>
        </div>
      )}
    </header>
  );
}
