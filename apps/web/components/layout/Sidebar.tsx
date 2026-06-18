"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, CalendarDays, FileText, Home, Inbox, KanbanSquare, Lock, Mail, Radio, Search, Settings, Users, Workflow } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Logo } from "@/components/brand/Logo";

const NAV_ITEMS = [
  { code: "DISC-01", label: "Prospecção", icon: Search, href: "/app/discovery", group: "Descoberta" },
  { code: "CRM-01", label: "Pipeline", icon: KanbanSquare, href: "/app/pipeline", group: "CRM" },
  { code: "CRM-02", label: "Leads", icon: Users, href: "/app/leads", group: "CRM" },
  { code: "CRM-03", label: "Agenda", icon: CalendarDays, href: "/app/agenda", group: "CRM" },
  { code: "CRM-04", label: "Propostas", icon: FileText, href: "/app/proposals", group: "CRM" },
  { code: "ENG-01", label: "WhatsApp", icon: Inbox, href: "/app/whatsapp", group: "Comunicação" },
  { code: "ENG-03", label: "E-mail", icon: Mail, href: "/app/email", group: "Comunicação" },
  { code: "ENG-04", label: "Omnichannel", icon: Radio, href: "/app/inbox", group: "Comunicação" },
  { code: "AI-01", label: "IA Nexus", icon: Bot, href: "/app/ai", group: "Inteligência" },
  { code: "ANA-01", label: "Dashboard", icon: BarChart3, href: "/app/analytics", group: "Analytics" },
  { code: "ANA-02", label: "Relatórios", icon: FileText, href: "/app/reports", group: "Analytics" },
  { code: "OPS-01", label: "Projetos", icon: Workflow, href: "/app/projects", group: "Operações" }
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
          <span className="logo-nexus sr-only">Nexus</span>
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
