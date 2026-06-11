import { SOLUTIONS } from "./solutions";

export default function SolutionsSection() {
  return (
    <section className="site-section site-section--alt" id="solucoes">
      <div className="site-container">
        <p className="site-eyebrow">Soluções</p>
        <h2 className="site-title">8 conjuntos para operar receita com inteligência.</h2>
        <div className="site-card-grid site-card-grid--4">
          {SOLUTIONS.map((solution) => {
            const Icon = solution.icon;
            return (
              <article className="site-solution-card" id={solution.href.split("#")[1]} key={solution.code}>
                <span><Icon size={22} /></span>
                <small>{solution.code}</small>
                <h3>{solution.name}</h3>
                <p>{solution.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
