import type { Metadata } from "next";
import PricingComparison from "@/components/site/PricingComparison";
import SitePageShell from "@/components/site/SitePageShell";

export const metadata: Metadata = {
  title: "Precos | NODERI Nexus",
  description: "Compare os planos Starter, Pro, Agency e Enterprise do NODERI Nexus com cobranca mensal ou anual."
};

export default function PricingPage() {
  return (
    <SitePageShell>
      <section className="site-simple-hero">
        <div className="site-container">
          <p className="site-eyebrow">Precos</p>
          <h1>Planos que acompanham a maturidade da sua operacao.</h1>
          <p>Escolha mensal ou anual. No anual, voce recebe 2 meses gratis.</p>
        </div>
      </section>
      <PricingComparison />
    </SitePageShell>
  );
}
