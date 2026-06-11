import { CheckCircle2, Search, Sparkles } from "lucide-react";

const steps = [
  { n: "1", icon: Search, title: "Busque empresas por segmento e cidade", text: "Use Google Maps, filtros comerciais e sinais digitais para montar listas com intenção real." },
  { n: "2", icon: Sparkles, title: "Receba diagnóstico automático", text: "O Nexus identifica baixa presença digital, ausência de mídia, reputação e oportunidades de abordagem." },
  { n: "3", icon: CheckCircle2, title: "Ative CRM, IA e proposta", text: "Organize o funil, gere mensagens e acompanhe a evolução até fechamento." }
];

export default function HowItWorksSection() {
  return (
    <section className="site-section">
      <div className="site-container">
        <p className="site-eyebrow">Como funciona</p>
        <h2 className="site-title">Do mapa ao contrato em um fluxo inteligente.</h2>
        <div className="site-card-grid site-card-grid--3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article className="site-card" key={step.n}>
                <div className="site-step"><span>{step.n}</span><Icon size={20} /></div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
