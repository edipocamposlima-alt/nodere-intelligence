"use client";

import Link from "next/link";
import { Fragment } from "react";
import { useState } from "react";

const planPrices = {
  monthly: { starter: "R$ 97", pro: "R$ 247", agency: "R$ 497", enterprise: "Consulta" },
  yearly: { starter: "R$ 975", pro: "R$ 2.470", agency: "R$ 4.970", enterprise: "Consulta" }
};

const features = [
  { category: "Discovery", items: [
    { name: "Busca por Google Maps", starter: true, pro: true, agency: true, enterprise: true },
    { name: "GBP Inteligência (avaliações)", starter: true, pro: true, agency: true, enterprise: true },
    { name: "Inteligência de Website", starter: true, pro: true, agency: true, enterprise: true },
    { name: "Digital Presence Score", starter: true, pro: true, agency: true, enterprise: true },
    { name: "Oportunidades Automaticas (IA)", starter: true, pro: true, agency: true, enterprise: true },
    { name: "Social Scanner", starter: false, pro: true, agency: true, enterprise: true }
  ] },
  { category: "CRM", items: [
    { name: "Pipeline e funil", starter: true, pro: true, agency: true, enterprise: true },
    { name: "Ficha inteligente do lead", starter: true, pro: true, agency: true, enterprise: true },
    { name: "Agenda e follow-up", starter: true, pro: true, agency: true, enterprise: true },
    { name: "Propostas em PDF", starter: false, pro: true, agency: true, enterprise: true },
    { name: "Import/Export CSV", starter: false, pro: true, agency: true, enterprise: true },
    { name: "Equipes multiusuario", starter: false, pro: true, agency: true, enterprise: true }
  ] },
  { category: "IA NODERE", items: [
    { name: "Assistente de prospeccao", starter: "50 req/mes", pro: true, agency: true, enterprise: true },
    { name: "Assistente comercial (scripts)", starter: false, pro: true, agency: true, enterprise: true },
    { name: "Diagnostico comercial automatico", starter: false, pro: true, agency: true, enterprise: true },
    { name: "Qualificacao automatica em massa", starter: false, pro: false, agency: true, enterprise: true }
  ] },
  { category: "Engage", items: [
    { name: "WhatsApp Inbox", starter: false, pro: true, agency: true, enterprise: true },
    { name: "Sequencias de e-mail", starter: false, pro: true, agency: true, enterprise: true },
    { name: "Disparos em massa", starter: false, pro: false, agency: true, enterprise: true },
    { name: "Central omnichannel", starter: false, pro: false, agency: true, enterprise: true },
    { name: "Automacoes por evento", starter: false, pro: false, agency: true, enterprise: true }
  ] },
  { category: "Analytics", items: [
    { name: "Dashboard executivo", starter: true, pro: true, agency: true, enterprise: true },
    { name: "Relatorios PDF/CSV", starter: false, pro: true, agency: true, enterprise: true },
    { name: "Forecast de receita", starter: false, pro: true, agency: true, enterprise: true },
    { name: "Ranking de operadores", starter: false, pro: false, agency: true, enterprise: true }
  ] },
  { category: "Suporte", items: [
    { name: "Chat na plataforma", starter: true, pro: true, agency: true, enterprise: true },
    { name: "Suporte WhatsApp", starter: false, pro: true, agency: true, enterprise: true },
    { name: "Gerente dedicado", starter: false, pro: false, agency: false, enterprise: true }
  ] }
];

const plans = ["starter", "pro", "agency", "enterprise"] as const;

function featureValue(value: boolean | string) {
  if (value === true) return <span className="pricing-check">✓</span>;
  if (value === false) return <span className="pricing-x">✗</span>;
  return <span className="pricing-text">{value}</span>;
}

export default function PricingComparison() {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const prices = planPrices[period];

  return (
    <section className="pricing-page">
      <div className="site-container">
        <div className="pricing-toggle" role="group" aria-label="Alternar periodo">
          <button className={period === "monthly" ? "active" : ""} type="button" onClick={() => setPeriod("monthly")}>Mensal</button>
          <button className={period === "yearly" ? "active" : ""} type="button" onClick={() => setPeriod("yearly")}>Anual · 16% off</button>
        </div>
        <div className="pricing-cards">
          {plans.map((plan) => (
            <article className={plan === "pro" ? "pricing-card featured" : "pricing-card"} key={plan}>
              {plan === "pro" && <span>Mais popular</span>}
              <h2>{plan}</h2>
              <strong>{prices[plan]}{plan !== "enterprise" && <small>{period === "monthly" ? "/mes" : "/ano"}</small>}</strong>
              <Link href={plan === "enterprise" ? "/contato" : "/app/register"}>{plan === "enterprise" ? "Falar com vendas" : "Comecar gratis"}</Link>
            </article>
          ))}
        </div>
        <div className="pricing-table-wrap">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Recurso</th>
                <th>Starter</th>
                <th>Pro</th>
                <th>Agency</th>
                <th>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {features.map((group) => (
                <Fragment key={group.category}>
                  <tr className="pricing-category" key={`${group.category}-category`}>
                    <td colSpan={5}>{group.category}</td>
                  </tr>
                  {group.items.map((item) => (
                    <tr key={`${group.category}-${item.name}`}>
                      <td>{item.name}</td>
                      <td>{featureValue(item.starter)}</td>
                      <td>{featureValue(item.pro)}</td>
                      <td>{featureValue(item.agency)}</td>
                      <td>{featureValue(item.enterprise)}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
