import type { Metadata } from "next";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import WhatsAppButton from "@/components/site/WhatsAppButton";
import HeroSection from "@/components/site/HeroSection";
import LogosSection from "@/components/site/LogosSection";
import HowItWorksSection from "@/components/site/HowItWorksSection";
import SolutionsSection from "@/components/site/SolutionsSection";
import DemoSection from "@/components/site/DemoSection";
import PlansSection from "@/components/site/PlansSection";
import TestimonialsSection from "@/components/site/TestimonialsSection";
import CtaSection from "@/components/site/CtaSection";

export const metadata: Metadata = {
  title: "NODERE Nexus — Revenue Intelligence Platform",
  description: "Encontre empresas que precisam dos seus serviços. Diagnóstico digital automático, CRM com IA e prospecção inteligente em um único fluxo."
};

export default function HomePage() {
  return (
    <main className="site-page">
      <SiteHeader />
      <HeroSection />
      <LogosSection />
      <HowItWorksSection />
      <SolutionsSection />
      <DemoSection />
      <PlansSection />
      <TestimonialsSection />
      <CtaSection />
      <SiteFooter />
      <WhatsAppButton />
    </main>
  );
}
