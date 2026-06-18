"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TICKER = ["Agências digitais", "Consultorias B2B", "Times de SDR", "Gestores de tráfego", "Prestadores locais", "Franquias"];

const STATS = [
  { value: "2.400+", label: "Empresas prospectadas", icon: "🏢" },
  { value: "94%", label: "Taxa de satisfação", icon: "⭐" },
  { value: "3x", label: "Mais conversões", icon: "📈" },
  { value: "< 3s", label: "Diagnóstico gerado", icon: "⚡" }
];

const SOLUTIONS = [
  { icon: "🔍", code: "DISC", name: "Discovery", color: "#F59E0B", desc: "Encontre empresas com baixa presença digital e alto potencial de compra por segmento e cidade." },
  { icon: "🧠", code: "INTEL", name: "Intelligence", color: "#7C3AED", desc: "Enriquecimento automático com Apollo, Receita Federal e diagnóstico por IA." },
  { icon: "📊", code: "CRM", name: "CRM", color: "var(--crm-new)", desc: "Pipeline visual, ficha 360, propostas em PDF e agenda de follow-ups integrados." },
  { icon: "💬", code: "ENGAGE", name: "Engage", color: "#16A34A", desc: "WhatsApp inbox, disparos em massa, e-mail e central omnichannel com automações." },
  { icon: "🤖", code: "AI", name: "IA NODERE", color: "var(--ai-primary)", desc: "Copiloto comercial com contexto real do lead. Scripts, análise e respostas inteligentes." },
  { icon: "📈", code: "ANA", name: "Analytics", color: "#2563EB", desc: "Dashboard executivo, forecast de receita e ranking de operadores em tempo real." },
  { icon: "🗂️", code: "OPS", name: "Operations", color: "#F97316", desc: "Projetos kanban, portal do cliente e controle de documentos pós-venda." },
  { icon: "🤝", code: "MKT", name: "Marketplace", color: "#03624C", desc: "Rede de parceiros, comissionamento e integração nativa com ERPs brasileiros." }
];

const INTEGRATIONS = [
  { icon: "🗺️", name: "Google Maps", color: "#4285F4" },
  { icon: "⭐", name: "Google Business", color: "#FBBC04" },
  { icon: "📊", name: "Google Ads", color: "#34A853" },
  { icon: "🚀", name: "Apollo.io", color: "#7C3AED" },
  { icon: "🤖", name: "OpenAI GPT-4", color: "#10A37F" },
  { icon: "💬", name: "WhatsApp Business", color: "#25D366" },
  { icon: "📘", name: "Facebook Ads", color: "#1877F2" },
  { icon: "📸", name: "Instagram", color: "#E1306C" },
  { icon: "💼", name: "LinkedIn", color: "#0A66C2" },
  { icon: "🏛️", name: "Receita Federal", color: "var(--info)" },
  { icon: "💳", name: "Stripe", color: "#635BFF" },
  { icon: "💰", name: "Mercado Pago", color: "#00BCFF" },
  { icon: "🗄️", name: "Supabase", color: "#3ECF8E" },
  { icon: "📧", name: "E-mail SMTP", color: "#EA4335" }
];

const PLANS = [
  { name: "Starter", price: 97, users: "1 usuário", highlight: false, features: ["Discovery completo", "CRM essencial", "Dashboard básico", "IA limitada", "300 créditos/mês"] },
  { name: "Pro", price: 247, users: "Até 3 usuários", highlight: true, features: ["Tudo do Starter", "Intelligence completo", "WhatsApp + E-mail", "IA copiloto ilimitado", "1.000 créditos/mês"] },
  { name: "Agency", price: 497, users: "Até 10 usuários", highlight: false, features: ["Tudo do Pro", "Omnichannel completo", "Automações avançadas", "Analytics completo", "Operations + Marketplace"] },
  { name: "Enterprise", price: null, users: "Ilimitado", highlight: false, features: ["Todos os módulos", "White-label disponível", "API pública", "SLA dedicado", "Gerente de conta"] }
];

