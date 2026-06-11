const segments = ["Agências digitais", "Consultorias B2B", "Franquias", "Times SDR", "Prestadores locais"];

export default function LogosSection() {
  return (
    <section className="site-logos">
      <div className="site-container">
        <p>Construído para operações comerciais que vendem serviços recorrentes</p>
        <div>{segments.map((item) => <span key={item}>{item}</span>)}</div>
      </div>
    </section>
  );
}
