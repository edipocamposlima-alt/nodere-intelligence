import Image from "next/image";
import Link from "next/link";
import { BarChart3, Building2, CalendarClock, CircleHelp, CreditCard, History, Inbox, KanbanSquare, LineChart, Plug, Search, Settings, ShieldCheck, Users, Workflow, Zap } from "lucide-react";
import { getBillingStatus } from "@/lib/api";

const items = [
  { href: "/", label: "Dashboard", icon: BarChart3, hex: "#0284C7", bg: "#E0F2FE" },
  { href: "/searches", label: "Busca de empresas", icon: Search, hex: "#0891B2", bg: "#CFFAFE" },
  { href: "/companies", label: "Empresas", icon: Building2, hex: "#2563EB", bg: "#DBEAFE" },
  { href: "/crm", label: "CRM / Funil", icon: KanbanSquare, hex: "#7C3AED", bg: "#EDE9FE" },
  { href: "/crm#agenda", label: "Agenda", icon: CalendarClock, hex: "#D97706", bg: "#FEF3C7" },
  { href: "/intelligence", label: "Inteligência", icon: Zap, hex: "#EAB308", bg: "#FEF9C3" },
  { href: "/inbox", label: "Caixa de entrada", icon: Inbox, hex: "#059669", bg: "#D1FAE5" },
  { href: "/automations", label: "Automações", icon: Workflow, hex: "#C026D3", bg: "#FAE8FF" },
  { href: "/operators", label: "Operadores", icon: Users, hex: "#4F46E5", bg: "#E0E7FF" },
  { href: "/reports", label: "Relatórios", icon: LineChart, hex: "#65A30D", bg: "#ECFCCB" },
  { href: "/billing", label: "Faturamento", icon: CreditCard, hex: "#EA580C", bg: "#FFEDD5" },
  { href: "/integrations", label: "Integrações", icon: Plug, hex: "#0D9488", bg: "#CCFBF1" },
  { href: "/settings", label: "Configurações", icon: Settings, hex: "#475569", bg: "#E2E8F0" },
  { href: "/manual", label: "Ajuda / Manual NODERE", icon: CircleHelp, hex: "#E11D48", bg: "#FFE4E6" },
  { href: "/admin", label: "Administrador", icon: ShieldCheck, hex: "#1D4ED8", bg: "#DBEAFE" }
];

export async function Sidebar() {
  const billing = await getBillingStatus().catch(() => null);

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
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm" style={{ backgroundColor: item.bg }}>
              <item.icon className="h-4 w-4" style={{ color: item.hex, strokeWidth: 2.7 }} />
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
