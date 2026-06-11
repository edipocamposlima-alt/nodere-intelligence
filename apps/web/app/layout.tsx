import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://nodere.com.br"),
  title: {
    default: "NODERE Nexus — Revenue Intelligence Platform",
    template: "%s | NODERE Nexus"
  },
  description: "Encontre empresas que precisam dos seus serviços. Diagnóstico digital automático, CRM com IA e prospecção inteligente em um único fluxo.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/nodere-logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/nodere-logo-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/nodere-logo-192.png"
  },
  openGraph: {
    title: "NODERE Nexus — Revenue Intelligence Platform",
    description: "A plataforma que conecta inteligência comercial, prospecção e vendas em um único fluxo.",
    url: "https://nodere.com.br",
    siteName: "NODERE Nexus",
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NODERE" />
        <link rel="apple-touch-icon" href="/nodere-logo-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/nodere-logo-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/nodere-logo-512.png" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

