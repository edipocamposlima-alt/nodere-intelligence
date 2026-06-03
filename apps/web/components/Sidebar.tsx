"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, Building2, CalendarDays, CircleHelp, CreditCard, Inbox, KanbanSquare, LineChart, Megaphone, PackageOpen, Plug, Search, Settings, ShieldCheck, Users, Workflow, Zap } from "lucide-react";
import { getBillingStatus } from "@/lib/api";

const items = [
  { href: "/", label: "Início", icon: BarChart3, hex: "#0EA5E9", bg: "linear-gradient(135deg,#0284C7,#38BDF8)" },
  { href: "/searches", label: "Busca de empresas", icon: Search, hex: "#06B6D4", bg: "linear-gradient(135deg,#0891B2,#22D3EE)" },
  { href: "/companies", label: "Empresas", icon: Building2, hex: "#2563EB", bg: "linear-gradient(135deg,#1D4ED8,#60A5FA)" },
  { href: "/crm", label: "CRM / Funil", icon: KanbanSquare, hex: "#A855F7", bg: "linear-gradient(135deg,#7C3AED,#C084FC)" },
  { href: "/intelligence", label: "Inteligência", icon: Zap, hex: "#FACC15", bg: "linear-gradient(135deg,#EAB308,#F97316)" },
  { href: "/inbox", label: "Caixa de entrada", icon: Inbox, hex: "#10B981", bg: "linear-gradient(135deg,#059669,#34D399)" },
  { href: "/calendar", label: "Calendário", icon: CalendarDays, hex: "#F59E0B", bg: "linear-gradient(135deg,#D97706,#FDE047)" },
  { href: "/automations", label: "Automações", icon: Workflow, hex: "#E879F9", bg: "linear-gradient(135deg,#C026D3,#F0ABFC)" },
  { href: "/operators", label: "Operadores", icon: Users, hex: "#6366F1", bg: "linear-gradient(135deg,#4F46E5,#818CF8)" },
  { href: "/reports", label: "Relatórios", icon: LineChart, hex: "#84CC16", bg: "linear-gradient(135deg,#65A30D,#A3E635)" },
  { href: "/marketing", label: "Marketing", icon: Megaphone, hex: "#EC4899", bg: "linear-gradient(135deg,#DB2777,#FB7185)" },
  { href: "/catalog", label: "Catálogo", icon: PackageOpen, hex: "#22C55E", bg: "linear-gradient(135deg,#16A34A,#86EFAC)" },
  { href: "/billing", label: "Faturamento", icon: CreditCard, hex: "#F97316", bg: "linear-gradient(135deg,#EA580C,#FDBA74)" },
  { href: "/integrations", label: "Integrações", icon: Plug, hex: "#14B8A6", bg: "linear-gradient(135deg,#0D9488,#5EEAD4)" },
  { href: "/settings", label: "Configurações", icon: Settings, hex: "#3B82F6", bg: "linear-gradient(135deg,#2563EB,#93C5FD)" },
  { href: "/manual", label: "Ajuda / Manual NODERE", icon: CircleHelp, hex: "#F43F5E", bg: "linear-gradient(135deg,#E11D48,#FDA4AF)" },
  { href: "/admin", label: "Administrador", icon: ShieldCheck, hex: "#1D4ED8", bg: "linear-gradient(135deg,#1D4ED8,#22D3EE)" }
];

export function Sidebar() {
  const [billing, setBilling] = useState<Awaited<ReturnType<typeof getBillingStatus>> | null>(null);

  useEffect(() => {
    getBillingStatus().then(setBilling).catch(() => setBilling(null));
  }, []);

  return (
    <aside className="hidden min-h-screen w-72 border-r border-line bg-ink/90 p-5 lg:block">
      <Link href="/" className="flex items-center gap-3 rounded-xl border border-line bg-panel/70 p-3 transition hover:border-electric/60">
        <Image src="/nodere-logo.png" alt="NODERE" width={42} height={42} priority className="h-10 w-10 rounded-lg object-contain" />
        <div>
          <p className="text-sm font-semibold text-white">NODERE</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan">Intelligence</p>
        </div>
      </Link>

      <nav className="mt-8 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-[0_0_18px_rgba(56,189,248,0.22)]" style={{ background: item.bg }}>
              <item.icon className="h-4 w-4 text-white drop-shadow" style={{ strokeWidth: 2.9 }} />
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {billing && (
        <div className="mt-6 rounded-lg border border-line bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Créditos — {billing.plan.name}</span>
            <span className="font-medium text-white">{billing.balance.toLocaleString("pt-BR")}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-cyan transition-all"
              style={{ width: `${Math.min(100, (billing.balance / billing.plan.monthlyCredits) * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-600">{billing.used} usados este mês</p>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-electric/30 bg-electric/10 p-4">
        <ShieldCheck className="h-5 w-5 text-cyan" />
        <p className="mt-3 text-sm font-medium text-white">Scanner de oportunidades</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">Busca local, score comercial e CRM leve em um fluxo rapido.</p>
      </div>
    </aside>
  );
}
