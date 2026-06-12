import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/site/SitePageShell";

const techLogos = ["Google Maps", "Google Business", "Apollo.io", "OpenAI", "WhatsApp Business", "Receita Federal"];

const steps = [
  { n: "01", title: "Encontre", desc: "Busque empresas por segmento, cidade ou raio. Receba diagnostico digital automatico em segundos." },
  { n: "02", title: "Analise e priorize", desc: "Score de oportunidade 0-100. IA identifica quem precisa de site, Google Ads, reputacao ou social." },
  { n: "03", title: "Aborde e feche", desc: "CRM integrado, scripts gerados por IA, WhatsApp e e-mail na mesma tela. Menos tempo, mais vendas." }
];

const solutions = [
  { icon: "🔍", name: "Discovery", desc: "Encontre oportunidades por Google Maps, score digital e redes sociais." },
  { icon: "🧠", name: "Intelligence", desc: "Enriqueça dados com Apollo, Receita Federal e diagnostico por IA." },
  { icon: "📊", name: "CRM", desc: "Pipeline, ficha de lead, propostas em PDF e agenda integrados." },
  { icon: "💬", name: "Engage", desc: "WhatsApp, e-mail e omnichannel com automacoes por estagio do funil." },
  { icon: "🤖", name: "AI Nexus", desc: "Copiloto comercial com contexto real do lead. Prospeccao por linguagem natural." },
  { icon: "📈", name: "Analytics", desc: "Dashboard executivo, forecast de receita e ranking de operadores." },
  { icon: "🗂️", name: "Operations", desc: "Projetos, portal do cliente e gestao de documentos pos-venda." },
  { icon: "🤝", name: "Marketplace", desc: "Rede de parceiros, comissionamento e integracao com ERPs." }
];

const plans = [
  { name: "Starter", price: "R$ 97", period: "/mes", highlight: false, cta: "Comecar gratis", desc: "Para validar prospeccao com 1 usuario." },
  { name: "Pro", price: "R$ 247", period: "/mes", highlight: true, cta: "Comecar gratis", desc: "Para operacao comercial com IA completa. Ate 3 usuarios." },
  { name: "Agency", price: "R$ 497", period: "/mes", highlight: false, cta: "Comecar gratis", desc: "Para times com omnichannel e analytics. Ate 10 usuarios." },
  { name: "Enterprise", price: "Consulta", period: "", highlight: false, cta: "Falar com vendas", desc: "Customizacao completa, API publica e SLA." }
];

export const metadata: Metadata = {
  title: "NODERE Nexus — Revenue Intelligence Platform",
  description: "A plataforma que conecta inteligencia comercial, prospeccao e vendas em um unico fluxo. Encontre empresas, analise oportunidades e feche mais contratos.",
  openGraph: {
    title: "NODERE Nexus",
    description: "Revenue Intelligence Platform para agencias e times comerciais.",
    url: "https://nodere.com.br",
    siteName: "NODERE Nexus",
    locale: "pt_BR",
    type: "website"
  }
};

export default function HomePage() {
  return (
    <SitePageShell>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">🚀 Revenue Intelligence Platform</div>
          <h1>Encontre empresas que precisam<br />dos seus servicos. Feche mais.</h1>
          <p>Prospeccao inteligente com diagnostico digital, CRM e IA — tudo em um unico fluxo.</p>
          <div className="hero-ctas">
            <Link href="/app/register" className="btn-primary-lg">Comecar gratis por 14 dias →</Link>
            <Link href="/solucoes" className="btn-ghost-lg">Ver como funciona</Link>
          </div>
          <p className="hero-note">Sem cartao de credito · Cancele quando quiser</p>
        </div>
        <div className="hero-preview">
          <div className="preview-card">
            <div className="preview-score">Score 82 · Alta intencao</div>
            <div className="preview-items">
              <div>🏋️ Academias sem site — <strong>42 leads</strong></div>
              <div>⭐ Clinicas com baixa avaliacao — <strong>18 alertas</strong></div>
              <div>📢 Empresas sem Google Ads — <strong>31 oportunidades</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="tech-logos">
        <p>Conectado as melhores fontes de dados</p>
        <div className="logos-row">
          {techLogos.map((logo) => <span key={logo}>{logo}</span>)}
        </div>
      </section>

      <section className="how-it-works">
        <h2>Como funciona</h2>
        <div className="steps-grid">
          {steps.map((step) => (
            <div key={step.n} className="step-card">
              <span className="step-number">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="solutions">
        <h2>Uma plataforma. Oito conjuntos integrados.</h2>
        <p>Use o que voce precisa agora. Expanda conforme cresce.</p>
        <div className="solutions-grid">
          {solutions.map((solution) => (
            <div key={solution.name} className="solution-card">
              <span className="solution-icon">{solution.icon}</span>
              <h3>{solution.name}</h3>
              <p>{solution.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="plans-preview">
        <h2>Planos que crescem com voce</h2>
        <div className="plans-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`plan-card ${plan.highlight ? "plan-featured" : ""}`}>
              {plan.highlight && <div className="plan-badge">Mais popular</div>}
              <h3>{plan.name}</h3>
              <div className="plan-price">{plan.price}<span>{plan.period}</span></div>
              <p>{plan.desc}</p>
              <Link href={plan.name === "Enterprise" ? "/contato" : "/app/register"} className={plan.highlight ? "btn-primary" : "btn-ghost"}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p><Link href="/precos">Ver comparativo completo →</Link></p>
      </section>

      <section className="cta-final">
        <h2>Pronto para encontrar seus proximos clientes?</h2>
        <p>14 dias gratis. Sem cartao. Sem compromisso.</p>
        <Link href="/app/register" className="btn-primary-lg">Criar conta gratis →</Link>
      </section>
    </SitePageShell>
  );
}
