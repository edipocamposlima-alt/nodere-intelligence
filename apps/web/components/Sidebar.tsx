import Image from "next/image";
import Link from "next/link";
import { BarChart3, Building2, KanbanSquare, Plug, Settings, ShieldCheck } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/crm", label: "CRM", icon: KanbanSquare },
  { href: "/integrations", label: "Integrações", icon: Plug },
  { href: "/settings", label: "Configurações", icon: Settings }
];

export function Sidebar() {
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

      <div className="mt-8 rounded-lg border border-electric/30 bg-electric/10 p-4">
        <ShieldCheck className="h-5 w-5 text-cyan" />
        <p className="mt-3 text-sm font-medium text-white">Scanner de oportunidades</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">Busca local, score comercial e CRM leve em um fluxo rapido.</p>
      </div>
    </aside>
  );
}
