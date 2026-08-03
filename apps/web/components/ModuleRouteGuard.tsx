"use client";

import type { ReactNode } from "react";
import { ShieldX } from "lucide-react";
import { usePathname } from "next/navigation";
import { canUseModule, useAuth } from "@/context/AuthProvider";

type RoutePolicy = {
  prefix: string;
  module: string;
  adminOnly?: boolean;
};

const ROUTE_POLICIES: RoutePolicy[] = [
  { prefix: "/crm", module: "crm" },
  { prefix: "/companies", module: "crm" },
  { prefix: "/catalog", module: "crm" },
  { prefix: "/inbox", module: "crm" },
  { prefix: "/automations", module: "crm" },
  { prefix: "/calendario", module: "agenda" },
  { prefix: "/calendar", module: "agenda" },
  { prefix: "/searches", module: "buscas" },
  { prefix: "/intelligence", module: "relatorios" },
  { prefix: "/reports", module: "relatorios" },
  { prefix: "/integrations", module: "integracoes", adminOnly: true },
  { prefix: "/operators", module: "admin", adminOnly: true },
  { prefix: "/admin", module: "admin", adminOnly: true },
  { prefix: "/billing", module: "admin" },
  { prefix: "/settings", module: "admin" },
  { prefix: "/marketing", module: "dashboard" },
  { prefix: "/manual", module: "dashboard" },
  { prefix: "/dashboard", module: "dashboard" },
  { prefix: "/ai", module: "dashboard" },
  { prefix: "/app/proposals", module: "crm" },
  { prefix: "/app/leads", module: "crm" },
  { prefix: "/app/pipeline", module: "crm" },
  { prefix: "/app/agenda", module: "agenda" },
  { prefix: "/app/discovery", module: "buscas" },
  { prefix: "/app/whatsapp", module: "crm" },
  { prefix: "/app/email", module: "crm" },
  { prefix: "/app/inbox", module: "crm" },
  { prefix: "/app/projects", module: "dashboard" },
  { prefix: "/app/reports", module: "relatorios" },
  { prefix: "/app/analytics", module: "relatorios" },
  { prefix: "/app/ai", module: "dashboard" },
  { prefix: "/app/settings", module: "admin" },
  { prefix: "/app/dashboard", module: "dashboard" }
];

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function ModuleRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const { user } = useAuth();
  const policy = ROUTE_POLICIES.find((candidate) => matches(pathname, candidate.prefix));
  const isAdmin = user?.role === "owner" || user?.role === "admin";
  const allowed = !policy || (canUseModule(user, policy.module) && (!policy.adminOnly || isAdmin));

  if (allowed) return children;

  return (
    <section className="grid min-h-[60vh] place-items-center px-4 py-10" aria-live="polite">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-7 text-center shadow-card">
        <ShieldX className="mx-auto h-10 w-10 text-[var(--warning)]" aria-hidden="true" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-glow)]">Acesso protegido</p>
        <h1 className="mt-2 font-heading text-2xl font-black text-[var(--text-primary)]">Módulo não disponível para este perfil</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Seu perfil não possui permissão para visualizar esta área. Solicite a um administrador do workspace a liberação do módulo.
        </p>
      </div>
    </section>
  );
}
