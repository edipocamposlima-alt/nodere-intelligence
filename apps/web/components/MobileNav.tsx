import Link from "next/link";
import { BarChart3, Building2, CalendarClock, CircleHelp, Inbox, KanbanSquare, LineChart, Plug, Search, Settings, ShieldCheck, Zap } from "lucide-react";

const items = [
  { href: "/", label: "Início", icon: BarChart3, hex: "#0284C7", bg: "#E0F2FE" },
  { href: "/searches", label: "Busca", icon: Search, hex: "#0891B2", bg: "#CFFAFE" },
  { href: "/companies", label: "Empresas", icon: Building2, hex: "#2563EB", bg: "#DBEAFE" },
  { href: "/crm", label: "CRM", icon: KanbanSquare, hex: "#7C3AED", bg: "#EDE9FE" },
  { href: "/crm#agenda", label: "Agenda", icon: CalendarClock, hex: "#D97706", bg: "#FEF3C7" },
  { href: "/intelligence", label: "IA", icon: Zap, hex: "#EAB308", bg: "#FEF9C3" },
  { href: "/inbox", label: "Inbox", icon: Inbox, hex: "#059669", bg: "#D1FAE5" },
  { href: "/reports", label: "Relatórios", icon: LineChart, hex: "#65A30D", bg: "#ECFCCB" },
  { href: "/integrations", label: "Integrações", icon: Plug, hex: "#0D9488", bg: "#CCFBF1" },
  { href: "/settings", label: "Config", icon: Settings, hex: "#475569", bg: "#E2E8F0" },
  { href: "/manual", label: "Manual", icon: CircleHelp, hex: "#E11D48", bg: "#FFE4E6" },
  { href: "/admin", label: "Admin", icon: ShieldCheck, hex: "#1D4ED8", bg: "#DBEAFE" }
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex gap-1 overflow-x-auto border-t border-line bg-ink/95 px-2 lg:hidden">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="flex min-w-[74px] flex-col items-center gap-1 rounded-lg px-2 py-3 text-[11px] text-slate-300">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: item.bg }}>
            <item.icon className="h-4 w-4" style={{ color: item.hex, strokeWidth: 2.7 }} />
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
