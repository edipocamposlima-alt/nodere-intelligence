import type { ReactNode } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import WhatsAppButton from "./WhatsAppButton";

export default function SitePageShell({ children }: { children: ReactNode }) {
  return (
    <main className="site-page">
      <SiteHeader />
      {children}
      <SiteFooter />
      <WhatsAppButton />
    </main>
  );
}
