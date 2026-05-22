import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "LeadRadar",
  description: "Sistema de prospeccao inteligente para Google Ads e Google Meu Negocio"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen leadradar-grid">
          <Sidebar />
          <main className="min-w-0 flex-1 pb-20 lg:pb-0">
            <Header />
            {children}
          </main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
