"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, CreditCard, Download, Search, X } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";
import { getInboxUnreadCount } from "@/lib/api";
import { getPageTitle } from "@/lib/page-titles";
import { applyThemeSettings, persistAndApplyThemeSettings, readThemeSettings } from "@/lib/theme";
import { useAuth } from "@/context/AuthProvider";
import { useCredits } from "@/context/CreditsProvider";

type CompanyListItem = { id: string; name: string };
type TaskItem = { id: string; title: string; dueAt?: string; status: string; companyId: string; companyName: string };
type UserPrefs = {
  theme: "dark" | "light" | "system";
  fontSize: "small" | "normal" | "large";
  density: "compact" | "comfortable" | "large";
  avatarUrl: string;
  displayName: string;
};

const API_URL = getApiBaseUrl();
const PREFS_KEY = "nodere_user_preferences";

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
    const themeSettings = readThemeSettings();
    return { ...defaultPrefs, displayName: profile.name || "", ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"), theme: themeSettings.mode };
  } catch {
    return defaultPrefs;
  }
}

function applyPrefs(prefs: UserPrefs) {
  if (typeof window === "undefined") return;
  persistAndApplyThemeSettings({ mode: prefs.theme, fontSize: prefs.fontSize, layoutDensity: prefs.density });
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function Header() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [open, setOpen] = useState(false);
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs>(defaultPrefs);
  const [globalQuery, setGlobalQuery] = useState("");
  const [unreadInbox, setUnreadInbox] = useState(0);
  const [brandName, setBrandName] = useState("NODERE");
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, workspace, logout } = useAuth();
  const { credits } = useCredits();

  const pageTitle = useMemo(() => getPageTitle(pathname || "/"), [pathname]);
  const dashboardHref = pathname?.startsWith("/app") ? "/app/dashboard" : "/dashboard";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readPrefs();
    setPrefs(stored);
    applyThemeSettings(readThemeSettings());
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
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadTasks() {
      try {
        const token = localStorage.getItem("nodere_admin_token") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const companies = (await fetch(`${API_URL}/companies`, { cache: "no-store", headers }).then((res) => res.ok ? res.json() : [])) as CompanyListItem[];
        const taskGroups = await Promise.all(
          companies.slice(0, 80).map(async (company) => {
            const companyTasks = await fetch(`${API_URL}/companies/${company.id}/tasks`, { cache: "no-store", headers }).then((res) => res.ok ? res.json() : []);
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

  async function installApp() {
    const promptEvent = installPrompt as Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };
    if (promptEvent?.prompt) {
      await promptEvent.prompt();
      await promptEvent.userChoice?.catch(() => undefined);
      setInstallPrompt(null);
      return;
    }
    alert("Para instalar o app NODERE, abra o menu do navegador e selecione 'Instalar app' ou 'Adicionar à tela inicial'.");
  }

  return (
    <header className="nodere-topbar sticky top-0 z-20 border-b border-line bg-ink/90 px-3 py-3 backdrop-blur md:px-5 xl:px-8">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 xl:flex-nowrap xl:gap-4">
        <Link href={dashboardHref} className="min-w-0 flex-1 xl:flex-none">
          <span className="block truncate text-base font-semibold text-[var(--text-primary)] md:text-lg">{pageTitle}</span>
          <span className="hidden max-w-full truncate text-xs text-[var(--text-secondary)] sm:block">{brandName} · Operação comercial e inteligência de prospecção</span>
        </Link>

        <form onSubmit={submitGlobalSearch} className="order-3 hidden min-w-0 w-full items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2 md:flex xl:order-none xl:max-w-md">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={globalQuery}
            onChange={(event) => setGlobalQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none"
            placeholder="Buscar empresa, cidade ou segmento"
            aria-label="Buscar empresas salvas no CRM"
          />
        </form>

        <div className="flex min-w-0 shrink-0 items-center gap-2">
          {credits && (
            <Link
              href="/billing"
              className={`hidden shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold sm:inline-flex ${
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
            onClick={() => void installApp()}
            className="hidden shrink-0 items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-electric/60 hover:bg-electric/10 2xl:inline-flex"
            title="Instalar aplicativo NODERE"
          >
            <Download className="h-4 w-4" />
            App
          </button>

          <button
            type="button"
            className="flex min-w-0 shrink items-center gap-2 rounded-lg border border-line bg-white/5 px-2 py-1.5 text-left hover:border-electric/60 hover:bg-electric/10"
            onClick={() => setShowPrefsModal(true)}
            title="Preferências"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--blue)] text-sm font-semibold text-white">
                {initial}
              </div>
            )}
            <span className="hidden max-w-28 truncate text-sm font-bold text-[var(--text-primary)] xl:block 2xl:max-w-52" title={shownName}>{shownName}</span>
            <span aria-hidden="true" title="Preferências">⚙️</span>
          </button>

          <button onClick={logout} className="hidden rounded-lg border border-line px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-white/10 sm:inline-flex">
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
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Preferências rápidas</h2>
                <p className="text-sm text-[var(--text-secondary)]">Tema, leitura, densidade e foto ficam salvos neste navegador.</p>
              </div>
              <button type="button" onClick={() => setShowPrefsModal(false)} className="rounded-lg border border-line p-2 text-[var(--text-primary)]" aria-label="Fechar preferências">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Tema</span>
                <select value={prefs.theme} onChange={(event) => updatePrefs({ theme: event.target.value as UserPrefs["theme"] })} className="mt-2 min-h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm outline-none">
                  <option value="dark">Escuro</option>
                  <option value="light">Claro</option>
                  <option value="system">Sistema</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Fonte</span>
                <select value={prefs.fontSize} onChange={(event) => updatePrefs({ fontSize: event.target.value as UserPrefs["fontSize"] })} className="mt-2 min-h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm outline-none">
                  <option value="small">Pequena</option>
                  <option value="normal">Normal</option>
                  <option value="large">Grande</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Densidade</span>
                <select value={prefs.density} onChange={(event) => updatePrefs({ density: event.target.value as UserPrefs["density"] })} className="mt-2 min-h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm outline-none">
                  <option value="compact">Compacto</option>
                  <option value="comfortable">Confortável</option>
                  <option value="large">Amplo</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Foto</span>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Nome exibido</span>
                <input value={prefs.displayName} onChange={(event) => updatePrefs({ displayName: event.target.value })} placeholder="Ex.: ÉDIPO LIMA" className="mt-2 min-h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm outline-none" />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-between gap-2">
              <button type="button" onClick={logout} className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/15">
                Sair
              </button>
              <div className="flex gap-2">
              <button type="button" onClick={() => updatePrefs({ ...defaultPrefs, avatarUrl })} className="btn-secondary-action px-4 py-2 text-sm">Restaurar</button>
              <button type="button" onClick={() => setShowPrefsModal(false)} className="btn-action px-4 py-2 text-sm">Salvar</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </header>
  );
}
