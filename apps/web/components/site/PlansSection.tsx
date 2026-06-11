"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const plans = [
  { name: "Starter", monthly: 97, yearly: 77, desc: "Para validar prospecção local.", modules: ["Discovery", "CRM essencial", "300 créditos/mês"] },
  { name: "Pro", monthly: 197, yearly: 157, desc: "Para operação recorrente com IA.", modules: ["Discovery + Intelligence", "CRM completo", "1.000 créditos/mês", "Relatórios comerciais"], featured: true },
  { name: "Agency", monthly: 397, yearly: 317, desc: "Para equipes e agências.", modules: ["Todos os módulos Pro", "Operadores", "Analytics avançado", "Integrações"] },
  { name: "Enterprise", monthly: 0, yearly: 0, desc: "Para times com processos sob medida.", modules: ["SLA dedicado", "Workspaces avançados", "Integrações customizadas"] }
];

export default function PlansSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="site-section site-section--alt" id="planos">
      <div className="site-container">
        <div className="site-section__heading">
          <div>
            <p className="site-eyebrow">Planos</p>
            <h2 className="site-title">Comece simples. Escale quando a operação pedir.</h2>
          </div>
          <div className="site-toggle" role="group" aria-label="Alternar cobrança">
            <button className={!annual ? "active" : ""} onClick={() => setAnnual(false)} type="button">Mensal</button>
            <button className={annual ? "active" : ""} onClick={() => setAnnual(true)} type="button">Anual</button>
          </div>
        </div>
        <div className="site-card-grid site-card-grid--4">
          {plans.map((plan) => {
            const price = annual ? plan.yearly : plan.monthly;
            return (
              <article className={plan.featured ? "site-plan site-plan--featured" : "site-plan"} key={plan.name}>
                {plan.featured && <span className="site-plan__badge">Mais escolhido</span>}
                <h3>{plan.name}</h3>
                <p>{plan.desc}</p>
                <strong>{price ? `R$ ${price}` : "Sob consulta"}{price ? <small>/mês</small> : null}</strong>
                <Link className="site-primary" href={plan.name === "Enterprise" ? "/contato" : "/register"}>{plan.name === "Enterprise" ? "Falar com vendas" : "Começar grátis"}</Link>
                <ul>
                  {plan.modules.map((module) => <li key={module}><CheckCircle2 size={14} /> {module}</li>)}
                </ul>
              </article>
            );
          })}
        </div>
        <p className="site-plan-note">Usuário adicional: Starter +R$47 · Pro +R$37 · Agency +R$27</p>
      </div>
    </section>
  );
}
