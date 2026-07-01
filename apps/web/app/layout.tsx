import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { AppShell } from "@/components/AppShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://nodere.com.br"),
  title: {
    default: "NODERE",
    template: "%s | NODERE"
  },
  description: "Encontre empresas que precisam dos seus serviços. Diagnóstico digital automático, CRM com IA e prospecção inteligente em um único fluxo.",
  applicationName: "NODERE",
  authors: [{ name: "NODERE" }],
  creator: "NODERE",
  publisher: "NODERE",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png?v=nodere-n-20260618", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=nodere-n-20260618", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico?v=nodere-n-20260618", sizes: "any" }
    ],
    apple: "/apple-touch-icon.png?v=nodere-n-20260618",
    other: [{ rel: "mask-icon", url: "/nodere-favicon.png?v=nodere-n-20260618", color: "#03624C" }]
  },
  openGraph: {
    title: "NODERE",
    description: "A plataforma que conecta inteligência comercial, prospecção e vendas em um único fluxo.",
    url: "https://nodere.com.br",
    siteName: "NODERE",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "NODERE" }],
    locale: "pt_BR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "NODERE",
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
            __html: `try{var r=document.documentElement,s=JSON.parse(localStorage.getItem('nodere_settings')||'{}'),p=JSON.parse(localStorage.getItem('nodere_user_preferences')||'{}'),m=s.mode||(s.theme==='Claro'?'light':s.theme==='Sistema'?'system':s.theme==='Escuro'?'dark':null)||localStorage.getItem('nodere-theme')||localStorage.getItem('nodere_theme')||p.theme||'dark';if(m==='Claro')m='light';if(m==='Escuro')m='dark';if(m==='Sistema')m='system';if(m==='system')m=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';r.dataset.theme=m;r.classList.toggle('light',m==='light');r.classList.toggle('dark',m==='dark');r.style.setProperty('--nodere-primary','#03624C');r.style.setProperty('--color-cyan',m==='light'?'#03624C':'#00DF82');r.style.setProperty('--color-panel',m==='light'?'#FFFFFF':'#111827');r.style.setProperty('--color-ink',m==='light'?'#F8FAFC':'#081018');r.style.setProperty('--color-line',m==='light'?'#E2E8F0':'#243244');r.dataset.fontSize=s.fontSize||'normal';r.dataset.density=s.layoutDensity||'compact';r.dataset.cardStyle=s.cardStyle||'cards';}catch(e){}`
          }}
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NODERE" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=nodere-n-20260618" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=nodere-n-20260618" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=nodere-n-20260618" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png?v=nodere-n-20260618" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png?v=nodere-n-20260618" />
      </head>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

