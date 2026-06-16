import type { Metadata } from "next";
import CtaSection from "@/components/site/CtaSection";
import PlansSection from "@/components/site/PlansSection";
import SitePageShell from "@/components/site/SitePageShell";

export const metadata: Metadata = {
  title: "Planos | NODERI Nexus",
  description: "Escolha o plano NODERI Nexus para prospecção, CRM e inteligência comercial."
};

export default function PlansPage() {
  return (
    <SitePageShell>
      <section className="site-simple-hero">
        <div className="site-container">
          <p className="site-eyebrow">Planos</p>
          <h1>Escolha o ritmo de crescimento do seu time comercial.</h1>
          <p>Comece enxuto, valide o processo e evolua para um motor completo de revenue intelligence.</p>
        </div>
      </section>
      <PlansSection />
      <CtaSection />
    </SitePageShell>
  );
}
