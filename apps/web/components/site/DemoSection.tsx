export default function DemoSection() {
  return (
    <section className="site-section">
      <div className="site-container site-demo">
        <div>
          <p className="site-eyebrow">Operação conectada</p>
          <h2 className="site-title">Cada lead nasce com contexto, diagnóstico e próximo passo.</h2>
          <p className="site-copy">A ficha 360º reúne dados da empresa, sinais digitais, histórico CRM, tarefas, documentos e sugestões de IA para que o operador nunca comece uma abordagem do zero.</p>
        </div>
        <div className="site-demo__panel">
          <div className="site-demo__header"><span>Lead 360º</span><strong>Score 82</strong></div>
          {["Site ausente ou fraco", "Baixa frequência de avaliações", "Sem campanhas ativas", "Proposta pronta para revisão"].map((item) => (
            <div className="site-demo__line" key={item}>{item}<span /></div>
          ))}
        </div>
      </div>
    </section>
  );
}
