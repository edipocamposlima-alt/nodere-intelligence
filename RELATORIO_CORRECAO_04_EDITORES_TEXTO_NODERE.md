# RELATORIO_CORRECAO_04_EDITORES_TEXTO_NODERE

Data: 03/07/2026

## Objetivo

Corrigir e padronizar os campos de criacao, edicao, exibicao e exportacao de texto da plataforma NODERE, com foco em editores ricos, observacoes comerciais, propostas/contratos, marketing, CMS, CRM, agenda, inbox e PDFs.

## Causa raiz

- A plataforma ja possuia um componente central (`RichTextEditor`), mas alguns campos comerciais ainda usavam `textarea` simples.
- O editor rico nao tinha modo readonly/desabilitado padronizado para viewer ou estados sem permissao.
- O input oculto de upload de imagem do editor usava classe `sr-only`; combinado com regras globais de input, ele podia participar do layout e gerar overflow horizontal em mobile.
- A API de PDF de propostas escrevia `customer_notes` diretamente no PDF; quando o conteudo vinha como HTML rico, havia risco de tags aparecerem no documento.

## RETRABALHO - VALIDACAO ANTERIOR REPROVADA

A validacao anterior foi reprovada porque Observacoes e Marketing ainda exibiam a toolbar visualmente quebrada em telas reais. A causa raiz adicional encontrada neste retrabalho foi uma colisao entre o editor e regras globais de layout/densidade declaradas depois do CSS do editor.

Regras globais aplicadas a `.nodere-app-content button`, `select`, `textarea` e controles de formulario sobrescreviam padding, altura, largura e tipografia dos botoes e selects da toolbar. Como a barra antiga era plana, sem grupos visuais estaveis, esses overrides deixavam botoes desalinhados, controles cortados e quebras irregulares, principalmente em Marketing, Observacoes e mobile.

Correcao definitiva aplicada:

- Toolbar reorganizada em grupos semanticos: fonte/tamanho, estilos, alinhamento, listas, cores/espacamento, midia/link e historico/limpar.
- Botoes da toolbar travados em 34x34 px, com SVG de 16 px e sem herdar padding global.
- Selects da toolbar travados em 34 px de altura, largura minima responsiva e tokens de tema.
- Grupos da toolbar com wrap controlado, borda e fundo semanticos.
- Mobile ate 640 px: cada grupo ocupa largura total do editor, sem overflow horizontal.
- Editor, preview e ProseMirror com `max-width: 100%`, quebra de palavra e overflow vertical seguro.
- Tema claro/escuro reforcado com tokens semanticos, sem depender de cores fixas dentro da toolbar.

## Arquivos alterados

- `apps/web/components/RichTextEditor.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/app/proposals/page.tsx`
- `apps/web/app/companies/[id]/LeadOperations.tsx`
- `apps/web/app/marketing/MarketingClient.tsx`
- `apps/api/src/routes/proposals.ts`
- `RELATORIO_CORRECAO_04_EDITORES_TEXTO_NODERE.md`

## O que foi implementado

- `RichTextEditor` passou a aceitar `disabled`.
- Toolbar respeita estado readonly/desabilitado.
- Comandos de fonte, tamanho, negrito, italico, sublinhado, tachado, alinhamento, listas, cor, destaque, link, imagem, limpar formatacao, desfazer e refazer permanecem centralizados no mesmo componente.
- Input oculto de imagem trocado de `sr-only` para `hidden`, removendo overflow mobile.
- CSS global reforcado para:
  - toolbar quebrar linha sem cortar botoes;
  - editor, preview, inputs, selects e textareas respeitarem `max-width: 100%`;
  - textareas remanescentes nao gerarem overflow global;
  - modo readonly manter contraste em tema claro/escuro.
- Observacoes comerciais e internas da tela global de propostas passaram a usar `RichTextEditor`.
- Observacoes comerciais e internas da Ficha 360 / Propostas e Contratos passaram a usar `RichTextEditor` com `disabled={!canEdit}`.
- Notas de campanha em Marketing passaram a usar `RichTextEditor`.
- PDF de propostas/contratos passou a limpar HTML antes de renderizar texto, preservando conteudo sem expor tags.

## Campos revisados

- Observacoes da Ficha Comercial.
- Historico/atividades CRM.
- Agenda/calendario.
- Contatos.
- Negociacoes.
- IA / Editor.
- Propostas e contratos.
- WhatsApp/templates.
- Marketing/posts/campanhas/templates.
- Inbox.
- Catalogo.
- Admin/CMS.
- Blog.
- Paginas institucionais.
- Textareas tecnicos remanescentes: CSV, URLs, SEO e modulos de plano mantidos como texto puro, com CSS responsivo.

## Permissoes

- Owner/admin/operator continuam com edicao conforme regras existentes.
- Viewer ou estados sem edicao usam `disabled` no editor central, mantendo visualizacao sem permitir comandos.
- Nenhuma API de permissao foi alterada.

## PDF e exportacao

