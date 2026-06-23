import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/site/SitePageShell";
import DynamicCmsPage from "@/components/site/DynamicCmsPage";
import { Logo } from "@/components/brand/Logo";
import { getPublicPage } from "@/lib/publicContent";

const problems = [
  "Prospecção manual consome horas sem resultado",
  "Não sabe quais empresas precisam do seu serviço",
  "Leads frios demais para converter",
  "CRM, agenda, proposta e abordagem ficam espalhados"
];

const solutions = [
  { tone: "discovery", icon: "🔎", title: "Discovery comercial", desc: "Busque empresas por cidade, segmento e raio, com dados reais do Google e sinais digitais." },
  { tone: "crm", icon: "📊", title: "CRM e funil vivo", desc: "Transforme oportunidades em pipeline, acompanhe histórico, agenda, tarefas e proposta." },
  { tone: "engage", icon: "💬", title: "WhatsApp e abordagem", desc: "Crie scripts, registre conversas e mantenha follow-ups com contexto do lead." },
  { tone: "ai", icon: "✨", title: "IA comercial", desc: "Gere diagnóstico, recomendação de abordagem e proposta com dados reais de cada empresa." }
];

const people = [
  {
    name: "Camila Souza",
    role: "Fundadora · Consultoria de marketing",
    result: "12 contratos/mês",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&q=80"
  },
  {
    name: "Felipe Martins",
    role: "Diretor comercial · Agência digital",
    result: "3x conversões",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=80"
  },
  {
    name: "Ana Lima",
    role: "Gestora de tráfego",
    result: "180 leads/semana",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&q=80"
  },
  {
    name: "Roberto Alves",
    role: "Gerente de vendas · Agência B2B",
    result: "1 operação só",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80"
  }
];

const audiences = [
  "Agências de marketing digital",
  "Consultores de tráfego pago",
  "Times de vendas B2B",
  "Profissionais de prospecção ativa",
  "Empresas que prestam serviços digitais para PMEs"
];

