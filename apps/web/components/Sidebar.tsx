import Image from "next/image";
import Link from "next/link";
import { BarChart3, Building2, History, KanbanSquare, Plug, Settings, ShieldCheck, Zap } from "lucide-react";
import { getCredits } from "@/lib/api";

const items = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/searches", label: "Buscas", icon: History },
  { href: "/intelligence", label: "Inteligência", icon: Zap },
  { href: "/crm", label: "CRM", icon: KanbanSquare },
  { href: "/integrations", label: "Integrações", icon: Plug },
  { href: "/settings", label: "Configurações", icon: Settings }
];

export async function Sidebar() {
  const credits = await getCredits().catch(() => null);

  return (
    <aside className="hidden min-h-screen w-72 border-r border-line bg-ink/90 p-5 lg:block">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/nodere-logo.png" alt="NODERE" width={52} height={52} className="rounded-xl object-cover" />
        <div>
          <p className="text-sm font-semibold text-white">NODERE</p>
          <p className="text-xs text-slate-400">Intelligence</p>
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

      {credits && (
        <div className="mt-6 rounded-lg border border-line bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Créditos — {credits.plan}</span>
            <span className="font-medium text-white">{credits.balance}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-cyan transition-all"
              style={{ width: `${Math.min(100, (credits.balance / (credits.balance + credits.used)) * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-600">{credits.used} usados este mês</p>
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
