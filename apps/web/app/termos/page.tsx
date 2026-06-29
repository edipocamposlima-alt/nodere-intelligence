import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan">NODERE</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Termos de Uso</h1>
        <p className="mt-2 text-sm text-slate-400">Condições gerais para uso da plataforma NODERE Intelligence.</p>
      </div>

      <section className="space-y-4 rounded-lg border border-line bg-panel/90 p-6 text-sm leading-7 text-slate-300">
        <p>
          Ao utilizar a plataforma, o usuário concorda em fornecer informações verdadeiras, manter suas credenciais em sigilo
          e utilizar os recursos apenas para finalidades comerciais legítimas.
        </p>
        <p>
          O acesso a módulos, relatórios, integrações e automações pode depender do plano contratado, das permissões do
          usuário e da disponibilidade dos serviços de terceiros integrados.
        </p>
        <p>
          A NODERE pode registrar eventos operacionais e auditorias para segurança, suporte, melhoria da plataforma e
          conformidade com os fluxos contratados.
        </p>
        <p>
          O uso indevido da plataforma, incluindo tentativa de acesso não autorizado, extração abusiva de dados ou violação
          de políticas de terceiros, pode resultar em suspensão de acesso.
        </p>
      </section>

      <Link href="/app/register" className="inline-flex text-sm font-semibold text-cyan hover:text-white">
        Voltar ao cadastro
      </Link>
    </div>
  );
}
