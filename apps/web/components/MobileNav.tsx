"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Building2, CalendarDays, CircleHelp, CreditCard, Inbox, KanbanSquare, LineChart, Megaphone, Menu, PackageOpen, Plug, Search, Settings, ShieldCheck, Users, Workflow, X, Zap } from "lucide-react";

const primaryItems = [
  { href: "/", label: "Início", icon: BarChart3, bg: "linear-gradient(135deg,#0284C7,#38BDF8)" },
  { href: "/searches", label: "Busca", icon: Search, bg: "linear-gradient(135deg,#0891B2,#22D3EE)" },
  { href: "/crm", label: "CRM", icon: KanbanSquare, bg: "linear-gradient(135deg,#7C3AED,#C084FC)" },
  { href: "/calendario", label: "Calendário", icon: CalendarDays, bg: "linear-gradient(135deg,#D97706,#FDE047)" }
];

const drawerItems = [
  { href: "/companies", label: "Empresas", icon: Building2, bg: "linear-gradient(135deg,#1D4ED8,#60A5FA)" },
  { href: "/intelligence", label: "Inteligência", icon: Zap, bg: "linear-gradient(135deg,#EAB308,#F97316)" },
  { href: "/inbox", label: "Caixa de entrada", icon: Inbox, bg: "linear-gradient(135deg,#059669,#34D399)" },
  { href: "/automations", label: "Automações", icon: Workflow, bg: "linear-gradient(135deg,#C026D3,#F0ABFC)" },
  { href: "/operators", label: "Operadores", icon: Users, bg: "linear-gradient(135deg,#4F46E5,#818CF8)" },
  { href: "/reports", label: "Relatórios", icon: LineChart, bg: "linear-gradient(135deg,#65A30D,#A3E635)" },
  { href: "/marketing", label: "Marketing", icon: Megaphone, bg: "linear-gradient(135deg,#DB2777,#FB7185)" },
  { href: "/catalog", label: "Catálogo", icon: PackageOpen, bg: "linear-gradient(135deg,#16A34A,#86EFAC)" },
  { href: "/billing", label: "Faturamento", icon: CreditCard, bg: "linear-gradient(135deg,#EA580C,#FDBA74)" },
  { href: "/integrations", label: "Integrações", icon: Plug, bg: "linear-gradient(135deg,#0D9488,#5EEAD4)" },
  { href: "/settings", label: "Configurações", icon: Settings, bg: "linear-gradient(135deg,#2563EB,#93C5FD)" },
  { href: "/manual", label: "Ajuda / Manual", icon: CircleHelp, bg: "linear-gradient(135deg,#E11D48,#FDA4AF)" },
  { href: "/admin", label: "Administrador", icon: ShieldCheck, bg: "linear-gradient(135deg,#1D4ED8,#22D3EE)" }
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
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-950 ring-1 ring-white/10">
            <Menu className="h-4 w-4 text-white" />
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
                <p className="text-sm font-semibold text-white">Menu NODERI</p>
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
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-[0_0_18px_rgba(56,189,248,0.22)]" style={{ background: item.bg }}>
                    <item.icon className="h-4 w-4 text-white" style={{ strokeWidth: 2.9 }} />
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
      <span className="flex h-8 w-8 items-center justify-center rounded-lg shadow-[0_0_18px_rgba(56,189,248,0.22)]" style={{ background: item.bg }}>
        <item.icon className="h-4 w-4 text-white" style={{ strokeWidth: 2.9 }} />
      </span>
      {item.label}
    </Link>
  );
}
