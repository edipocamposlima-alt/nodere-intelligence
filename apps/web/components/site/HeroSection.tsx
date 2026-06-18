"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TICKER_ITEMS = [
  "Agências digitais",
  "Consultorias B2B",
  "Times de SDR",
  "Gestores de tráfego",
  "Prestadores locais",
  "Franquias"
];

const OPPORTUNITY_CARDS = [
  { icon: "🏋️", label: "Academias sem site", value: "42 leads", color: "#F59E0B" },
  { icon: "⭐", label: "Clínicas com nota baixa", value: "18 alertas", color: "#EF4444" },
  { icon: "📢", label: "Empresas sem Google Ads", value: "31 oport.", color: "var(--info)" },
  { icon: "📸", label: "Restaurantes sem Instagram", value: "56 leads", color: "#2563EB" }
];

export default function HeroSection() {
  const [tickerIndex, setTickerIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    setVisible(true);
    let start = 0;
    const timer = window.setInterval(() => {
      start += 2;
      if (start >= 82) {
        setCounter(82);
        window.clearInterval(timer);
      } else {
        setCounter(start);
      }
    }, 20);
    const ticker = window.setInterval(() => {
      setTickerIndex((index) => (index + 1) % TICKER_ITEMS.length);
    }, 2200);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(ticker);
    };
  }, []);

  return (
    <section className="site-hero site-hero--vivid">
      <div className="grid-bg site-hero__grid-bg" />
      <div className="site-hero__orb site-hero__orb--blue" />
      <div className="site-hero__orb site-hero__orb--cyan" />
      <div className="site-container hero-grid site-hero__inner">
        <div className={visible ? "site-hero__copy is-visible" : "site-hero__copy"}>
          <div className="badge badge-blue site-hero__badge"><span /> Plataforma comercial</div>
          <h1>
            Encontre empresas<br />
            que precisam dos<br />
            <strong className="text-gradient">seus serviços.</strong>
          </h1>
          <div className="site-hero__ticker">
            <span>Feito para</span>
            <strong>{TICKER_ITEMS[tickerIndex]}</strong>
          </div>
          <p>Prospecção inteligente com diagnóstico digital automático, CRM integrado e copiloto de IA, do primeiro contato ao fechamento.</p>
          <div className="site-hero__actions">
            <Link className="btn-primary animate-pulse-glow" href="/register">Começar grátis — 14 dias ✦</Link>
            <Link className="btn-ghost" href="/planos">Ver planos →</Link>
          </div>
          <div className="site-hero__proof">
            {["Sem cartão de crédito", "Cancele quando quiser", "LGPD compliant"].map((item) => (
              <span key={item}>✓ {item}</span>
            ))}
          </div>
        </div>

        <div className={visible ? "site-score-card card is-visible" : "site-score-card card"}>
          <div className="site-score-card__top">
            <div>
              <small>Score médio de oportunidade</small>
              <span>Caxias do Sul · Academias</span>
            </div>
            <strong className="badge badge-green"><span /> Alta intenção</strong>
          </div>
          <div className="site-score-card__score">{counter}</div>
          <small>/ 100 pontos de potencial</small>
          <div className="site-score-card__bar"><span style={{ width: `${counter}%` }} /></div>
          <div className="site-score-card__rows">
            {OPPORTUNITY_CARDS.map((item, index) => (
              <div className="site-score-card__row" style={{ animationDelay: `${0.3 + index * 0.1}s` }} key={item.label}>
                <span><b>{item.icon}</b> {item.label}</span>
                <strong style={{ color: item.color, background: `${item.color}18` }}>{item.value}</strong>
              </div>
            ))}
          </div>
          <div className="site-score-card__stats">
            <span><i /> <strong>127</strong> empresas analisadas hoje</span>
            <span>🤖 IA ativa em <strong>4 funis</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}
