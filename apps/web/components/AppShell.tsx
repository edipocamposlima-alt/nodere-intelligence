"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { PwaRegister } from "@/components/PwaRegister";
import { Sidebar } from "@/components/Sidebar";
import { ThemeRuntime } from "@/components/ThemeRuntime";
import { AuthProvider } from "@/context/AuthProvider";
import { CreditsProvider } from "@/context/CreditsProvider";

const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/forgot-password",
  "/planos",
  "/precos",
  "/plans",
  "/solucoes",
  "/blog",
  "/contato",
  "/terms",
  "/privacy",
  "/termos",
  "/privacidade",
  "/pagina"
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const isPublic = pathname === "/" || PUBLIC_PREFIXES.some((prefix) => prefix !== "/" && pathname.startsWith(prefix));
  const isPlatformApp = pathname.startsWith("/app");

  if (isPublic || isPlatformApp) {
    return (
      <>
        {children}
        <PwaRegister />
        <ThemeRuntime />
      </>
    );
  }

  return (
    <AuthProvider>
      <CreditsProvider>
        <div className="nodere-app-shell flex min-h-[100dvh] nodere-grid">
          <Sidebar />
          <main className="nodere-app-main min-w-0 flex-1 pb-20 lg:pb-0">
            <Header />
            <div className="nodere-app-content">{children}</div>
            <footer className="px-4 py-6 text-center text-xs text-slate-500 md:px-8">
              <a className="hover:text-cyan" href="/terms">Termos de uso</a>
              <span className="px-2">·</span>
              <a className="hover:text-cyan" href="/privacy">Política de privacidade</a>
            </footer>
          </main>
          <MobileNav />
          <PwaRegister />
          <ThemeRuntime />
        </div>
      </CreditsProvider>
    </AuthProvider>
  );
}

