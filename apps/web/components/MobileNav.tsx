"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Building2, CalendarDays, CircleHelp, CreditCard, Download, Inbox, KanbanSquare, LineChart, LogOut, Megaphone, Menu, PackageOpen, Plug, Search, Settings, ShieldCheck, Users, Workflow, X, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";

const primaryItems = [
  { href: "/dashboard", appHref: "/app/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/searches", appHref: "/app/discovery", label: "Prospecção", icon: Search },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/crm", label: "CRM", icon: KanbanSquare }
];

const drawerItems = [
  { href: "/calendario", label: "Agenda", icon: CalendarDays },
  { href: "/app/leads", label: "Leads", icon: Users },
  { href: "/app/proposals", label: "Propostas e Contratos", icon: PackageOpen },
  { href: "/catalog", label: "Produtos / Serviços", icon: PackageOpen },
  { href: "/inbox", label: "Caixa de Entrada", icon: Inbox },
  { href: "/automations", label: "Automações", icon: Workflow },
  { href: "/intelligence", label: "IA / Inteligência", icon: Zap },
  { href: "/reports", label: "Relatórios", icon: LineChart },
  { href: "/operators", label: "Operadores", icon: Users, adminOnly: true },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/billing", label: "Faturamento", icon: CreditCard },
  { href: "/settings", appHref: "/app/settings", label: "Configurações", icon: Settings },
  { href: "/integrations", label: "Integrações", icon: Plug, adminOnly: true },
  { href: "/admin", label: "Administrador / CMS", icon: ShieldCheck, adminOnly: true },
  { href: "/manual", label: "Manual NODERE", icon: CircleHelp }
];

export function MobileNav() {
  const pathname = usePathname() || "/";
  const isApp = pathname.startsWith("/app");
  const [open, setOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "owner" || user?.role === "admin";

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  async function installApp() {
    const promptEvent = installPrompt as Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };
    if (promptEvent?.prompt) {
      await promptEvent.prompt();
      await promptEvent.userChoice?.catch(() => undefined);
      setInstallPrompt(null);
      setOpen(false);
      return;
    }
    window.alert("Para instalar o app NODERE, abra o menu do navegador e selecione 'Instalar app' ou 'Adicionar à tela inicial'.");
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-line bg-ink/95 px-1 py-1.5 shadow-[0_-14px_40px_rgba(0,0,0,0.35)] backdrop-blur lg:hidden">
        {primaryItems.map((item) => (
          <MobileLink key={item.href} item={item} isApp={isApp} activePathname={pathname} onClick={() => setOpen(false)} />
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold text-slate-200"
          aria-label="Abrir menu"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/15 ring-1 ring-electric/30">
            <Menu className="h-4 w-4 text-cyan" />
          </span>
          Menu
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/55 lg:hidden" onClick={() => setOpen(false)}>
          <section
            className="absolute bottom-0 left-0 right-0 max-h-[82dvh] overflow-y-auto rounded-t-2xl border border-line bg-ink p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-glow"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Menu NODERE</p>
                <p className="text-xs text-slate-400">Todas as funcionalidades da plataforma.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-line bg-panel p-2 text-white" aria-label="Fechar menu">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void installApp()}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-electric/35 bg-electric/10 px-3 py-2 text-sm font-semibold text-slate-100"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric/15 text-cyan shadow-[0_0_18px_rgba(0,223,130,0.18)] ring-1 ring-electric/30">
                  <Download className="nodere-icon" />
                </span>
                Instalar app
              </button>
              {drawerItems.filter((item) => !item.adminOnly || isAdmin).map((item) => (
                <Link
                  key={`${item.label}-${isApp && item.appHref ? item.appHref : item.href}`}
                  href={isApp && item.appHref ? item.appHref : item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-panel/80 px-3 py-2 text-sm font-semibold text-slate-200"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric/15 text-cyan shadow-[0_0_18px_rgba(0,223,130,0.18)] ring-1 ring-electric/30">
                    <item.icon className="nodere-icon" />
                  </span>
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void logout();
                }}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-danger/35 bg-danger/10 px-3 py-2 text-sm font-semibold text-rose-100"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger/15 text-rose-200 ring-1 ring-danger/30">
                  <LogOut className="nodere-icon" />
                </span>
                Sair
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function MobileLink({ item, isApp, activePathname, onClick }: { item: (typeof primaryItems)[number]; isApp: boolean; activePathname: string; onClick: () => void }) {
  const href = isApp && item.appHref ? item.appHref : item.href;
  const active = activePathname === href || activePathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition ${active ? "bg-white/10 text-white" : "text-slate-300"}`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-[0_0_18px_rgba(0,223,130,0.18)] ring-1 ${active ? "bg-electric text-white ring-electric/50" : "bg-electric/12 text-cyan ring-electric/25"}`}>
        <item.icon className="nodere-icon" />
      </span>
      {item.label}
    </Link>
  );
}
