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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var r=document.documentElement,s=JSON.parse(localStorage.getItem('nodere_settings')||'{}'),p=JSON.parse(localStorage.getItem('nodere_user_preferences')||'{}'),t=s.theme||'',v=s.themeVariant||'default',m=s.mode||(t==='Claro'?'light':t==='Sistema'?'system':t==='Verde NODERE'?'dark':t==='Alto contraste claro'?'light':t==='Alto contraste escuro'?'dark':t==='Escuro'?'dark':null)||localStorage.getItem('nodere-theme')||localStorage.getItem('nodere_theme')||p.theme||'dark';if(t==='Verde NODERE')v='nodere';if(t==='Alto contraste claro')v='highContrastLight';if(t==='Alto contraste escuro')v='highContrastDark';if(m==='Claro')m='light';if(m==='Escuro')m='dark';if(m==='Sistema')m='system';var resolved=(v==='highContrastLight')?'light':(v==='nodere'||v==='highContrastDark')?'dark':m==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):m;var c=/^#[0-9a-f]{6}$/i.test(s.colorPrimary||'')?s.colorPrimary:'#03624C';var f=s.fontFamily||'Inter',fs=s.fontSize||'normal',d=s.density||s.layoutDensity||'comfortable',l=s.layoutVariant||'standard',cs=s.visualStyle||s.cardStyle||'cards',isLight=resolved==='light';r.dataset.theme=resolved;r.dataset.themeMode=m;r.dataset.themeVariant=v;r.dataset.fontFamily=String(f).toLowerCase().replace(/[^a-z0-9]+/g,'-');r.dataset.fontSize=fs;r.dataset.density=d;r.dataset.layout=l;r.dataset.cardStyle=cs;r.dataset.visual=cs;r.classList.toggle('light',isLight);r.classList.toggle('dark',!isLight);r.style.setProperty('--nodere-primary',c);r.style.setProperty('--brand-primary',c);r.style.setProperty('--brand-primary-hover','color-mix(in srgb, '+c+' 82%, #ffffff)');r.style.setProperty('--brand-glow',isLight?c:'#00DF82');r.style.setProperty('--brand-glow-soft',isLight?c:'#00DF82');r.style.setProperty('--brand-glow-dim','color-mix(in srgb, '+c+' '+(isLight?'12%':'18%')+', transparent)');r.style.setProperty('--bg-root',isLight?'#EEF2F7':'#050D14');r.style.setProperty('--bg-main',isLight?'#F8FAFC':'#081018');r.style.setProperty('--bg-sidebar',isLight?'#FFFFFF':'#0B1220');r.style.setProperty('--bg-card',isLight?'#FFFFFF':'#111827');r.style.setProperty('--bg-card-hover',isLight?'#F8FAFC':'#141F30');r.style.setProperty('--bg-modal',isLight?'#FFFFFF':'#172033');r.style.setProperty('--bg-hover',isLight?'#F1F5F9':'#1F2937');r.style.setProperty('--bg-input',isLight?'#FFFFFF':'#0D1828');r.style.setProperty('--border',isLight?'#E2E8F0':'#243244');r.style.setProperty('--border-soft',isLight?'#CBD5E1':'#1E293B');r.style.setProperty('--text-primary',isLight?'#0F172A':'#FFFFFF');r.style.setProperty('--text-secondary',isLight?'#334155':'#CBD5E1');r.style.setProperty('--text-muted',isLight?'#64748B':'#9CA3AF');r.style.setProperty('--color-cyan',isLight?c:'#00DF82');r.style.setProperty('--color-panel',isLight?'#FFFFFF':'#111827');r.style.setProperty('--color-ink',isLight?'#F8FAFC':'#081018');r.style.setProperty('--color-line',isLight?'#E2E8F0':'#243244');r.style.setProperty('--color-text',isLight?'#0F172A':'#FFFFFF');r.style.setProperty('--color-muted',isLight?'#64748B':'#9CA3AF');r.style.setProperty('--nodere-font-family',f==='Arial'?'Arial, Helvetica, sans-serif':f==='System'||f==='System default'?'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif':f+', Inter, system-ui, sans-serif');}catch(e){}`
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

