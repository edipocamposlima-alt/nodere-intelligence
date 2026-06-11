const LOGOS = [
  { name: "Google Maps", icon: "🗺️" },
  { name: "Google Business", icon: "⭐" },
  { name: "Apollo.io", icon: "🚀" },
  { name: "OpenAI GPT-4", icon: "🤖" },
  { name: "WhatsApp Business", icon: "💬" },
  { name: "Receita Federal", icon: "🏛️" },
  { name: "Stripe", icon: "💳" },
  { name: "Supabase", icon: "🗄️" }
];

export default function LogosSection() {
  return (
    <section className="site-logos site-logos--animated">
      <div className="site-container">
        <p>Conectado às melhores fontes de dados e infraestrutura</p>
        <div>
          {LOGOS.map((logo, index) => (
            <span style={{ animationDelay: `${index * 0.06}s` }} key={logo.name}>
              <b>{logo.icon}</b>
              {logo.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
