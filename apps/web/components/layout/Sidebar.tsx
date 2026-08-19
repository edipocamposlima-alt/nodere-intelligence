"use client";

import Link from "@/components/NativeLink";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Building2, CalendarDays, FileText, Home, KanbanSquare, Lock, MessagesSquare, PackageOpen, Search, Settings } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Logo } from "@/components/brand/Logo";

const NAV_ITEMS = [
  { code: "AI-01", label: "NODERE AI", icon: Bot, href: "/ai", group: "Operação" },
  { code: "ANA-01", label: "Dashboard", icon: BarChart3, href: "/dashboard", group: "Operação" },
  { code: "DISC-01", label: "Prospecção e pesquisa", icon: Search, href: "/searches", group: "Operação" },
  { code: "CRM-01", label: "Funil comercial", icon: KanbanSquare, href: "/crm", group: "Operação" },
  { code: "CRM-02", label: "Empresas e clientes", icon: Building2, href: "/companies", group: "Operação" },
  { code: "ENG-01", label: "Comunicações", icon: MessagesSquare, href: "/crm/communications", group: "Operação" },
  { code: "CRM-03", label: "Agenda", icon: CalendarDays, href: "/calendario", group: "Operação" },
  { code: "CRM-02", label: "Briefings", icon: FileText, href: "/crm/briefings", group: "Comercial" },
  { code: "CRM-04", label: "Propostas e contratos", icon: PackageOpen, href: "/app/proposals", group: "Comercial" },
  { code: "CRM-01", label: "Produtos e serviços", icon: PackageOpen, href: "/catalog", group: "Comercial" },
  { code: "ANA-02", label: "Relatórios", icon: FileText, href: "/reports", group: "Comercial" }
];

export default function PlatformSidebar() {
  const { hasModule, loading } = useWorkspace();
  const pathname = usePathname();
  const groups = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  if (loading) return <div className="sidebar sidebar-loading" />;

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <Link href="/app/dashboard">
          <Logo variant="full" height={32} />
          <span className="logo-text sr-only">NODERE</span>
        </Link>
      </div>

      <div className="sidebar-nav">
        <Link href="/app/dashboard" className={`nav-item ${pathname === "/app/dashboard" ? "active" : ""}`}>
          <Home className="nav-icon" /> Dashboard
        </Link>

        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="nav-group">
            <span className="nav-group-label">{group}</span>
            {items.map((item) => {
              const active = hasModule(item.code);
              const Icon = item.icon;
              return (
                <div key={item.code} className={`nav-item-wrapper ${!active ? "locked" : ""}`}>
                  {active ? (
                    <Link href={item.href} className={`nav-item ${pathname?.startsWith(item.href) ? "active" : ""}`}>
                      <Icon className="nav-icon" /> {item.label}
                    </Link>
                  ) : (
                    <Link href={`/app/upgrade?module=${item.code}`} className="nav-item nav-item-locked">
                      <Icon className="nav-icon" /> {item.label}
                      <Lock className="lock-badge" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <Link href="/app/settings" className={`nav-item ${pathname === "/app/settings" ? "active" : ""}`}>
          <Settings className="nav-icon" /> Configurações
        </Link>
      </div>
    </nav>
  );
}
