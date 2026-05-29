import Link from "next/link";
import { BarChart3, Building2, History, KanbanSquare, Plug } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/searches", label: "Buscas", icon: History },
  { href: "/crm", label: "CRM", icon: KanbanSquare },
  { href: "/integrations", label: "Integrações", icon: Plug }
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-line bg-ink/95 lg:hidden">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-2 py-3 text-[11px] text-slate-300">
          <item.icon className="h-4 w-4 text-cyan" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
