import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthProvider";
import { CreditsProvider } from "@/context/CreditsProvider";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

export default function PlatformAppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CreditsProvider>
        <WorkspaceProvider>
          <div className="flex min-h-[100dvh] nodere-grid">
            <Sidebar />
            <main className="min-w-0 flex-1 pb-20 lg:pb-0">
              <Header />
              {children}
              <footer className="px-4 py-6 text-center text-xs text-slate-500 md:px-8">
                <a className="hover:text-cyan" href="/terms">Termos de uso</a>
                <span className="px-2">·</span>
                <a className="hover:text-cyan" href="/privacy">Política de privacidade</a>
              </footer>
            </main>
            <MobileNav />
          </div>
        </WorkspaceProvider>
      </CreditsProvider>
    </AuthProvider>
  );
}
