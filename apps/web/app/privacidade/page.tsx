import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan">NODERE</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-slate-400">Como tratamos dados operacionais dentro da plataforma NODERE Intelligence.</p>
      </div>

      <section className="space-y-4 rounded-lg border border-line bg-panel/90 p-6 text-sm leading-7 text-slate-300">
        <p>
          Coletamos e processamos dados necessários para autenticação, gestão de usuários, CRM, descoberta de oportunidades,
          relatórios, propostas comerciais, auditoria e integrações configuradas pelo próprio workspace.
        </p>
        <p>
          Dados de integrações como Google, WhatsApp, OpenAI, Stripe e Supabase são utilizados apenas para executar os
          recursos contratados e respeitam as permissões e credenciais configuradas no ambiente.
        </p>
        <p>
          Informações comerciais sensíveis, credenciais e chaves de serviço devem permanecer em ambientes seguros de
          configuração e não devem ser compartilhadas em campos públicos da aplicação.
        </p>
        <p>
          O usuário pode solicitar revisão, correção ou remoção de dados conforme as regras contratuais, legais e técnicas
          aplicáveis ao seu workspace.
        </p>
      </section>

      <Link href="/app/register" className="inline-flex text-sm font-semibold text-cyan hover:text-white">
        Voltar ao cadastro
      </Link>
    </div>
  );
}
