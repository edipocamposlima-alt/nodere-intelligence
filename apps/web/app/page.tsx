import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/site/SitePageShell";
import { Logo } from "@/components/brand/Logo";

const problems = [
  "Prospecção manual consome horas sem resultado",
  "Não sabe quais empresas precisam do seu serviço",
  "Leads frios demais para converter"
];

const solutions = [
  { icon: "🔍", title: "Encontre empresas", desc: "Busque por segmento, cidade e raio geográfico. Acesse dados reais do Google com 1 clique." },
  { icon: "📊", title: "Analise oportunidades", desc: "O Score NODERE pontua cada empresa de 0 a 1000 com base em presença digital e potencial comercial." },
  { icon: "💼", title: "Organize no CRM", desc: "Salve leads direto no funil, acompanhe atividades e registre o histórico de relacionamento." },
  { icon: "🤖", title: "Feche com IA", desc: "Gere diagnósticos, abordagens, mensagens de WhatsApp e propostas com IA em segundos." }
];

const modules = [
  { id: "discovery", label: "🔍 Intelligence & Discovery", title: "Busca comercial com dados reais", desc: "Encontre empresas por cidade, segmento, raio e sinais de maturidade digital." },
  { id: "score", label: "📊 Score NODERE", title: "Priorização objetiva", desc: "Classifique oportunidades por presença digital, tráfego, reputação, site, WhatsApp e intenção comercial." },
  { id: "crm", label: "💼 CRM Comercial", title: "Pipeline pronto para vender", desc: "Transforme resultados em leads, acompanhe etapas, tarefas, contatos, histórico e propostas." },
  { id: "ai", label: "🤖 IA Comercial", title: "Abordagem com contexto", desc: "Crie diagnósticos, mensagens, scripts e propostas usando dados reais de cada empresa." }
];

const audiences = [
  "Agências de marketing digital",
  "Consultores de tráfego pago",
  "Times de vendas B2B",
  "Profissionais de prospecção ativa",
  "Empresas que prestam serviços digitais para PMEs"
];

const steps = [
  { title: "Busque empresas na sua cidade por segmento", desc: "Resultados reais do Google com dados de presença digital." },
  { title: "Analise o Score NODERE de cada empresa", desc: "Saiba exatamente quem tem mais potencial para contratar você." },
  { title: "Aborde com IA e organize no CRM", desc: "Mensagens, diagnósticos e funil de vendas prontos para usar." }
];

const plans = [
  { name: "Starter", monthly: "R$97/mês", yearly: "R$77/mês", users: "2 usuários", credits: "200 créditos", features: ["CRM", "Discovery"] },
  { name: "Pro", monthly: "R$197/mês", yearly: "R$157/mês", users: "5 usuários", credits: "1000 créditos", features: ["CRM", "Discovery", "IA", "Propostas"] },
  { name: "Agency", monthly: "R$397/mês", yearly: "R$317/mês", users: "15 usuários", credits: "5000 créditos", features: ["CRM", "Discovery", "IA", "Propostas", "WhatsApp"] },
  { name: "Enterprise", monthly: "Consultar", yearly: "Consultar", users: "Ilimitado", credits: "API + White-label", features: ["Tudo", "SLA", "Governança"] }
];

const faqs = [
  ["Como funciona o período de trial?", "Você pode testar a plataforma por 14 dias antes de escolher um plano."],
  ["Quantas empresas posso buscar por mês?", "Cada plano possui uma franquia de créditos. Buscas e enriquecimentos consomem créditos."],
  ["O NODERE funciona para qualquer segmento?", "Sim. A busca funciona por cidade, segmento, palavra-chave e dados reais de presença digital."],
  ["Preciso cadastrar cartão para testar?", "Não. O trial pode ser iniciado sem cartão de crédito."],
  ["Como funciona o Score NODERE?", "O score combina sinais de site, reputação, tráfego, redes, dados comerciais e oportunidades digitais."],
  ["Posso cancelar quando quiser?", "Sim. O cancelamento pode ser feito ao fim do ciclo contratado."]
];

export const metadata: Metadata = {
  title: "NODERE — Intelligence Comercial, CRM e IA",
  description: "Encontre empresas, analise presença digital, priorize oportunidades e venda mais com IA.",
  openGraph: {
    title: "NODERE",
    description: "Plataforma de inteligência comercial para agências e times de marketing.",
    url: "https://nodere.com.br",
    siteName: "NODERE",
    locale: "pt_BR",
    type: "website"
  }
};