const steps = [
  { icon: "🔍", tag: "Passo 01", title: "Encontre com precisão", desc: "Busque por segmento e cidade. O NODERE cruza dados de presença digital, avaliações e oportunidades comerciais." },
  { icon: "🧠", tag: "Passo 02", title: "Analise e priorize", desc: "Score, diagnóstico e IA ajudam sua equipe a entender quem tem mais chance real de comprar." },
  { icon: "💬", tag: "Passo 03", title: "Aborde e feche", desc: "CRM, WhatsApp, agenda, histórico e proposta em PDF ficam conectados na mesma operação." }
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

const testimonials = [
  {
    quote: "Em 3 dias prospectei 180 empresas no meu segmento com diagnóstico automático. Nunca fui tão assertivo na abordagem.",
    name: "Felipe Martins",
    role: "Diretor comercial · Agência digital SP",
    result: "3x mais conversões",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&q=80"
  },
  {
    quote: "O diagnóstico de presença digital virou meu principal argumento de venda. O cliente vê o score e entende o problema.",
    name: "Camila Souza",
    role: "Fundadora · Consultoria de marketing",
    result: "12 contratos/mês",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&q=80"
  },
  {
    quote: "Minha equipe parou de usar ferramentas soltas. Tudo ficou no mesmo fluxo, do lead até a proposta assinada.",
    name: "Roberto Alves",
    role: "Gerente de vendas · Agência B2B",
    result: "1 plataforma para tudo",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80"
  }
];

const blogPosts = [
  {
    href: "/blog/prospeccao-200-empresas",
    tag: "Discovery",
    title: "Como prospectar 200 empresas por semana com score digital automatizado",
    desc: "Use o Discovery para encontrar empresas com baixa presença digital e alto potencial.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&q=80"
  },
  {
    href: "/blog/pipeline-inteligente",
    tag: "CRM",
    title: "Pipeline inteligente: como parar de perder leads no funil de vendas",
    desc: "Configure estágios, alertas de estagnação e rotinas comerciais mais claras.",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=640&q=80"
  },
  {
    href: "/blog/copiloto-ia-scripts",
    tag: "IA NODERE",
    title: "Copiloto comercial: IA gerando scripts de abordagem em segundos",
    desc: "Crie mensagens personalizadas com contexto real de cada lead.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=640&q=80"
  }
];

const fallbackMetadata: Metadata = {
  title: "NODERE — Inteligência Comercial, CRM e IA",
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

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicPage("home");
  return page ? { ...fallbackMetadata, title: page.seo_title || fallbackMetadata.title, description: page.seo_description || fallbackMetadata.description } : fallbackMetadata;
}

export default async function LandingPage() {
  const cmsPage = await getPublicPage("home");
  if (cmsPage?.nodere_cms_sections?.length) {
    return <SitePageShell><DynamicCmsPage page={cmsPage} /></SitePageShell>;
  }
  return (
    <SitePageShell>
      <section className="landing-hero">
        <div className="landing-hero__content">
          <Logo variant="full" height={60} className="landing-hero__logo" />
          <p className="landing-tagline">Plataforma comercial para quem vende serviços digitais</p>
          <h1>Encontre empresas certas, priorize oportunidades e venda com uma operação mais humana.</h1>
          <p className="landing-subtitle">
            O NODERE conecta busca de empresas, score comercial, CRM, WhatsApp, propostas e IA para transformar prospecção em relacionamento e receita.
          </p>
          <div className="landing-actions">
            <Link href="/app/register" className="btn-primary-lg">Começar grátis 14 dias</Link>
            <Link href="/app/login" className="btn-ghost-lg">Entrar</Link>
            <Link href="#como-funciona" className="btn-ghost-lg">Como funciona</Link>
          </div>
          <div className="landing-hero__trust">
            <span>✓ Sem cartão de crédito</span>
            <span>✓ 14 dias grátis</span>
            <span>✓ LGPD compliant</span>
          </div>
        </div>
        <div className="landing-human-visual" id="demo">
          <div className="landing-human-visual__photo">
            <img
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=900&q=80"
              alt="Profissional usando NODERE em uma operação comercial"
            />
          </div>
          <div className="landing-score-card">
            <span>Score de oportunidade</span>
            <strong>87</strong>
            <small>Alta chance de conversão</small>
          </div>
          <div className="landing-live-card">
            <b>127</b>
            <span>empresas analisadas hoje</span>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__title">
          <span>O problema</span>
          <h2>Você sabe onde estão seus próximos clientes?</h2>
        </div>
        <div className="landing-problem-grid">
          {problems.map((item) => <article key={item}><span>!</span>{item}</article>)}
        </div>
      </section>

      <section className="landing-section" id="funcionalidades">
        <div className="landing-section__title">
          <span>A solução NODERE</span>
          <h2>Inteligência + CRM + IA em um só lugar</h2>
        </div>
        <div className="landing-solution-grid">
          {solutions.map((item) => (
            <article key={item.title} className={`landing-solution-card--${item.tone}`}>
              <span>{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <Link href="/solucoes">Conhecer solução →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-people-section">
        <div className="landing-people-photos">
          {people.map((person) => (
            <article key={person.name}>
              <img src={person.image} alt={person.name} loading="lazy" />
              <div>
                <strong>{person.name}</strong>
                <small>{person.role}</small>
                <span>{person.result}</span>
              </div>
            </article>
          ))}
        </div>
        <div className="landing-people-copy">
          <span>Para quem vende serviços recorrentes</span>
          <h2>Feito para quem vende mais com inteligência.</h2>
          <p>Agências digitais, consultorias, times SDR e gestores de tráfego ganham uma rotina comercial mais visual, simples e confiável.</p>
          <div className="landing-avatar-row" aria-label="Profissionais usando NODERE">
            <span>👩‍💻</span><span>👨‍💼</span><span>👩‍🎨</span><span>👨‍🎨</span><b>+2k</b>
          </div>
          <Link href="/app/register" className="btn-primary-lg">Começar grátis →</Link>
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

      <section className="landing-section" id="como-funciona">
        <div className="landing-section__title">
          <span>Como funciona</span>
          <h2>Da busca ao fechamento em 3 passos</h2>
        </div>
        <div className="landing-steps">
          {steps.map((item, index) => (
            <article key={item.title}>
              <b>{index + 1}</b>
              <span>{item.icon}</span>
              <small>{item.tag}</small>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
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

      <section className="landing-section" id="clientes">
        <div className="landing-section__title">
          <span>Clientes</span>
          <h2>Operações comerciais com mais clareza e velocidade</h2>
        </div>
        <div className="landing-testimonials">
          {testimonials.map((item) => (
            <article key={item.name}>
              <div className="landing-stars">★★★★★</div>
              <p>"{item.quote}"</p>
              <div className="landing-testimonial-author">
                <img src={item.image} alt={item.name} loading="lazy" />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.role}</small>
                  <b>{item.result}</b>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="blog">
        <div className="landing-section__title landing-blog-title">
          <span>Blog & Conteúdo</span>
          <h2>Aprenda a vender mais com inteligência comercial</h2>
          <Link href="/blog">Ver todos os artigos →</Link>
        </div>
        <div className="landing-blog-grid">
          {blogPosts.map((post) => (
            <Link href={post.href} key={post.title}>
              <img src={post.image} alt={post.title} loading="lazy" />
              <span>{post.tag}</span>
              <h3>{post.title}</h3>
              <p>{post.desc}</p>
              <small>Jun 2026 · 5 min</small>
            </Link>
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
        <h2>Pronto para encontrar seus próximos clientes?</h2>
        <p>14 dias grátis. Sem cartão. Sem compromisso.</p>
        <Link href="/app/register" className="btn-primary-lg">Criar conta grátis →</Link>
        <p>Sem cartão de crédito. Cancele quando quiser.</p>
      </section>
    </SitePageShell>
  );
}
