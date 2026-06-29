import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { Sidebar } from "@/components/Sidebar";

export function PrivateShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen nodere-grid">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-20 lg:pb-0">
        <Header />
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
