import type { Metadata } from "next";
import SitePageShell from "@/components/site/SitePageShell";

export const metadata: Metadata = {
  title: "Blog | NODERE Nexus",
  description: "Conteúdos sobre prospecção, CRM, Google Maps e inteligência comercial."
};

const posts = [
  "Como priorizar empresas com maior potencial de compra",
  "Por que diagnóstico digital melhora a abordagem comercial",
  "CRM e IA: como reduzir tarefas repetitivas sem perder contexto"
];

export default function BlogPage() {
  return (
    <SitePageShell>
      <section className="site-simple-hero">
        <div className="site-container">
          <p className="site-eyebrow">Blog</p>
          <h1>Ideias práticas para operar um comercial mais inteligente.</h1>
          <p>Conteúdos editoriais do NODERE Nexus para times que vendem para empresas locais e regionais.</p>
        </div>
      </section>
      <section className="site-section">
        <div className="site-container site-card-grid">
          {posts.map((post) => (
            <article className="site-info-card" key={post}>
              <p className="site-eyebrow">Artigo</p>
              <h2>{post}</h2>
              <p>Publicação em preparação. Fale com a equipe para receber os materiais estratégicos atuais.</p>
            </article>
          ))}
        </div>
      </section>
    </SitePageShell>
  );
}
