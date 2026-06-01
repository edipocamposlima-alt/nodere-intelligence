import { BookOpen, CheckCircle2, Download, ExternalLink } from "lucide-react";

const sections = [
  ["1. Visão geral", "O NODERE centraliza busca de empresas reais, CRM, funil comercial, agenda, WhatsApp via web, IA, relatórios, propostas, contratos e status de integrações. O fluxo principal é: buscar empresa, salvar lead, abrir ficha, registrar histórico, agendar follow-up, mover no funil e gerar material comercial."],
  ["2. Dashboard", "Mostra indicadores reais vindos do backend: empresas encontradas, baixa avaliação, sem site, sem Google Ads, sem WhatsApp, sem descrição, sem fotos recentes, leads quentes, score médio e atalhos para busca e CRM."],
  ["3. Busca de empresas", "Use a aba Busca de empresas para pesquisar por nome, segmento, cidade, estado e palavra-chave. A busca passa pelo backend seguro, usa Google Places, tenta lotes ampliados e deduplica por Place ID. Empresas salvas deixam de aparecer na lista local."],
  ["4. Ações em massa", "Na tabela de busca você pode selecionar resultados, salvar selecionadas no CRM, ignorar resultados, exportar CSV e gerar relatório PDF NODERE com cabeçalho visual."],
  ["5. CRM e funil", "O CRM usa drag and drop. Você pode criar novas etapas do funil, remover etapas vazias e mover leads. Etapas com leads não podem ser removidas para evitar perda operacional."],
  ["6. Ficha do cliente", "A ficha reúne dados, score, telefone, site, Google Maps, observações, agenda, IA/editor, documentos, WhatsApp, auditoria digital e inteligência Google quando configurada."],
  ["7. Observações e histórico", "Registre observações por tipo: ligação, WhatsApp, email, reunião, objeção, interno e observação geral. Cada nota fica vinculada ao lead e salva no backend/Supabase quando configurado."],
  ["8. Agenda e notificações", "Crie follow-ups com data/hora, prioridade e canal. O sininho no topo lista tarefas vencidas ou de hoje. O navegador pode pedir permissão para notificação local ao criar um follow-up."],
  ["9. IA / Editor", "Escolha o tipo de geração: resumo, WhatsApp, email, proposta, contrato simples, diagnóstico ou objeções. A IA usa OpenAI via backend. Se a OpenAI estiver sem crédito, o sistema mostra erro real e não inventa resposta."],
  ["10. Propostas, contratos e PDFs", "Gere ou escreva textos no editor, revise manualmente e salve como proposta ou contrato PDF. O PDF baixado contém identidade visual NODERE e fica salvo na ficha do cliente como documento."],
  ["11. WhatsApp", "O botão WhatsApp abre wa.me com mensagem pronta. Sem WhatsApp Cloud API, o retorno precisa ser registrado manualmente na Caixa de entrada ou nas observações do cliente."],
  ["12. Enriquecimento CNPJ e decisores", "Na ficha do lead, use a aba Apollo/Econodata para consultar dados externos. Apollo exige APOLLO_API_KEY e plano/API com acesso a people search/enrichment. Econodata exige ECONODATA_API_KEY e ECONODATA_API_URL oficial do contrato. LinkedIn pode vir do site do cliente, Apollo ou Econodata. Quando não houver dado confiável, o sistema mostra 'não localizado' para não criar informação falsa."],
  ["13. Integrações", "A tela Integrações mostra status real de Google Places, Maps, PageSpeed, OpenAI, Supabase, WhatsApp, Econodata e Apollo. Chaves ficam no backend/Render ou no modo Admin; nunca no frontend público."],
  ["14. Tema, fonte e layout", "Em Configurações você altera tema, cor principal, modo claro/escuro, fonte, densidade e visual. A preferência é aplicada globalmente e salva neste navegador."],
  ["15. App no celular", "O menu inferior é rolável para mostrar as funções principais: Início, Busca, Empresas, CRM, Agenda, IA, Inbox, Relatórios, Integrações, Configurações, Manual e Admin."],
  ["16. Erros comuns", "insufficient_quota indica falta de crédito OpenAI. not_configured indica variável ausente no Render. 401 indica rota protegida ou token. API_INACCESSIBLE no Apollo indica plano sem API habilitada. Busca vazia pode indicar limite da API, restrição de chave ou termo muito específico."]
];

export default function ManualPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <section className="rounded-lg border border-line bg-panel/90 p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-cyan" />
          <div>
            <h2 className="text-2xl font-semibold text-white">Ajuda / Manual NODERE</h2>
            <p className="mt-1 text-sm text-slate-400">Guia completo para operar prospecção, CRM, WhatsApp, IA, funil, documentos, integrações e app mobile.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="/manual" className="inline-flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white">
            <ExternalLink className="h-4 w-4" />
            Manual online funcionando
          </a>
          <a href="/manifest.json" target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink px-4 py-2 text-sm text-white">
            <Download className="h-4 w-4" />
            Ver PWA
          </a>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
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
        <h3 className="font-semibold text-white">Checklist operacional diário</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          1. Abra Busca de empresas. 2. Pesquise um segmento/cidade. 3. Salve leads bons no CRM. 4. Abra a ficha. 5. Crie uma observação. 6. Agende follow-up. 7. Gere mensagem WhatsApp ou proposta. 8. Mova o lead no funil. 9. Confira o sininho e relatórios.
        </p>
      </section>
    </div>
  );
}