const TESTIMONIALS = [
  { name: "Felipe Martins", role: "Diretor comercial", company: "Agência digital SP", text: "Em 3 dias prospectei 180 empresas no meu segmento com diagnóstico automático. Nunca fui tão assertivo na abordagem.", avatar: "👨‍💼" },
  { name: "Camila Souza", role: "Fundadora", company: "Consultoria de marketing", text: "O diagnóstico de presença digital virou meu principal argumento de venda. O cliente vê o score e já entende o problema.", avatar: "👩‍💼" },
  { name: "Roberto Alves", role: "Gerente de vendas", company: "Agência B2B", text: "Minha equipe parou de usar 4 ferramentas diferentes. Tudo num único lugar, do lead até a proposta assinada.", avatar: "👨‍💻" }
];

const BLOG_POSTS = [
  { tag: "Discovery", color: "#F59E0B", title: "Como prospectar 200 empresas por semana com score digital automatizado", read: "5 min", date: "Jun 2026" },
  { tag: "CRM", color: "var(--crm-new)", title: "Pipeline inteligente: como parar de perder leads no funil de vendas", read: "4 min", date: "Jun 2026" },
  { tag: "IA NODERE", color: "var(--ai-primary)", title: "Copiloto comercial: como a IA gera scripts de abordagem em segundos", read: "6 min", date: "Mai 2026" },
  { tag: "Engage", color: "#16A34A", title: "WhatsApp B2B: como escalar prospecção sem virar spam", read: "5 min", date: "Mai 2026" },
  { tag: "Analytics", color: "#2563EB", title: "Forecast de receita: como prever seu faturamento com precisão", read: "4 min", date: "Abr 2026" },
  { tag: "Intelligence", color: "#7C3AED", title: "Enriquecimento de dados: Apollo + Receita Federal na mesma tela", read: "3 min", date: "Abr 2026" }
];

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function HomeDefinitiveClient() {
  const [ticker, setTicker] = useState(0);
  const [counter, setCounter] = useState(0);
  const [annual, setAnnual] = useState(false);
  const [hoveredSol, setHoveredSol] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    let n = 0;
    const score = window.setInterval(() => {
      n += 1;
      setCounter(n);
      if (n >= 82) window.clearInterval(score);
    }, 22);
    const loop = window.setInterval(() => setTicker((index) => (index + 1) % TICKER.length), 2000);
    return () => {
      window.clearInterval(score);
      window.clearInterval(loop);
    };
  }, []);

  return (
    <>
      <section className="def-hero">
        <div className="def-grid" />
        <div className="def-orb def-orb--blue" />
        <div className="def-orb def-orb--cyan" />
        <div className="def-container def-hero__grid">
          <div className={visible ? "def-hero__copy is-visible" : "def-hero__copy"}>
            <div className="def-live"><span />Plataforma comercial</div>
            <h1>Encontre empresas<br />que precisam<br /><strong>dos seus serviços.</strong></h1>
            <div className="def-ticker"><span>Feito para</span><b>{TICKER[ticker]}</b></div>
            <p>Prospecção inteligente com diagnóstico digital, CRM e copiloto de IA — do primeiro contato ao fechamento.</p>
            <div className="def-actions">
              <Link className="def-primary" href="/register">Começar grátis — 14 dias ✦</Link>
              <Link className="def-ghost" href="/planos">Ver planos →</Link>
            </div>
            <div className="def-trust">{["Sem cartão", "Cancele quando quiser", "LGPD"].map((item) => <span key={item}>✓ {item}</span>)}</div>
          </div>
          <div className={visible ? "def-score is-visible" : "def-score"}>
            <div className="def-score__top">
              <div><small>Score de oportunidade</small><b>Academias · Caxias do Sul, RS</b></div>
              <strong><span />Alta intenção</strong>
            </div>
            <div className="def-score__number">{counter}</div>
            <small>/ 100 pontos de potencial</small>
            <div className="def-score__bar"><span style={{ width: `${counter}%` }} /></div>
            {[
              { icon: "🏋️", label: "Academias sem site", val: "42 leads", c: "#F59E0B" },
              { icon: "⭐", label: "Nota abaixo de 4.0", val: "18 alertas", c: "#EF4444" },
              { icon: "📢", label: "Sem Google Ads", val: "31 oport.", c: "var(--info)" },
              { icon: "📸", label: "Sem Instagram ativo", val: "56 leads", c: "#2563EB" }
            ].map((item, index) => (
              <div className="def-opportunity" style={{ animationDelay: `${0.3 + index * 0.08}s` }} key={item.label}>
                <span>{item.icon} {item.label}</span>
                <b style={{ color: item.c, background: `${item.c}18` }}>{item.val}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="def-stats">
        <div className="def-container def-stats__grid">{STATS.map((stat) => <article key={stat.label}><span>{stat.icon}</span><b>{stat.value}</b><small>{stat.label}</small></article>)}</div>
      </section>

      <section className="def-section">
        <div className="def-container">
          <div className="def-heading"><span>Integrações</span><h2>Todas as fontes conectadas em um só fluxo.</h2><p>Do Google Maps ao WhatsApp, a operação comercial roda com dados, IA e automação real.</p></div>
          <div className="def-integrations">{INTEGRATIONS.map((integration) => <span style={{ borderColor: `${integration.color}55`, color: integration.color }} key={integration.name}><b>{integration.icon}</b>{integration.name}</span>)}</div>
        </div>
      </section>

      <section className="def-section def-section--alt">
        <div className="def-container">
          <div className="def-heading"><span>Soluções</span><h2>8 conjuntos para operar receita com inteligência.</h2></div>
          <div className="def-solutions">{SOLUTIONS.map((solution, index) => <article onMouseEnter={() => setHoveredSol(index)} onMouseLeave={() => setHoveredSol(null)} style={{ borderColor: hoveredSol === index ? solution.color : undefined, boxShadow: hoveredSol === index ? `0 18px 44px ${solution.color}22` : undefined }} key={solution.code}><div><i>{solution.icon}</i><small style={{ color: solution.color }}>{solution.code}</small></div><h3>{solution.name}</h3><p>{solution.desc}</p><Link style={{ color: solution.color }} href={`/solucoes#${solution.code.toLowerCase()}`}>Saiba mais →</Link></article>)}</div>
        </div>
      </section>

      <section className="def-section">
        <div className="def-container">
          <div className="def-heading"><span>Preços simples</span><h2>Planos que crescem com você</h2><p>14 dias grátis em todos os planos. Sem cartão de crédito.</p><div className="def-toggle"><button className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>Mensal</button><button className={annual ? "active" : ""} onClick={() => setAnnual(true)}>Anual <b>-17%</b></button></div></div>
          <div className="def-plans">{PLANS.map((plan) => <article className={plan.highlight ? "featured" : ""} key={plan.name}>{plan.highlight && <em>Mais popular</em>}<h3>{plan.name}</h3><small>{plan.users}</small><strong>{plan.price ? <>R$ {annual ? Math.round(plan.price * 0.83) : plan.price}<span>/mês</span></> : "Consulte"}</strong><Link href={plan.name === "Enterprise" ? "/contato" : "/register"}>{plan.name === "Enterprise" ? "Falar com vendas" : "Começar grátis"}</Link><ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></article>)}</div>
        </div>
      </section>

      <section className="def-section def-section--alt">
        <div className="def-container">
          <h2 className="def-title-center">Quem já usa o NODERE</h2>
          <div className="def-testimonials">{TESTIMONIALS.map((item) => <article key={item.name}><div>★★★★★</div><p>"{item.text}"</p><footer><span>{item.avatar}</span><b>{item.name}</b><small>{item.role} · {item.company}</small></footer></article>)}</div>
        </div>
      </section>

      <section className="def-section">
        <div className="def-container">
          <div className="def-heading def-heading--row"><div><span>Blog & Conteúdo</span><h2>Aprenda a vender mais com inteligência comercial</h2></div><Link href="/blog">Ver todos os artigos →</Link></div>
          <div className="def-blog">{BLOG_POSTS.map((post) => <Link href={`/blog/${slugify(post.title)}`} key={post.title}><i style={{ background: post.color }} /><span style={{ color: post.color, borderColor: `${post.color}55` }}>{post.tag}</span><h3>{post.title}</h3><footer><small>⏱ {post.read} de leitura</small><small>{post.date}</small></footer></Link>)}</div>
        </div>
      </section>

      <section className="def-cta"><h2>Pronto para encontrar<br />seus próximos clientes?</h2><p>14 dias grátis. Sem cartão. Sem compromisso.</p><Link href="/register">Criar conta grátis →</Link></section>
    </>
  );
}
