import Link from "next/link";
import { BarChart3, Building2, CalendarClock, CircleHelp, Inbox, KanbanSquare, LineChart, Plug, Search, Settings, ShieldCheck, Zap } from "lucide-react";

const items = [
  { href: "/", label: "Início", icon: BarChart3, color: "text-sky-300" },
  { href: "/searches", label: "Busca", icon: Search, color: "text-cyan" },
  { href: "/companies", label: "Empresas", icon: Building2, color: "text-blue-300" },
  { href: "/crm", label: "CRM", icon: KanbanSquare, color: "text-violet-300" },
  { href: "/crm#agenda", label: "Agenda", icon: CalendarClock, color: "text-amber-300" },
  { href: "/intelligence", label: "IA", icon: Zap, color: "text-yellow-300" },
  { href: "/inbox", label: "Inbox", icon: Inbox, color: "text-emerald-300" },
  { href: "/reports", label: "Relatórios", icon: LineChart, color: "text-lime-300" },
  { href: "/integrations", label: "Integrações", icon: Plug, color: "text-teal-300" },
  { href: "/settings", label: "Config", icon: Settings, color: "text-slate-200" },
  { href: "/manual", label: "Manual", icon: CircleHelp, color: "text-rose-300" },
  { href: "/admin", label: "Admin", icon: ShieldCheck, color: "text-blue-200" }
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex gap-1 overflow-x-auto border-t border-line bg-ink/95 px-2 lg:hidden">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="flex min-w-[74px] flex-col items-center gap-1 rounded-lg px-2 py-3 text-[11px] text-slate-300">
          <item.icon className={`h-4 w-4 ${item.color}`} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
