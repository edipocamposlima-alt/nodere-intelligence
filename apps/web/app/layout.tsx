import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://nodere.com.br"),
  title: "NODERE Intelligence",
  description: "Sistema de prospeccao inteligente para Google Ads e Google Meu Negocio",
  manifest: "/manifest.json",
  icons: {
    icon: "/nodere-logo.png",
    apple: "/nodere-logo.png"
  },
  openGraph: {
    title: "NODERE Intelligence",
    description: "CRM SaaS para prospeccao, Google Ads e inteligencia comercial.",
    url: "https://nodere.com.br",
    siteName: "NODERE Intelligence",
    images: [{ url: "/nodere-logo.png", width: 512, height: 512, alt: "NODERE" }],
    locale: "pt_BR",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#1E6FDB"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
