"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, CalendarDays, CircleHelp, CreditCard, Inbox, KanbanSquare, LineChart, Megaphone, PackageOpen, Plug, Search, Settings, ShieldCheck, Users, Workflow, Zap } from "lucide-react";
import { useCredits } from "@/context/CreditsProvider";
import { useAuth } from "@/context/AuthProvider";
import { Logo } from "@/components/brand/Logo";

const groups = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", appHref: "/app/dashboard", label: "Dashboard", icon: BarChart3 },
      { href: "/searches", appHref: "/app/discovery", label: "Prospecção", icon: Search },
      { href: "/companies", label: "Empresas", icon: Building2 },
      { href: "/crm", label: "CRM / Funil", icon: KanbanSquare }
    ]
  },
  {
    label: "Comercial",
    items: [
      { href: "/app/leads", label: "Leads", icon: Users },
      { href: "/calendario", label: "Agenda", icon: CalendarDays },
      { href: "/app/proposals", label: "Propostas e Contratos", icon: PackageOpen },
      { href: "/catalog", label: "Produtos / Serviços", icon: PackageOpen }
    ]
  },
  {
    label: "Comunicação",
    items: [
      { href: "/inbox", label: "Caixa de Entrada", icon: Inbox },
      { href: "/automations", label: "Automações", icon: Workflow }
    ]
  },
  {
    label: "Inteligência",
    items: [
      { href: "/intelligence", label: "IA / Inteligência", icon: Zap },
      { href: "/reports", label: "Relatórios", icon: LineChart }
    ]
  },
  {
    label: "Gestão",
    items: [
      { href: "/operators", label: "Operadores", icon: Users, adminOnly: true },
      { href: "/marketing", label: "Marketing", icon: Megaphone },
      { href: "/billing", label: "Faturamento", icon: CreditCard },
      { href: "/settings", appHref: "/app/settings", label: "Configurações", icon: Settings }
    ]
  },
  {
    label: "Administração",
    items: [
      { href: "/integrations", label: "Integrações", icon: Plug, adminOnly: true },
      { href: "/admin", label: "Administrador / CMS", icon: ShieldCheck, adminOnly: true },
      { href: "/manual", label: "Manual NODERE", icon: CircleHelp }
    ]
  }
];

export function Sidebar() {
  const { credits, daysLeft, trialExpired } = useCredits();
  const { user } = useAuth();
  const pathname = usePathname() || "/";
  const isApp = pathname.startsWith("/app");
  const isAdmin = user?.role === "owner" || user?.role === "admin";
  const dashboardHref = isApp ? "/app/dashboard" : "/dashboard";
  const total = credits?.total || 0;
  const remaining = credits?.remaining || 0;
  const used = credits?.used || 0;
  const progress = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;

  return (
    <aside className="hidden h-[100dvh] w-72 overflow-hidden border-r border-[var(--border-soft)] bg-[var(--bg-sidebar)] p-5 text-[var(--text-secondary)] lg:flex lg:flex-col">
      <Link href={dashboardHref} className="flex items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-5 transition hover:border-[var(--brand-primary)]">
        <Logo variant="full" height={38} />
      </Link>

      <nav className="nodere-tools-scroll mt-8 min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        {groups.map((group) => (
          <section key={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{group.label}</p>
            {group.items.filter((item) => !item.adminOnly || isAdmin).map((item) => {
              const href = isApp && item.appHref ? item.appHref : item.href;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={`${group.label}-${item.label}-${href}`}
                  href={href}
                  className={`group flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition hover:border-[var(--brand-primary)] hover:bg-[var(--nav-active-bg)] hover:text-[var(--text-primary)] ${active ? "border-[var(--brand-primary)] bg-[var(--nav-active-bg)] text-[var(--text-primary)]" : "border-transparent text-[var(--text-secondary)]"}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-muted)] transition group-hover:border-[var(--brand-primary)] group-hover:text-[var(--brand-glow)]">
                    <item.icon className="h-4 w-4" style={{ strokeWidth: 2.4 }} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </section>
        ))}
      </nav>

      {credits && (
        <div className="mt-4 shrink-0 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Créditos — {credits.plan}</span>
            <span className="font-medium text-[var(--text-primary)]">{remaining.toLocaleString("pt-BR")} / {total.toLocaleString("pt-BR")}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-hover)]">
            <div
              className={`h-1.5 rounded-full transition-all ${trialExpired || remaining <= 0 ? "bg-[var(--danger)]" : remaining <= 5 ? "bg-[var(--warning)]" : "bg-[var(--brand-primary)]"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
            {used} usados{credits.plan === "trial" && daysLeft !== null ? ` · Trial ${trialExpired ? "expirado" : `vence em ${Math.max(0, daysLeft)} dia(s)`}` : ""}
          </p>
        </div>
      )}

      <div className="mt-4 shrink-0 rounded-lg border border-[var(--border-brand)] bg-[var(--nav-active-bg)] p-4">
        <ShieldCheck className="h-5 w-5 text-[var(--brand-glow)]" />
        <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">Ambiente seguro</p>
        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Dados isolados por workspace, APIs via backend e operação comercial protegida.</p>
      </div>
    </aside>
  );
}
