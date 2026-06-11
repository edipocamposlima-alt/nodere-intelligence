import Link from "next/link";
import { ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="site-hero">
      <div className="site-hero__grid-bg" />
      <div className="site-container site-hero__inner">
        <div>
          <div className="site-pill"><span /> Revenue Intelligence Platform</div>
          <h1>Encontre empresas que precisam <strong>dos seus serviços.</strong></h1>
          <p>Prospecção inteligente com diagnóstico digital automático, CRM integrado e copiloto de IA, do primeiro contato ao fechamento.</p>
          <div className="site-hero__actions">
            <Link className="site-primary site-hero__primary" href="/register">Começar grátis — 14 dias <ArrowRight size={16} /></Link>
            <Link className="site-secondary-button" href="/planos">Ver planos e preços</Link>
          </div>
          <div className="site-hero__proof">
            {["Sem cartão de crédito", "Cancele quando quiser", "LGPD compliant"].map((item) => (
              <span key={item}><CheckCircle2 size={14} /> {item}</span>
            ))}
          </div>
        </div>
        <div className="site-score-card">
          <div className="site-score-card__top">
            <span>Score médio de oportunidade</span>
            <strong><TrendingUp size={14} /> Alta intenção</strong>
          </div>
          <div className="site-score-card__score">82</div>
          <small>/ 100 pontos de potencial</small>
          <div className="site-score-card__bar"><span /></div>
          {[
            ["Academias sem site", "42 leads", "warning"],
            ["Clínicas com nota baixa", "18 alertas", "danger"],
            ["Empresas sem Google Ads", "31 oportunidades", "primary"]
          ].map(([label, value, tone]) => (
            <div className="site-score-card__row" key={label}>
              <span>{label}</span>
              <strong data-tone={tone}>{value}</strong>
            </div>
          ))}
          <div className="site-floating-badge">Diagnóstico pronto em segundos</div>
        </div>
      </div>
    </section>
  );
}
