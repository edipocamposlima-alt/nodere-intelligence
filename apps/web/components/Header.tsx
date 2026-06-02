"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bell, Search, ShieldCheck } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";

type CompanyListItem = { id: string; name: string };
type TaskItem = { id: string; title: string; dueAt?: string; status: string; companyId: string; companyName: string };

const API_URL = getApiBaseUrl();

export function Header() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
    if (path.startsWith("/billing")) return "Faturamento";
    return "Dashboard Executivo";
  }, [pathname]);

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

  const alerts = useMemo(() => {
    const now = new Date();
    const endToday = new Date(now);
    endToday.setHours(23, 59, 59, 999);
    return tasks
      .filter((task) => task.dueAt && new Date(task.dueAt) <= endToday)
      .sort((a, b) => new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime());
  }, [tasks]);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="min-w-0">
          <span className="block truncate text-base font-semibold text-white md:text-lg">{pageTitle}</span>
          <span className="hidden text-xs text-slate-500 sm:block">Operação comercial e inteligência de prospecção</span>
        </Link>

        <div className="hidden w-full max-w-md items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            className="w-full bg-transparent text-sm text-slate-200 outline-none"
            placeholder="Buscar empresa, cidade ou segmento"
          />
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg border border-electric/40 bg-electric/10 px-3 py-2 text-sm font-semibold text-blue-200 hover:bg-electric/20">
            <ShieldCheck className="h-4 w-4" />
            Admin
          </Link>
          <div className="relative">
            <button
              onClick={() => setOpen((value) => !value)}
              className="relative rounded-lg border border-line bg-white/5 p-2 text-slate-300 hover:text-white"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              {alerts.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-ink">
                  {alerts.length}
                </span>
              )}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-line bg-panel p-3 shadow-glow">
                <p className="text-sm font-semibold text-white">Lembretes e follow-ups</p>
                {alerts.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">Nenhum lembrete vencido ou para hoje.</p>
                ) : (
                  <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                    {alerts.slice(0, 8).map((task) => (
                      <Link key={task.id} href={`/companies/${task.companyId}`} className="block rounded-md border border-line bg-ink px-3 py-2 hover:border-electric/60">
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
    </header>
  );
}
