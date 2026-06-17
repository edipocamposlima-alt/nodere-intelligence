"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Building2, CalendarDays, CircleHelp, CreditCard, Inbox, KanbanSquare, LineChart, Megaphone, Menu, PackageOpen, Plug, Search, Settings, ShieldCheck, Users, Workflow, X, Zap } from "lucide-react";

const primaryItems = [
  { href: "/", label: "Início", icon: BarChart3 },
  { href: "/searches", label: "Busca", icon: Search },
  { href: "/crm", label: "CRM", icon: KanbanSquare },
  { href: "/calendario", label: "Calendário", icon: CalendarDays }
];

const drawerItems = [
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/intelligence", label: "Inteligência", icon: Zap },
  { href: "/inbox", label: "Caixa de entrada", icon: Inbox },
  { href: "/automations", label: "Automações", icon: Workflow },
  { href: "/operators", label: "Operadores", icon: Users },
  { href: "/reports", label: "Relatórios", icon: LineChart },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/catalog", label: "Catálogo", icon: PackageOpen },
  { href: "/billing", label: "Faturamento", icon: CreditCard },
  { href: "/integrations", label: "Integrações", icon: Plug },
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/manual", label: "Ajuda / Manual", icon: CircleHelp },
  { href: "/admin", label: "Administrador", icon: ShieldCheck }
];

export function MobileNav() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-line bg-ink/95 px-1 py-1.5 shadow-[0_-14px_40px_rgba(0,0,0,0.35)] backdrop-blur lg:hidden">
        {primaryItems.map((item) => (
          <MobileLink key={item.href} item={item} active={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))} onClick={() => setOpen(false)} />
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
            className="absolute bottom-0 left-0 right-0 max-h-[78vh] overflow-y-auto rounded-t-2xl border border-line bg-ink p-4 shadow-glow"
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
              {drawerItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-panel/80 px-3 py-2 text-sm font-semibold text-slate-200"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric/15 text-cyan shadow-[0_0_18px_rgba(0,223,130,0.18)] ring-1 ring-electric/30">
                    <item.icon className="h-4 w-4" style={{ strokeWidth: 2.9 }} />
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function MobileLink({ item, active, onClick }: { item: (typeof primaryItems)[number]; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition ${active ? "bg-white/10 text-white" : "text-slate-300"}`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-[0_0_18px_rgba(0,223,130,0.18)] ring-1 ${active ? "bg-electric text-white ring-electric/50" : "bg-electric/12 text-cyan ring-electric/25"}`}>
        <item.icon className="h-4 w-4" style={{ strokeWidth: 2.9 }} />
      </span>
      {item.label}
    </Link>
  );
}