- PDF Ficha Cliente ja estava protegido contra HTML bruto.
- PDF Proposta e Contrato agora usam `cleanPdfText` em conteudos ricos de observacoes e itens.
- Observacoes internas continuam fora do PDF comercial.

## Testes executados

- `apps/web npm run lint` - aprovado.
- `apps/web npm run typecheck` - aprovado.
- `apps/web npm run build` - aprovado.
- `apps/api npm run typecheck` - aprovado.
- `apps/api npm run build` - aprovado.
- `npm run build` - aprovado.
- `git diff --check` - aprovado, apenas avisos LF/CRLF do Windows.

## Homologacao visual local

Ambiente:

- Frontend buildado em `http://localhost:3112`.
- Sessao local autenticada/cacheada quando disponivel.
- Navegador Chrome temporario via CDP.

Rotas validadas:

- `/app/proposals`
- `/marketing`
- `/marketing` > Criar post
- `/marketing` > Templates
- `/calendar`
- `/inbox`
- `/catalog`
- `/admin/content`
- `/companies/{id}`
- `/companies` > Nova empresa manual

Resultados:

- Desktop 1536px em tema claro: aprovado.
- Desktop 1536px em tema escuro: aprovado.
- Mobile 375x812 em tema claro: aprovado.
- `/marketing` > Criar post: 2 editores ricos, 7 grupos por editor, 16 botoes por editor, 3 selects por editor, botoes 34x34, sem overflow horizontal.
- `/marketing` > Templates: 1 editor rico, 7 grupos, 16 botoes, 3 selects, botoes 34x34, sem overflow horizontal e sem HTML cru visivel.
- `/app/proposals`: 2 editores ricos, 7 grupos por editor, 16 botoes por editor, 3 selects por editor, botoes 34x34, sem overflow horizontal.
- `/inbox` > Registrar interacao: 1 editor rico, 7 grupos, 16 botoes, 3 selects, botoes 34x34, sem overflow horizontal.
- `/companies` > Nova empresa manual: 1 editor rico em Observacoes, 7 grupos, 16 botoes, 3 selects, botoes 34x34, sem overflow horizontal.
- `/calendar`: rota carregada sem overflow; criacao de evento indisponivel nesta sessao local por estado somente leitura.
- Previews inspecionados sem tags HTML cruas visiveis.

## Validacao de areas solicitadas

- Observacoes: validado visualmente em formulario manual de empresa e por uso do mesmo editor em `LeadOperations`.
- Historico: validado por codigo em `LeadOperations` e `LeadDrawer`; usa o editor global corrigido.
- Agenda: validado por codigo em `CalendarClient`; rota carregada sem overflow, formulario de edicao nao ficou disponivel na sessao local.
- Contatos: validado por codigo em `LeadOperations` e `LeadDrawer`; usa o editor global corrigido.
- Negociacoes: validado por codigo em `LeadOperations` e `LeadDrawer`; usa o editor global corrigido.
- Propostas e contratos: validado visualmente em `/app/proposals`.
- WhatsApp/templates: validado visualmente em Marketing > Templates; WhatsApp na Ficha 360 usa o mesmo editor global.
- Marketing/Criar post/Campanhas/Templates: validado visualmente em `/marketing`.
- Manual/Admin/CMS/Blog/paginas institucionais: validados por codigo; usam `RichTextEditor`/`RichTextPreview` centralizados.
- E-mails/Relatorios com notas: validados por codigo quando utilizam campos ricos; textareas tecnicos permanecem texto puro por desenho.

## Homologacao PDF

- `GET /api/proposals`: `200`, 13 propostas encontradas.
- `POST /api/proposals/{id}/pdf`: `200 application/pdf`, arquivo `%PDF`, sem padroes de HTML bruto.
- `POST /api/proposals/{id}/contract-pdf`: `200 application/pdf`, arquivo `%PDF`, sem padroes de HTML bruto.

## Pendencias

- Nao foram criados registros reais de observacao/post/template/proposta nesta rodada para evitar poluir producao; a validacao visual foi feita em ambiente local buildado com dados/sessao disponiveis.
- A automacao local nao conseguiu concluir selecao de texto por atalho para inspecionar `<strong>/<em>` via teclado; a toolbar e previews foram validados visualmente/estruturalmente e a persistencia de HTML rico permanece responsabilidade do `RichTextEditor` central e dos endpoints existentes.
- Exportacao PDF completa nao foi reexecutada neste retrabalho; a limpeza de HTML em PDFs permanece documentada da correcao anterior e nao foi alterada agora.
- Campos puramente tecnicos continuam texto puro por desenho: URLs de anexos, CSV, SEO description e lista de modulos de plano.

## Status final

APROVADO TECNICAMENTE PARA A CORRECAO VISUAL DO EDITOR GLOBAL.

Observacao: liberacao funcional ampla depende de repetir a homologacao autenticada completa de criacao/salvamento/PDF em ambiente com usuario owner/admin e dados de teste autorizados.
