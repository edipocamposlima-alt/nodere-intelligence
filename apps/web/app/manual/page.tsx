import { BookOpen, CheckCircle2 } from "lucide-react";

const sections = [
  ["Visão geral", "Use o NODERE para buscar empresas reais, salvar leads, acompanhar CRM, registrar observações, gerar mensagens e organizar propostas."],
  ["Instalar como app", "No Android/Chrome use Instalar app. No iPhone/Safari use Compartilhar e Adicionar à Tela de Início."],
  ["Busca de empresas", "Pesquise por nome, segmento, cidade, estado ou palavra-chave. Salve o lead e abra a ficha para continuar a operação."],
  ["Seleção em massa", "Na busca, selecione empresas, salve várias no CRM, ignore resultados, exporte CSV ou baixe relatório PDF."],
  ["CRM", "Arraste leads entre etapas do funil. Cada mudança é salva no backend e aparece no dashboard."],
  ["Ficha do cliente", "Registre observações, tarefas, IA, propostas, contratos, templates WhatsApp e documentos vinculados ao lead."],
  ["WhatsApp", "wa.me abre a conversa. Sem WhatsApp Cloud API, respostas devem ser registradas manualmente na Caixa de Entrada."],
  ["Configurações", "Ajuste tema, cor, fonte, densidade e backend. Secrets ficam somente no Render/backend."],
  ["IA e PageSpeed", "OpenAI exige crédito ativo. PageSpeed exige GOOGLE_PAGESPEED_API_KEY no Render."],
  ["Erros comuns", "Unauthorized indica rota/token. insufficient_quota indica crédito OpenAI. not_configured indica variável ausente."]
];

export default function ManualPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <section className="rounded-lg border border-line bg-panel/90 p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-cyan" />
          <div>
            <h2 className="text-2xl font-semibold text-white">Ajuda / Manual NODERE</h2>
            <p className="mt-1 text-sm text-slate-400">Guia rápido para operar prospecção, CRM, WhatsApp, IA e documentos.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {sections.map(([title, body]) => (
          <article key={title} className="rounded-lg border border-line bg-panel/90 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-line bg-panel/90 p-5">
        <h3 className="font-semibold text-white">Manual completo</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          O arquivo completo está no repositório em <code className="rounded bg-ink px-1.5 py-0.5 text-cyan">docs/manual-nodere.md</code>.
        </p>
      </section>
    </div>
  );
}
