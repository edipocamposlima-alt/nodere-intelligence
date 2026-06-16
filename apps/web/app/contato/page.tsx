import type { Metadata } from "next";
import ContactForm from "@/components/site/ContactForm";
import SitePageShell from "@/components/site/SitePageShell";

export const metadata: Metadata = {
  title: "Contato | NODERI Nexus",
  description: "Fale com a equipe NODERI Nexus."
};

export default function ContactPage() {
  return (
    <SitePageShell>
      <section className="site-simple-hero">
        <div className="site-container">
          <p className="site-eyebrow">Contato</p>
          <h1>Converse com a equipe NODERI Nexus.</h1>
          <p>Para falar com vendas, suporte ou parcerias, use um dos canais oficiais abaixo.</p>
        </div>
      </section>
      <section className="site-section">
        <div className="site-container site-contact-grid">
          <article className="site-info-card site-contact-card--form">
            <p className="site-eyebrow">Mensagem</p>
            <h2>Envie os dados do seu projeto</h2>
            <p>O formulario envia sua mensagem diretamente para o comercial da NODERI Nexus.</p>
            <ContactForm />
          </article>
          <article className="site-info-card">
            <p className="site-eyebrow">E-mail</p>
            <h2>comercial@nodere.com.br</h2>
            <p>Envie sua mensagem com o nome da empresa, cidade, telefone e objetivo comercial.</p>
            <a className="site-primary" href="mailto:comercial@nodere.com.br?subject=Contato pelo site NODERI Nexus">Enviar e-mail</a>
          </article>
          <article className="site-info-card">
            <p className="site-eyebrow">WhatsApp</p>
            <h2>Atendimento comercial</h2>
            <p>O botão fixo de WhatsApp usa o número configurado em ambiente para contato direto.</p>
            <a className="site-secondary-button" href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5500000000000"}`} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>
          </article>
        </div>
      </section>
    </SitePageShell>
  );
}
