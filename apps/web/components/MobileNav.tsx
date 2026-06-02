import Link from "next/link";
import { BarChart3, Building2, CircleHelp, Inbox, KanbanSquare, LineChart, Plug, Search, Settings, ShieldCheck, Zap } from "lucide-react";

const items = [
  { href: "/", label: "Início", icon: BarChart3, bg: "linear-gradient(135deg,#0284C7,#38BDF8)" },
  { href: "/searches", label: "Busca", icon: Search, bg: "linear-gradient(135deg,#0891B2,#22D3EE)" },
  { href: "/companies", label: "Empresas", icon: Building2, bg: "linear-gradient(135deg,#1D4ED8,#60A5FA)" },
  { href: "/crm", label: "CRM", icon: KanbanSquare, bg: "linear-gradient(135deg,#7C3AED,#C084FC)" },
  { href: "/intelligence", label: "IA", icon: Zap, bg: "linear-gradient(135deg,#EAB308,#F97316)" },
  { href: "/inbox", label: "Inbox", icon: Inbox, bg: "linear-gradient(135deg,#059669,#34D399)" },
  { href: "/reports", label: "Relatórios", icon: LineChart, bg: "linear-gradient(135deg,#65A30D,#A3E635)" },
  { href: "/integrations", label: "Integrações", icon: Plug, bg: "linear-gradient(135deg,#0D9488,#5EEAD4)" },
  { href: "/settings", label: "Config", icon: Settings, bg: "linear-gradient(135deg,#2563EB,#93C5FD)" },
  { href: "/manual", label: "Manual", icon: CircleHelp, bg: "linear-gradient(135deg,#E11D48,#FDA4AF)" },
  { href: "/admin", label: "Admin", icon: ShieldCheck, bg: "linear-gradient(135deg,#1D4ED8,#22D3EE)" }
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex gap-1 overflow-x-auto border-t border-line bg-ink/95 px-2 lg:hidden">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="flex min-w-[74px] flex-col items-center gap-1 rounded-lg px-2 py-3 text-[11px] text-slate-300">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg shadow-[0_0_18px_rgba(56,189,248,0.22)]" style={{ background: item.bg }}>
            <item.icon className="h-4 w-4 text-white" style={{ strokeWidth: 2.9 }} />
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
