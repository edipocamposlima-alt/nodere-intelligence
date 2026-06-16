import type { Metadata } from "next";
import DemoSection from "@/components/site/DemoSection";
import SitePageShell from "@/components/site/SitePageShell";
import SolutionsSection from "@/components/site/SolutionsSection";

export const metadata: Metadata = {
  title: "Soluções | NODERI Nexus",
  description: "Conheça os módulos integrados da plataforma NODERI Nexus."
};

export default function SolutionsPage() {
  return (
    <SitePageShell>
      <section className="site-simple-hero">
        <div className="site-container">
          <p className="site-eyebrow">Soluções</p>
          <h1>Um fluxo completo para encontrar, diagnosticar e converter empresas.</h1>
          <p>Os módulos trabalham juntos para reduzir trabalho manual e aumentar previsibilidade comercial.</p>
        </div>
      </section>
      <SolutionsSection />
      <DemoSection />
    </SitePageShell>
  );
}
