import Link from "next/link";

const columns = [
  { title: "Produto", links: [{ label: "Soluções", href: "/solucoes" }, { label: "Preços", href: "/precos" }, { label: "Blog", href: "/blog" }] },
  { title: "Empresa", links: [{ label: "Contato", href: "/contato" }, { label: "Termos de uso", href: "/termos" }, { label: "Privacidade", href: "/privacidade" }] },
  { title: "Contato", links: [{ label: "comercial@nodere.com.br", href: "mailto:comercial@nodere.com.br" }] }
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="site-footer__grid">
          <div>
            <div className="site-footer__brand">NODERE</div>
            <p>Plataforma comercial. A plataforma que conecta inteligência comercial, prospecção e vendas em um único fluxo.</p>
            <div className="site-footer__social">
              <a href="https://linkedin.com/company/nodere" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://instagram.com/nodere" target="_blank" rel="noopener noreferrer">Instagram</a>
            </div>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h3>{column.title}</h3>
              {column.links.map((link) => (
                <Link key={link.href} href={link.href}>{link.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="site-footer__bottom">
          <span>© 2026 NODERE. Todos os direitos reservados.</span>
          <span>Plataforma comercial · nodere.com.br</span>
        </div>
      </div>
    </footer>
  );
}