export default function LandingPage() {
  return (
    <SitePageShell>
      <section className="landing-hero">
        <div className="landing-hero__content">
          <Logo variant="full" height={60} className="landing-hero__logo" />
          <p className="landing-tagline">Encontre empresas, analise presença digital, priorize oportunidades e venda mais — com IA.</p>
          <h1>Encontre empresas com baixa presença digital e venda seus serviços para quem realmente precisa.</h1>
          <p className="landing-subtitle">
            O NODERE é a plataforma de inteligência comercial para agências e times de marketing que querem prospectar com dados reais e fechar mais negócios.
          </p>
          <div className="landing-actions">
            <Link href="/app/register" className="btn-primary-lg">Começar grátis 14 dias</Link>
            <Link href="#demo" className="btn-ghost-lg">Ver demonstração →</Link>
          </div>
        </div>
        <div className="landing-preview" id="demo">
          <div className="landing-preview__bar"><span /> <span /> <span /></div>
          <div className="landing-preview__grid">
            <div><strong>Score NODERE</strong><b>842</b><small>Alta oportunidade</small></div>
            <div><strong>Empresas encontradas</strong><b>128</b><small>Clínicas em Goiânia</small></div>
            <div><strong>CRM ativo</strong><b>37</b><small>Leads priorizados</small></div>
          </div>
          <div className="landing-preview__pipeline">
            {["Novo lead", "Qualificado", "Proposta", "Fechado"].map((item, index) => <span key={item} style={{ width: `${92 - index * 14}%` }}>{item}</span>)}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__title">
          <span>O problema</span>
          <h2>Você sabe onde estão seus próximos clientes?</h2>
        </div>
        <div className="landing-problem-grid">
          {problems.map((item) => <article key={item}>❌ {item}</article>)}
        </div>
      </section>

      <section className="landing-section" id="funcionalidades">
        <div className="landing-section__title">
          <span>A solução NODERE</span>
          <h2>Intelligence + CRM + IA em um só lugar</h2>
        </div>
        <div className="landing-solution-grid">
          {solutions.map((item) => (
            <article key={item.title}>
              <span>{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-modules">
        <div className="landing-section__title">
          <span>Módulos principais</span>
          <h2>Quatro frentes para transformar prospecção em vendas</h2>
        </div>
        <div className="landing-tabs">
          {modules.map((item, index) => (
            <article key={item.id} className={index === 0 ? "active" : ""}>
              <strong>{item.label}</strong>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-two-col">
        <div>
          <span className="site-eyebrow">Para quem é</span>
          <h2>NODERE foi pensado para quem vende serviços digitais.</h2>
        </div>
        <div className="landing-checks">
          {audiences.map((item) => <span key={item}>✅ {item}</span>)}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__title">
          <span>Como funciona</span>
          <h2>Da busca ao fechamento em 3 passos</h2>
        </div>
        <div className="landing-steps">
          {steps.map((item, index) => (
            <article key={item.title}>
              <b>{index + 1}</b>
              <h3>{item.title}</h3>
              <p>→ {item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="planos">
        <div className="landing-section__title">
          <span>Planos</span>
          <h2>Escolha mensal ou anual — economize 20%</h2>
        </div>
        <div className="landing-plan-toggle"><span>Mensal</span><span>Anual — economize 20%</span></div>
        <div className="landing-pricing">
          {plans.map((plan) => (
            <article key={plan.name} className={plan.name === "Pro" ? "featured" : ""}>
              <h3>{plan.name}</h3>
              <strong>{plan.monthly}</strong>
              <small>{plan.yearly} no anual</small>
              <p>{plan.credits}</p>
              <p>{plan.users}</p>
              <ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
              <Link href={plan.name === "Enterprise" ? "/contato" : "/app/register"}>{plan.name === "Enterprise" ? "Contato →" : "Começar →"}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="faq">
        <div className="landing-section__title">
          <span>FAQ</span>
          <h2>Perguntas frequentes</h2>
        </div>
        <div className="landing-faq">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-final">
        <h2>Comece a prospectar com inteligência hoje mesmo.</h2>
        <Link href="/app/register" className="btn-primary-lg">Criar conta grátis — 14 dias</Link>
        <p>Sem cartão de crédito. Cancele quando quiser.</p>
      </section>
    </SitePageShell>
  );
}
