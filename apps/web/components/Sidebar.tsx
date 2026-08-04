"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Building2, CalendarDays, CircleHelp, ClipboardList, CreditCard, KanbanSquare, LineChart, MessagesSquare, PackageOpen, Plug, Search, Settings, ShieldCheck, Users } from "lucide-react";
import { useCredits } from "@/context/CreditsProvider";
import { canUseModule, useAuth } from "@/context/AuthProvider";
import { Logo } from "@/components/brand/Logo";

const groups = [
  {
    label: "Operação",
    items: [
      { href: "/ai", label: "NODERE AI", icon: Bot, tone: "green", module: "dashboard" },
      { href: "/dashboard", appHref: "/app/dashboard", label: "Dashboard", icon: BarChart3, tone: "neutral", module: "dashboard" },
      { href: "/searches", appHref: "/app/discovery", label: "Prospecção e pesquisa", icon: Search, tone: "cyan", module: "buscas" },
      { href: "/crm", label: "Funil comercial", icon: KanbanSquare, tone: "green", module: "crm" },
      { href: "/companies", label: "Empresas e clientes", icon: Building2, tone: "blue", module: "crm" },
      { href: "/crm/communications", label: "Comunicações", icon: MessagesSquare, tone: "cyan", module: "crm" },
      { href: "/calendario", label: "Agenda", icon: CalendarDays, tone: "blue", module: "agenda" }
    ]
  },
  {
    label: "Comercial",
    items: [
      { href: "/crm/briefings", label: "Briefings", icon: ClipboardList, tone: "gold", module: "crm" },
      { href: "/app/proposals", label: "Propostas e contratos", icon: PackageOpen, tone: "purple", module: "crm" },
      { href: "/catalog", label: "Produtos e serviços", icon: PackageOpen, tone: "orange", module: "crm" },
      { href: "/reports", label: "Relatórios", icon: LineChart, tone: "blue", module: "relatorios" }
    ]
  },
  {
    label: "Administração",
    items: [
      { href: "/operators", label: "Usuários e permissões", icon: Users, tone: "green", adminOnly: true, module: "admin" },
      { href: "/settings", appHref: "/app/settings", label: "Configurações", icon: Settings, tone: "neutral", module: "admin" },
      { href: "/integrations", label: "Integrações", icon: Plug, tone: "cyan", adminOnly: true, module: "integracoes" },
      { href: "/admin", label: "Administração técnica", icon: ShieldCheck, tone: "red", adminOnly: true, module: "admin" },
      { href: "/billing", label: "Plano e faturamento", icon: CreditCard, tone: "gold", module: "admin" },
      { href: "/manual", label: "Manual NODERE", icon: CircleHelp, tone: "blue", module: "dashboard" }
    ]
  }
];

export function Sidebar() {
  const { credits, daysLeft, trialExpired } = useCredits();
  const { user } = useAuth();
  const pathname = usePathname() || "/";
  const isApp = pathname.startsWith("/app");
  const isAdmin = user?.role === "owner" || user?.role === "admin";
  const dashboardHref = isApp ? "/app/dashboard" : "/ai";
  const total = credits?.total || 0;
  const remaining = credits?.remaining || 0;
  const used = credits?.used || 0;
  const isInternalOwner = credits?.account_type === "OWNER_INTERNAL";
  const progress = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;

  return (
    <aside className="nodere-sidebar hidden h-[100dvh] w-64 shrink-0 overflow-hidden border-r border-[var(--border-soft)] bg-[var(--bg-sidebar)] p-4 text-[var(--text-secondary)] xl:w-72 xl:p-5 lg:flex lg:flex-col">
      <Link href={dashboardHref} className="flex items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-5 transition hover:border-[var(--brand-primary)]">
        <Logo variant="full" height={38} />
      </Link>

      <nav className="nodere-tools-scroll mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 xl:mt-8 xl:space-y-5">
        {groups.map((group) => (
          <section key={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{group.label}</p>
            {group.items.filter((item) => (!item.adminOnly || isAdmin) && canUseModule(user, item.module) && !(isInternalOwner && item.href === "/billing")).map((item) => {
              const href = isApp && item.appHref ? item.appHref : item.href;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={`${group.label}-${item.label}-${href}`}
                  href={href}
                  className={`group flex min-w-0 items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition hover:border-[var(--brand-primary)] hover:bg-[var(--nav-active-bg)] hover:text-[var(--text-primary)] ${active ? "border-[var(--brand-primary)] bg-[var(--nav-active-bg)] text-[var(--text-primary)]" : "border-transparent text-[var(--text-secondary)]"}`}
                >
                  <span className="nodere-nav-icon-tone flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition group-hover:scale-[1.02]" data-icon-tone={item.tone}>
                    <item.icon className="nav-icon" />
                  </span>
                  <span className="min-w-0 truncate">{item.label}</span>
                </Link>
              );
            })}
          </section>
        ))}
      </nav>

      {credits && (
        <div className="mt-4 shrink-0 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
          {isInternalOwner ? (
            <div className="text-xs">
              <p className="font-bold text-emerald-300">Conta interna do proprietário</p>
              <p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">Consumo técnico auditado, sem saldo artificial e sem bloqueio comercial.</p>
            </div>
          ) : (<>
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
          </>)}
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
