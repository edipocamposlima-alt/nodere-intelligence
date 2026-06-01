import Image from "next/image";
import Link from "next/link";
import { BarChart3, Building2, CalendarClock, CircleHelp, CreditCard, History, Inbox, KanbanSquare, LineChart, Plug, Search, Settings, ShieldCheck, Users, Workflow, Zap } from "lucide-react";
import { getBillingStatus } from "@/lib/api";

const items = [
  { href: "/", label: "Dashboard", icon: BarChart3, color: "text-sky-300", bg: "bg-sky-500/10" },
  { href: "/searches", label: "Busca de empresas", icon: Search, color: "text-cyan", bg: "bg-cyan/10" },
  { href: "/companies", label: "Empresas", icon: Building2, color: "text-blue-300", bg: "bg-blue-500/10" },
  { href: "/crm", label: "CRM / Funil", icon: KanbanSquare, color: "text-violet-300", bg: "bg-violet-500/10" },
  { href: "/crm#agenda", label: "Agenda", icon: CalendarClock, color: "text-amber-300", bg: "bg-amber-500/10" },
  { href: "/intelligence", label: "Inteligência", icon: Zap, color: "text-yellow-300", bg: "bg-yellow-500/10" },
  { href: "/inbox", label: "Caixa de entrada", icon: Inbox, color: "text-emerald-300", bg: "bg-emerald-500/10" },
  { href: "/automations", label: "Automações", icon: Workflow, color: "text-fuchsia-300", bg: "bg-fuchsia-500/10" },
  { href: "/operators", label: "Operadores", icon: Users, color: "text-indigo-300", bg: "bg-indigo-500/10" },
  { href: "/reports", label: "Relatórios", icon: LineChart, color: "text-lime-300", bg: "bg-lime-500/10" },
  { href: "/billing", label: "Faturamento", icon: CreditCard, color: "text-orange-300", bg: "bg-orange-500/10" },
  { href: "/integrations", label: "Integrações", icon: Plug, color: "text-teal-300", bg: "bg-teal-500/10" },
  { href: "/settings", label: "Configurações", icon: Settings, color: "text-slate-200", bg: "bg-slate-500/10" },
  { href: "/manual", label: "Ajuda / Manual", icon: CircleHelp, color: "text-rose-300", bg: "bg-rose-500/10" },
  { href: "/admin", label: "Administrador", icon: ShieldCheck, color: "text-blue-200", bg: "bg-blue-500/10" }
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
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
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
