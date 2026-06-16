"use client";

import { useState } from "react";

const SOLUTION_CARDS = [
  { icon: "🔍", code: "DISC", name: "Discovery", tag: "Busca", color: "#F59E0B", desc: "Encontre empresas por Google Maps, score digital e redes sociais.", features: ["Google Maps", "Score digital", "Filtros por cidade"] },
  { icon: "🧠", code: "INTEL", name: "Intelligence", tag: "Dados", color: "#8B5CF6", desc: "Enriqueça com Apollo, Receita Federal e diagnóstico por IA.", features: ["Enriquecimento", "Diagnóstico IA", "Dores prováveis"] },
  { icon: "📊", code: "CRM", name: "CRM", tag: "Pipeline", color: "var(--crm-new)", desc: "Pipeline, ficha inteligente, propostas em PDF e agenda.", features: ["Ficha completa", "Propostas PDF", "Agenda"] },
  { icon: "💬", code: "ENG", name: "Engage", tag: "Ativação", color: "#10B981", desc: "WhatsApp, e-mail e omnichannel com automações por funil.", features: ["WhatsApp", "E-mail", "Automações"] },
  { icon: "🤖", code: "AI", name: "AI Nexus", tag: "Copiloto", color: "var(--ai-primary)", desc: "Copiloto comercial com contexto real do lead.", features: ["Scripts", "Objeções", "Próxima ação"] },
  { icon: "📈", code: "ANA", name: "Analytics", tag: "Gestão", color: "#EC4899", desc: "Dashboard executivo, forecast e ranking de operadores.", features: ["Forecast", "Ranking", "Metas"] },
  { icon: "🗂️", code: "OPS", name: "Operations", tag: "Entrega", color: "#F97316", desc: "Projetos, portal do cliente e documentos pós-venda.", features: ["Projetos", "Portal", "Documentos"] },
  { icon: "🤝", code: "MKT", name: "Marketplace", tag: "Parceiros", color: "#06B6D4", desc: "Parceiros, comissionamento e integração com ERPs.", features: ["Parceiros", "Comissões", "ERPs"] }
];

export default function SolutionsSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="site-section site-section--alt" id="solucoes">
      <div className="site-container">
        <div className="site-section__center">
          <div className="badge badge-blue">Soluções</div>
          <h2 className="site-title site-title--center">8 conjuntos para operar receita com inteligência.</h2>
          <p>Do mapa ao contrato, cada módulo tem uma função clara no crescimento comercial.</p>
        </div>
        <div className="solutions-grid site-card-grid site-card-grid--4">
          {SOLUTION_CARDS.map((solution, index) => (
            <article
              className="site-solution-card site-solution-card--color"
              id={solution.name.toLowerCase().replace(/\s+/g, "-")}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              style={{
                borderColor: hovered === index ? solution.color : undefined,
                boxShadow: hovered === index ? `0 12px 40px ${solution.color}22` : undefined
              }}
              key={solution.code}
            >
              <div className="site-solution-card__head">
                <span style={{ background: `${solution.color}18`, borderColor: `${solution.color}55` }}>{solution.icon}</span>
                <small style={{ color: solution.color, background: `${solution.color}18`, borderColor: `${solution.color}55` }}>{solution.code}</small>
              </div>
              <strong style={{ color: solution.color }}>{solution.tag}</strong>
              <h3>{solution.name}</h3>
              <p>{solution.desc}</p>
              <div className="glow-line" style={{ background: `linear-gradient(90deg, transparent, ${solution.color}, transparent)` }} />
              <ul>
                {solution.features.map((feature) => <li key={feature}><span style={{ color: solution.color }}>✦</span>{feature}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
