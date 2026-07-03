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
            __html: `try{var r=document.documentElement,s=JSON.parse(localStorage.getItem('nodere_settings')||'{}'),p=JSON.parse(localStorage.getItem('nodere_user_preferences')||'{}'),t=s.theme||'',v=s.themeVariant||'default',m=s.mode||(t==='Claro'?'light':t==='Sistema'?'system':t==='Verde NODERE'?'dark':t==='Alto contraste claro'?'light':t==='Alto contraste escuro'?'dark':t==='Escuro'?'dark':null)||localStorage.getItem('nodere-theme')||localStorage.getItem('nodere_theme')||p.theme||'dark';if(t==='Verde NODERE')v='nodere';if(t==='Alto contraste claro')v='highContrastLight';if(t==='Alto contraste escuro')v='highContrastDark';if(m==='Claro')m='light';if(m==='Escuro')m='dark';if(m==='Sistema')m='system';var resolved=(v==='highContrastLight')?'light':(v==='nodere'||v==='highContrastDark')?'dark':m==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):m;var c=/^#[0-9a-f]{6}$/i.test(s.colorPrimary||'')?s.colorPrimary:'#03624C';var f=s.fontFamily||'Inter',fs=s.fontSize||'normal',d=s.density||s.layoutDensity||'comfortable',l=s.layoutVariant||'standard',cs=s.visualStyle||s.cardStyle||'cards';r.dataset.theme=resolved;r.dataset.themeMode=m;r.dataset.themeVariant=v;r.dataset.fontFamily=String(f).toLowerCase().replace(/[^a-z0-9]+/g,'-');r.dataset.fontSize=fs;r.dataset.density=d;r.dataset.layout=l;r.dataset.cardStyle=cs;r.dataset.visual=cs;r.classList.toggle('light',resolved==='light');r.classList.toggle('dark',resolved==='dark');r.style.setProperty('--nodere-primary',c);r.style.setProperty('--brand-primary',c);r.style.setProperty('--brand-primary-hover','color-mix(in srgb, '+c+' 82%, #ffffff)');r.style.setProperty('--color-cyan',resolved==='light'?c:'#00DF82');r.style.setProperty('--color-panel',resolved==='light'?'#FFFFFF':'#111827');r.style.setProperty('--color-ink',resolved==='light'?'#F8FAFC':'#081018');r.style.setProperty('--color-line',resolved==='light'?'#E2E8F0':'#243244');r.style.setProperty('--nodere-font-family',f==='Arial'?'Arial, Helvetica, sans-serif':f==='System'||f==='System default'?'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif':f+', Inter, system-ui, sans-serif');}catch(e){}`
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

