const STEPS = [
  {
    n: "01", icon: "🔍", color: "#F59E0B",
    title: "Encontre com precisão",
    desc: "Busque por segmento, cidade ou raio. Análise automática de Google Maps, site, redes sociais e avaliações para cada empresa.",
    stat: "127 empresas analisadas/dia"
  },
  {
    n: "02", icon: "🧠", color: "#7C3AED",
    title: "Analise e priorize",
    desc: "Score digital 0-100 por empresa. IA identifica dores, sugere o produto certo e estima propensão de compra em segundos.",
    stat: "Score gerado em < 3s"
  },
  {
    n: "03", icon: "💬", color: "#16A34A",
    title: "Aborde e feche",
    desc: "CRM integrado, scripts gerados por IA, WhatsApp e e-mail na mesma tela. Do primeiro contato ao PDF da proposta assinada.",
    stat: "Taxa de conversão 3x maior"
  }
];

export default function HowItWorksSection() {
  return (
    <section className="site-section site-how" id="como-funciona">
      <div className="site-how__line" />
      <div className="site-container">
        <div className="site-section__center">
          <div className="badge badge-blue">Fluxo de trabalho</div>
          <h2 className="site-title site-title--center">Do mapa ao contrato <span className="text-gradient">em um fluxo inteligente.</span></h2>
          <p>Chega de alternar entre 5 ferramentas diferentes. Tudo integrado, do primeiro clique ao fechamento.</p>
        </div>
        <div className="steps-grid site-card-grid site-card-grid--3">
          {STEPS.map((step) => (
            <article className="site-how-card card" style={{ "--step-color": step.color } as React.CSSProperties} key={step.n}>
              <div className="site-how-card__number">{step.n}</div>
              <div className="site-how-card__icon">{step.icon}</div>
              <small>Passo {step.n}</small>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              <strong>✦ {step.stat}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
