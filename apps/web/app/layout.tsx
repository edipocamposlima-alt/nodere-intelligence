import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { AppShell } from "@/components/AppShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://nodere.com.br"),
  title: {
    default: "NODERE Nexus — Revenue Intelligence Platform",
    template: "%s | NODERE Nexus"
  },
  description: "Encontre empresas que precisam dos seus serviços. Diagnóstico digital automático, CRM com IA e prospecção inteligente em um único fluxo.",
  applicationName: "NODERE Nexus",
  authors: [{ name: "NODERE" }],
  creator: "NODERE",
  publisher: "NODERE",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/nodere-icon-official.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: "/apple-touch-icon.png",
    other: [{ rel: "mask-icon", url: "/nodere-icon-official.png", color: "#03624C" }]
  },
  openGraph: {
    title: "NODERE Nexus — Revenue Intelligence Platform",
    description: "A plataforma que conecta inteligência comercial, prospecção e vendas em um único fluxo.",
    url: "https://nodere.com.br",
    siteName: "NODERE Nexus",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "NODERE Nexus" }],
    locale: "pt_BR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "NODERE Nexus",
    description: "Inteligência comercial, CRM e IA para agências e times de vendas.",
    images: ["/og-image.png"]
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#081018" },
    { media: "(prefers-color-scheme: light)", color: "#03624C" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=localStorage.getItem('nodere-theme');if(!m){var s=JSON.parse(localStorage.getItem('nodere_settings')||'{}');var t=s.theme||'Escuro';m=s.mode||(t==='Claro'?'light':t==='Sistema'?'system':'dark');}if(m==='system')m=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=m;document.documentElement.classList.toggle('light',m==='light');document.documentElement.classList.toggle('dark',m!=='light');}catch(e){}`
          }}
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NODERE" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/nodere-icon-official.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
      </head>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

