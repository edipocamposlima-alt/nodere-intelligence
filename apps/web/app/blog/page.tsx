import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/site/SitePageShell";

export const metadata: Metadata = {
  title: "Blog | NODERE Nexus",
  description: "Artigos práticos sobre prospecção, CRM, IA comercial e revenue intelligence."
};

const ALL_POSTS = [
  { tag: "Discovery", color: "#F59E0B", slug: "prospeccao-200-empresas-score-digital", title: "Como prospectar 200 empresas por semana com score digital automatizado", desc: "Aprenda a usar o conjunto Discovery do NODERE Nexus para encontrar empresas com baixa presença digital e alto potencial comercial.", read: "5 min", date: "Jun 2026" },
  { tag: "CRM", color: "#1E6FDB", slug: "pipeline-inteligente-leads", title: "Pipeline inteligente: como parar de perder leads no funil de vendas", desc: "Configure estágios personalizados, alertas de estagnação e automações que movem seus leads no funil sem intervenção manual.", read: "4 min", date: "Jun 2026" },
  { tag: "AI Nexus", color: "#00D4FF", slug: "copiloto-ia-scripts-abordagem", title: "Copiloto comercial: como a IA gera scripts de abordagem em segundos", desc: "O AI Nexus usa o contexto real do lead para criar mensagens de WhatsApp e e-mails personalizados com um clique.", read: "6 min", date: "Mai 2026" },
  { tag: "Engage", color: "#10B981", slug: "whatsapp-b2b-sem-spam", title: "WhatsApp B2B: como escalar prospecção sem virar spam", desc: "Estratégias de disparos em massa responsáveis, templates que convertem e como usar o inbox do NODERE para gestão de conversas.", read: "5 min", date: "Mai 2026" },
  { tag: "Analytics", color: "#EC4899", slug: "forecast-receita-85-precisao", title: "Forecast de receita: como prever seu faturamento com precisão", desc: "Configure probabilidades por estágio do funil e veja o NODERE calcular automaticamente sua receita prevista.", read: "4 min", date: "Abr 2026" },
  { tag: "Intelligence", color: "#8B5CF6", slug: "enriquecimento-apollo-receita-federal", title: "Enriquecimento de dados: Apollo + Receita Federal na mesma tela", desc: "Como o conjunto Intelligence combina múltiplas fontes para entregar faturamento, sócios, CNPJ e contatos decisores automaticamente.", read: "3 min", date: "Abr 2026" }
];

export default function BlogPage() {
  return (
    <SitePageShell>
      <section className="blog-page">
        <div className="def-container">
          <div className="blog-page__head">
            <span>Blog & Conteúdo</span>
            <h1>Aprenda a vender mais<br />com inteligência comercial</h1>
            <p>Artigos práticos sobre prospecção, CRM, IA comercial e estratégias de revenue intelligence.</p>
          </div>
          <div className="blog-page__grid">
            {ALL_POSTS.map((post) => (
              <Link href={`/blog/${post.slug}`} style={{ "--post-color": post.color } as React.CSSProperties} key={post.slug}>
                <i />
                <article>
                  <span>{post.tag}</span>
                  <h2>{post.title}</h2>
                  <p>{post.desc}</p>
                  <footer><small>⏱ {post.read}</small><small>{post.date}</small></footer>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
