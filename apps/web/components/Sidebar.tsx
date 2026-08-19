"use client";

import Link from "@/components/NativeLink";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, ShieldCheck } from "lucide-react";
import { useCredits } from "@/context/CreditsProvider";
import { canUseModule, useAuth } from "@/context/AuthProvider";
import { Logo } from "@/components/brand/Logo";
import { PLATFORM_NAVIGATION, resolvePlatformHref } from "@/lib/platformNavigation";

export function Sidebar() {
  const [mode, setMode] = useState<"expanded" | "compact" | "closed">("expanded");
  const { credits, daysLeft, trialExpired } = useCredits();
  const { user } = useAuth();
  const pathname = usePathname() || "/";
  const isApp = pathname.startsWith("/app");
  const isAdmin = user?.role === "owner" || user?.role === "admin";
  const dashboardHref = isApp ? "/app/dashboard" : "/ai";
  const total = credits?.total || 0;
  const remaining = credits?.remaining || 0;
  const used = credits?.used || 0;
  const isInternalOwner = credits?.account_type === "OWNER_INTERNAL";
  const progress = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nodere:sidebar:mode");
      if (stored === "expanded" || stored === "compact" || stored === "closed") setMode(stored);
      else if (localStorage.getItem("nodere:sidebar:collapsed") === "true") setMode("compact");
    } catch { /* storage unavailable */ }
  }, []);

  function advanceMode() {
    setMode((current) => {
      const next = current === "expanded" ? "compact" : current === "compact" ? "closed" : "expanded";
      try { localStorage.setItem("nodere:sidebar:mode", next); } catch { /* storage unavailable */ }
      return next;
    });
  }

  if (mode === "closed") {
    return (
      <button type="button" onClick={advanceMode} className="fixed left-3 top-20 z-40 hidden rounded-xl border border-[var(--border-brand)] bg-[var(--bg-sidebar)] p-2.5 text-[var(--brand-primary)] shadow-xl transition hover:border-[var(--brand-primary)] hover:bg-[var(--bg-hover)] lg:inline-flex" aria-label="Abrir menu lateral" title="Abrir menu lateral">
        <PanelLeftOpen />
      </button>
    );
  }

  const compact = mode === "compact";

  return (
    <aside data-collapsed={compact ? "true" : "false"} className={`nodere-sidebar hidden h-[100dvh] shrink-0 overflow-hidden border-r border-[var(--border-soft)] bg-[var(--bg-sidebar)] text-[var(--text-secondary)] transition-[width,padding] duration-200 lg:flex lg:flex-col ${compact ? "w-[5.25rem] p-3" : "w-64 p-4 xl:w-72 xl:p-5"}`}>
      <div className={`flex items-center ${compact ? "flex-col gap-2" : "gap-2"}`}>
        <Link href={dashboardHref} title={compact ? "NODERE" : undefined} className="flex min-h-14 min-w-0 flex-1 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--brand-primary)]">
          <Logo variant={compact ? "icon" : "full"} height={compact ? 34 : 38} />
        </Link>
        <button type="button" onClick={advanceMode} className="nodere-sidebar-toggle rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-2 text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]" aria-label={compact ? "Fechar menu lateral" : "Compactar menu lateral"} title={compact ? "Fechar menu" : "Compactar menu"}>
          <PanelLeftClose />
        </button>
      </div>

      <nav aria-label="Navegação principal" className={`nodere-tools-scroll mt-5 min-h-0 flex-1 overflow-y-auto ${compact ? "space-y-3" : "space-y-4 pr-1 xl:mt-8 xl:space-y-5"}`}>
        {PLATFORM_NAVIGATION.map((group) => (
          <section key={group.label} className="space-y-1">
            <p className={compact ? "sr-only" : "px-3 pb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]"}>{group.label}</p>
            {group.items.filter((item) => (!item.adminOnly || isAdmin) && canUseModule(user, item.module)).map((item) => {
              const href = resolvePlatformHref(item, pathname);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={`${group.label}-${item.label}-${href}`}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  title={compact ? item.label : undefined}
                  className={`group flex min-w-0 items-center rounded-lg border-l-2 py-2.5 text-sm transition hover:border-[var(--brand-primary)] hover:bg-[var(--nav-active-bg)] hover:text-[var(--text-primary)] ${compact ? "justify-center px-2" : "gap-3 px-3"} ${active ? "border-[var(--brand-primary)] bg-[var(--nav-active-bg)] text-[var(--text-primary)]" : "border-transparent text-[var(--text-secondary)]"}`}
                >
                  <span className="nodere-nav-icon-tone nodere-nav-glyph flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition" data-icon-tone={item.tone}>
                    <item.icon className="nav-icon" />
                  </span>
                  <span className={compact ? "sr-only" : "min-w-0 truncate"}>{item.label}</span>
                </Link>
              );
            })}
          </section>
        ))}
      </nav>

      {credits && !compact && (
        <div className="mt-4 shrink-0 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
          {isInternalOwner ? (
            <div className="text-xs">
              <p className="font-bold text-emerald-300">Conta interna do proprietário</p>
              <p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">Consumo técnico auditado, sem saldo artificial e sem bloqueio comercial.</p>
            </div>
          ) : (<>
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Créditos — {credits.plan}</span>
            <span className="font-medium text-[var(--text-primary)]">{remaining.toLocaleString("pt-BR")} / {total.toLocaleString("pt-BR")}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-hover)]">
            <div
              className={`h-1.5 rounded-full transition-all ${trialExpired || remaining <= 0 ? "bg-[var(--danger)]" : remaining <= 5 ? "bg-[var(--warning)]" : "bg-[var(--brand-primary)]"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
            {used} usados{credits.plan === "trial" && daysLeft !== null ? ` · Trial ${trialExpired ? "expirado" : `vence em ${Math.max(0, daysLeft)} dia(s)`}` : ""}
          </p>
          </>)}
        </div>
      )}

      {!compact && <div className="mt-4 shrink-0 rounded-lg border border-[var(--border-brand)] bg-[var(--nav-active-bg)] p-4">
        <ShieldCheck className="h-5 w-5 text-[var(--brand-glow)]" />
        <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">Ambiente seguro</p>
        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Dados isolados por workspace, APIs via backend e operação comercial protegida.</p>
      </div>}
    </aside>
  );
}
