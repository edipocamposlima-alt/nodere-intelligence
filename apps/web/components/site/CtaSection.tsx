import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="site-cta">
      <div className="site-container">
        <h2>Pronto para encontrar seus próximos clientes?</h2>
        <p>14 dias grátis. Sem cartão. Sem compromisso.</p>
        <Link className="site-primary" href="/register">Criar conta grátis</Link>
        <div>
          {["Sem cartão de crédito", "Cancele quando quiser", "LGPD compliant"].map((item) => (
            <span key={item}><CheckCircle2 size={14} /> {item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
