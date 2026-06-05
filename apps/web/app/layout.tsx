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
    apple: "/nodere-logo-192.png"
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
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="NODERE" />
        <link rel="apple-touch-icon" href="/nodere-logo-192.png" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
