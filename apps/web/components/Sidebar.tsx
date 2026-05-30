import Image from "next/image";
import Link from "next/link";
import { BarChart3, Building2, CreditCard, History, Inbox, KanbanSquare, LineChart, Plug, Settings, ShieldCheck, Users, Workflow, Zap } from "lucide-react";
import { getBillingStatus } from "@/lib/api";

const items = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/searches", label: "Buscas", icon: History },
  { href: "/intelligence", label: "Inteligência", icon: Zap },
  { href: "/crm", label: "CRM", icon: KanbanSquare },
  { href: "/inbox", label: "Caixa de entrada", icon: Inbox },
  { href: "/automations", label: "Automações", icon: Workflow },
  { href: "/operators", label: "Operadores", icon: Users },
  { href: "/reports", label: "Relatórios", icon: LineChart },
  { href: "/billing", label: "Faturamento", icon: CreditCard },
  { href: "/integrations", label: "Integrações", icon: Plug },
  { href: "/settings", label: "Configurações", icon: Settings }
];

export async function Sidebar() {
  const billing = await getBillingStatus().catch(() => null);

  return (
    <aside className="hidden min-h-screen w-72 border-r border-line bg-ink/90 p-5 lg:block">
      <Link href="/" className="flex items-center gap-3 rounded-xl border border-electric/20 bg-electric/5 p-3 transition hover:border-electric/40">
        <Image src="/nodere-logo.png" alt="NODERE" width={44} height={44} className="rounded-lg object-cover shadow-glow" />
        <div>
          <p className="text-base font-bold tracking-wide text-white">NODERE</p>
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan">Intelligence</p>
        </div>
      </Link>

      <nav className="mt-8 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <item.icon className="h-4 w-4 text-cyan" />
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
