const testimonials = [
  { name: "Felipe Martins", role: "Diretor comercial · Agência digital", text: "Em 3 dias prospectei 180 empresas no meu segmento com diagnóstico automático. Nunca fui tão assertivo na abordagem." },
  { name: "Camila Souza", role: "Fundadora · Consultoria de marketing", text: "O diagnóstico de presença digital virou meu principal argumento de venda. O cliente vê o score e já entende o problema." },
  { name: "Roberto Alves", role: "Gerente de vendas · Agência B2B", text: "Minha equipe parou de usar 4 ferramentas diferentes. Tudo num único lugar, do lead até a proposta." }
];

export default function TestimonialsSection() {
  return (
    <section className="site-section">
      <div className="site-container">
        <h2 className="site-title site-title--center">Quem já usa o NODERE</h2>
        <div className="site-card-grid site-card-grid--3">
          {testimonials.map((item) => (
            <article className="site-testimonial" key={item.name}>
              <div aria-label="5 estrelas">★★★★★</div>
              <p>“{item.text}”</p>
              <strong>{item.name}</strong>
              <small>{item.role}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
