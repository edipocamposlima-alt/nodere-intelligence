"use client";

export default function CompanyError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <section className="rounded-lg border border-danger/30 bg-danger/10 p-6">
        <h2 className="text-xl font-semibold text-white">Não foi possível renderizar a Ficha 360º</h2>
        <p className="mt-2 text-sm leading-6 text-red-100">
          A ficha encontrou um dado inesperado, mas a aplicação continuou estável. Tente carregar novamente ou volte para o CRM.
        </p>
        <div className="mt-4 rounded-md border border-danger/20 bg-ink px-3 py-2 text-xs text-red-100">
          <p>Detalhe: {error.message || "Erro inesperado no componente da ficha."}</p>
          {error.digest && <p>Digest: {error.digest}</p>}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={reset} className="rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white">
            Tentar novamente
          </button>
          <a href="/crm" className="rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-white">
            Abrir CRM
          </a>
        </div>
      </section>
    </div>
  );
}
