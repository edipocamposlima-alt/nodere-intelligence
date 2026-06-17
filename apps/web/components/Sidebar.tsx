"use client";

import Link from "next/link";
import { BarChart3, Building2, CalendarDays, CircleHelp, CreditCard, Inbox, KanbanSquare, LineChart, Megaphone, PackageOpen, Plug, Search, Settings, ShieldCheck, Users, Workflow, Zap } from "lucide-react";
import { useCredits } from "@/context/CreditsProvider";
import { Logo } from "@/components/ui/Logo";

const items = [
  { href: "/dashboard", label: "Início", icon: BarChart3 },
  { href: "/searches", label: "Busca de empresas", icon: Search },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/crm", label: "CRM / Funil", icon: KanbanSquare },
  { href: "/intelligence", label: "Inteligência", icon: Zap },
  { href: "/inbox", label: "Caixa de entrada", icon: Inbox },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/automations", label: "Automações", icon: Workflow },
  { href: "/operators", label: "Operadores", icon: Users },
  { href: "/reports", label: "Relatórios", icon: LineChart },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/catalog", label: "Catálogo", icon: PackageOpen },
  { href: "/billing", label: "Faturamento", icon: CreditCard },
  { href: "/integrations", label: "Integrações", icon: Plug },
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/manual", label: "Ajuda / Manual NODERE", icon: CircleHelp },
  { href: "/admin", label: "Administrador", icon: ShieldCheck }
];

export function Sidebar() {
  const { credits, daysLeft, trialExpired } = useCredits();
  const total = credits?.total || 0;
  const remaining = credits?.remaining || 0;
  const used = credits?.used || 0;
  const progress = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;

  return (
    <aside className="hidden min-h-screen w-72 border-r border-[var(--border-soft)] bg-[var(--bg-sidebar)] p-5 text-[var(--text-secondary)] lg:block">
      <Link href="/dashboard" className="flex items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-5 transition hover:border-[var(--brand-primary)]">
        <Logo variant="full" size="xl" />
      </Link>

      <nav className="mt-8 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:bg-[rgba(3,98,76,0.14)] hover:text-[var(--text-primary)]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-muted)] transition group-hover:border-[var(--brand-primary)] group-hover:text-[var(--brand-glow)]">
              <item.icon className="h-4 w-4" style={{ strokeWidth: 2.4 }} />
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {credits && (
        <div className="mt-6 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
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

      <div className="mt-4 rounded-lg border border-[rgba(3,98,76,0.35)] bg-[rgba(3,98,76,0.12)] p-4">
        <ShieldCheck className="h-5 w-5 text-[var(--brand-glow)]" />
        <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">Ambiente seguro</p>
        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Dados isolados por workspace, APIs via backend e operação comercial protegida.</p>
      </div>
    </aside>
  );
}
