# Relatorio - Ficha CRM em Tela Completa

Data: 2026-06-30

## Rota criada/ajustada

- Criada rota privada: `/app/crm/clientes/[id]`.
- A rota aceita query param `tab`, por exemplo:
  - `/app/crm/clientes/[id]?tab=historico`
  - `/app/crm/clientes/[id]?tab=propostas`
  - `/app/crm/clientes/[id]?tab=whatsapp`
- A rota tambem aceita `return=/crm` para voltar ao CRM.

## Arquivos alterados

- `apps/web/app/crm/CrmSwitcher.tsx`
- `apps/web/app/app/crm/clientes/[id]/page.tsx`
- `apps/web/app/app/crm/clientes/[id]/CrmClientFullPage.tsx`
- `RELATORIO_FICHA_CRM_TELA_COMPLETA.md`

## Componentes reutilizados

- `ScoreBadge`
- `getCompany`
- `getLeadActivities`
- `getLeadContacts`
- `getLeadDeals`
- `getCatalogItems`
- `getProposals`
- `getInboxMessagesByCompany`
- `getCalendarEvents`
- Tipos `Company`, `CatalogItem`, `NodereProposal`, `InboxMessage`, `CalendarEvent`

## Componentes novos

- `CrmClientFullPage`
  - tela operacional completa da ficha comercial quando acessada pelo CRM;
  - cabecalho fixo;
  - menu lateral de atalhos;
  - area central dinamica;
  - resumo comercial lateral.

## Como os atalhos funcionam

- A aba ativa e definida pelo query param `tab`.
- Ao trocar de atalho, a URL e atualizada com `router.replace`, sem perder o cliente aberto.
- Atualizar a pagina preserva a aba selecionada.
- O botao "Copiar link" copia a URL completa da ficha, incluindo a aba.

Atalhos implementados:

- Visao Geral
- Historico
- Contatos
- Negociacoes
- Produtos/Servicos
- Propostas e Contratos
- WhatsApp
- E-mail
- Agenda
- IA / Editor
- Apollo/Econodata
- Arquivos/Anexos

## Como os dados sao carregados

- Dados principais do cliente sao carregados no servidor por `getCompany`.
- Dados das secoes sao carregados no cliente conforme a aba acessada.
- Cada secao fica em cache no estado local apos o primeiro carregamento.
- Trocar de aba nao refaz chamada para uma secao ja carregada.

## Permissoes aplicadas

- A tela consulta `/api/auth/me` para identificar o papel do usuario.
- `owner`, `admin` e `operator` podem acessar atalhos de acao operacional.
- `viewer` fica com botoes de mutacao desabilitados.
- A validacao final de permissao continua dependendo do backend nas rotas existentes.

## Comportamento no CRM

- O clique em lead no Kanban/Listagem do CRM agora navega para `/app/crm/clientes/[id]?tab=overview&return=/crm`.
- O drawer antigo foi preservado para criacao de novo lead e para outras areas que ainda dependam dele.
- A ficha acessada pelo CRM deixa de abrir como modal pequeno.

## Responsividade

- Desktop: layout em tres colunas, com atalhos a esquerda, conteudo central e resumo comercial a direita.
- Mobile/tablet: laterais viram blocos empilhados; atalhos aparecem em grid compacto com rolagem natural.
- Rolagem vertical fica isolada nas colunas laterais em telas grandes.

## Testes executados

Executado:

- `apps/api`: `npm run build` - aprovado.
- `apps/api`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run build` - aprovado; rota `/app/crm/clientes/[id]` incluida no build.
- `apps/web`: `npm run typecheck` - aprovado.
- raiz: `npm run build` - aprovado.

## Pendencias encontradas

- As abas E-mail e Arquivos/Anexos exibem estado vazio controlado porque nao ha endpoint dedicado identificado para esses dados na ficha CRM atual.
- Exportar PDF da ficha usa `window.print()` nesta etapa. PDFs comerciais de proposta/contrato continuam nos endpoints proprios de propostas.
- O retorno ao CRM aponta para `/crm`; preservacao completa de filtros pode ser ampliada depois com leitura de query params no `CrmSwitcher`.

## Status final

Aprovado em validacao tecnica local.

Nao foi feito commit, push ou deploy nesta etapa.
