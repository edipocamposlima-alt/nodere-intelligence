# Relatorio de Responsividade Global Zoom 100 NODERE

Data: 2026-07-02

## Causa raiz

A aplicacao autenticada tinha pontos de largura fixa e grids agressivos que funcionavam melhor com zoom reduzido, mas geravam cortes em zoom 100%. Os principais pontos encontrados foram:

- Shell autenticado sem classe global de contencao de largura.
- Header com titulo, busca, creditos, botao App, usuario, sair e notificacoes na mesma linha em desktop intermediario.
- Sidebar com largura fixa de 18rem em todos os desktops, reduzindo a area util em 1366px.
- Busca de empresas com grids de muitas colunas em `xl`.
- Discovery com formulario em grade fixa.
- CRM/Funil com Kanban horizontal sem limite claro ao container principal.

## Padrao global aplicado

- Criadas classes globais:
  - `nodere-app-shell`
  - `nodere-app-main`
  - `nodere-app-content`
  - `nodere-topbar`
  - `nodere-sidebar`
  - `nodere-kanban-scroll`
- Conteudo autenticado passou a ter `max-width: 100%`, `min-width: 0` e sem `overflow-x: clip` global.
- Header passou a quebrar a busca para uma segunda linha antes de cortar botoes.
- Sidebar ficou compacta em desktops comuns e volta ao tamanho maior apenas em `xl`.
- Kanban passou a ter scroll horizontal proprio, com largura limitada ao conteudo disponivel.
- Grids de filtros foram convertidos para colunas fluidas e responsivas.

## Arquivos alterados

- `apps/web/app/app/layout.tsx`
- `apps/web/components/AppShell.tsx`
- `apps/web/components/Sidebar.tsx`
- `apps/web/components/Header.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/discovery/DiscoverySearch.tsx`
- `apps/web/app/crm/CrmBoard.tsx`
- `apps/web/app/crm/CrmSwitcher.tsx`
- `apps/web/components/SearchPanel.tsx`
- `apps/web/app/companies/[id]/LeadOperations.tsx`
- `apps/web/app/companies/[id]/page.tsx`
- `apps/web/app/app/crm/clientes/[id]/CrmClientFullPage.tsx`
- `apps/web/app/reports/ReportsClient.tsx`
- `scripts/validate-responsive-overflow.mjs`
- `RELATORIO_RESPONSIVIDADE_GLOBAL_ZOOM_100_NODERE.md`

## Telas corrigidas diretamente

- Dashboard e rotas autenticadas via shell global.
- Busca de Empresas / Prospecção.
- Empresas, mantendo layout em cards ja publicado.
- CRM / Funil.
- Discovery.
- Header/topbar.
- Sidebar.

## Funcionalidades preservadas

- Login/logout nao foram alterados.
- Autenticacao e permissoes nao foram alteradas.
- APIs e banco nao foram alterados.
- Menu lateral preservado.
- Busca global preservada.
- Creditos, usuario, preferencias, notificacoes e PWA preservados.
- Busca de empresas preserva filtros e botoes.
- CRM/Funil preserva Kanban, lista, filtros, arrastar lead e abertura de ficha.
- Empresas preserva cards, acoes, CSV, PDF, WhatsApp, site, telefone e ficha.

## Validacoes locais

- `apps/web`: `npm run lint` aprovado.
- `apps/web`: `npm run typecheck` aprovado.
- `apps/web`: `npm run build` aprovado.
- Raiz: `npm run build` aprovado.
- `git diff --check` aprovado, apenas aviso LF/CRLF do Windows.
- Backend/API nao foi alterado.

## Validacao desktop 1366x768

Executada em producao com viewport 1366x768 e sessao autenticada.

Rotas validadas:

- `/dashboard`: sem overflow horizontal; header nao sobrepoe conteudo.
- `/companies`: sem overflow horizontal; 474 cards; 0 tabelas na lista.
- `/crm`: sem overflow horizontal da pagina; Kanban com scroll proprio.
- `/discovery`: sem overflow horizontal; formulario responsivo.
- `/catalog`: sem overflow horizontal da pagina.
- `/app/proposals`: sem overflow horizontal da pagina.
- `/reports`: sem overflow horizontal da pagina.
- `/settings`: sem overflow horizontal da pagina; tabela interna permanece contida.
- `/app/dashboard`: sem overflow horizontal; header nao sobrepoe conteudo.

## Validacao zoom 100

Executada em producao usando viewport real 1366x768 com `deviceScaleFactor: 1`, equivalente a validacao objetiva de zoom 100%.

Resultado:

- `documentElement.scrollWidth <= clientWidth` nas rotas principais.
- `body.scrollWidth <= clientWidth` nas rotas principais.
- Header sticky com `bottom` igual ao topo do conteudo, sem sobreposicao.
- Sidebar presente em desktop e sem invadir area principal.
- CRM/Funil com scroll horizontal limitado ao container Kanban.

## Validacao mobile

Executada em producao com viewport 375x812.

Rotas validadas:

- `/dashboard`: sem overflow horizontal.
- `/companies`: sem overflow horizontal; 474 cards; 0 tabelas na lista.
- `/crm`: sem overflow horizontal da pagina; Kanban com scroll proprio.
- `/discovery`: sem overflow horizontal.

## Validacao tema claro/escuro

As correcoes usam tokens/classes existentes do tema. Nenhum provider ou persistencia de tema foi alterado.

## Deploy

- Commit: `763d6ae`
- Mensagem: `fix: ajustar responsividade global em zoom 100`
- Push: realizado em `main`
- Vercel deployment: `dpl_AwpS9ic7oX4zWU1NzNvHXvf8E3gN`
- URL do deployment: `https://web-rf5xu9po3-edipo-lima-s-projects.vercel.app`
- Alias: `https://nodere.com.br`
- Alias: `https://www.nodere.com.br`
- Status: `READY`
- Render/backend: nao necessario.

## Pendencias

Nao ha pendencia critica restante para responsividade global em zoom 100 nas rotas principais testadas.

## RETESTE APOS REPROVACAO VISUAL

### Por que a validacao anterior falhou

A medicao anterior usou principalmente `documentElement.scrollWidth` e `body.scrollWidth`. Isso nao era suficiente porque a correcao anterior havia aplicado `overflow-x: clip` em wrappers globais (`nodere-grid`, `nodere-app-shell`, `nodere-app-main` e `nodere-app-content`). O `clip` pode esconder a barra horizontal e fazer a medicao parecer aprovada, mesmo quando um componente interno continua cortado visualmente.

### Evidencias reais encontradas

Auditoria estatica do codigo publicado identificou:

- `overflow-x: clip` aplicado em wrappers globais do shell autenticado.
- `max-width: 100vw` dentro de layout com sidebar, que e inadequado porque `100vw` inclui a largura total da janela, nao apenas a area util do main.
- Kanban usando `max-width: calc(100vw - ...)`, acoplado ao viewport em vez do container real.
- Ficha 360 com grids em `lg` usando colunas proporcionais fixas e filhos com `min-w` em cards comerciais.
- Header usando limite baseado em `vw` dentro do shell com sidebar.
- Relatorios com filtros usando `min-w` em flex sem fallback para mobile.

### Causa raiz corrigida

- Removido `overflow-x: clip` dos wrappers globais do shell autenticado.
- Substituido `max-width: 100vw` por `max-width: 100%` nos wrappers do app.
- `nodere-kanban-scroll` passou a respeitar `max-width: 100%` do container real.
- Adicionadas regras globais de `min-width: 0` para grids, flex, forms e campos dentro de `nodere-app-content`.
- Ajustada Ficha 360 para usar `minmax(0, ...)` e atrasar grids densos para `xl/2xl`.
- Ajustado Header para nao usar `vw` em texto dentro do shell.
- Ajustados filtros de Relatorios para permitir quebra sem corte.

### Script de validacao criado

Foi criado `scripts/validate-responsive-overflow.mjs`.

O script percorre as rotas principais em:

- 1366x768
- 1440x900
- 1920x1080
- 375x812

E falha se encontrar:

- `documentElement.scrollWidth` maior que `clientWidth`;
- `body.scrollWidth` maior que `clientWidth`;
- header sobrepondo conteudo;
- elementos cujo `getBoundingClientRect()` ultrapasse o viewport;
- redirecionamento para login durante a validacao autenticada.

### Validacoes tecnicas apos reteste

- `node --check scripts/validate-responsive-overflow.mjs` aprovado.
- `apps/web`: `npm run lint` aprovado.
- `apps/web`: `npm run typecheck` aprovado.
- `apps/web`: `npm run build` aprovado.
- Raiz: `npm run build` aprovado.
- `git diff --check` aprovado, apenas aviso LF/CRLF do Windows.

### Status do reteste

- Responsividade anterior reprovada reconhecida: SIM
- Causa raiz do mascaramento por `clip` identificada: SIM
- Correcao estrutural aplicada: SIM
- Primeiro deploy do reteste: `dpl_B6h4TxKuYq7GeiymqzUWbFXAiSLQ`
- Resultado do primeiro reteste em producao: REPROVADO na rota `/companies`.

### Reprovacao visual apos primeiro deploy

O primeiro reteste em producao confirmou que `/dashboard` ja estava sem overflow global, mas `/companies` ainda tinha vazamento visual em badges de alerta. A falha nao aparecia por `scrollWidth`, mas aparecia por `getBoundingClientRect()`:

- Rota: `/companies`
- Viewport desktop 1366x768
- Elemento: `.nodere-status-badge.text-[11px]`
- Texto: `Empresa tem poucas avaliacoes para gerar autoridade local.`
- Excesso medido: `overRight: 120`
- Viewport mobile 375x812
- Mesmo elemento com excesso medido: `overRight: 71`
- Outro alerta afetado: `Nao foram detectados sinais de Google Ads.`

### Correcao final dos badges

A causa raiz restante era o `white-space: nowrap` da classe global `.nodere-status-badge`. Em cards estreitos, textos longos de status ficavam proibidos de quebrar linha e escapavam do bloco.

Correcao aplicada:

- `.nodere-status-badge` agora respeita `max-width: 100%`.
- Foi adicionado `min-width: 0`.
- `line-height` foi ajustado para leitura em duas linhas.
- `white-space: nowrap` foi removido.
- Foram adicionados `overflow-wrap: anywhere` e `word-break: break-word`.

Essa correcao preserva o visual dos badges curtos e impede vazamento em alertas, tabelas, cards, filtros, Inbox, Catalogo, Admin, Settings, Discovery e Empresas.

### Correcao final da Ficha 360

O reteste autenticado de uma ficha real (`/companies/ChIJj0sXw8ZfXpMROoZMG7bU_7w`) identificou overflow mobile residual nos cards laterais de `Informacoes gerais` e `Enriquecimento publico`.

Correcao aplicada:

- O grid principal da Ficha 360 recebeu `max-w-full`.
- A coluna lateral recebeu `min-w-0` e `max-w-full`.
- Cards laterais receberam `min-w-0` e `max-w-full`.
- Linhas com telefone/avaliacao passaram a permitir quebra e icones com `shrink-0`.
- Cards internos de enriquecimento e sinais digitais receberam `min-w-0`.

Resultado em producao:

- `/companies/ChIJj0sXw8ZfXpMROoZMG7bU_7w` desktop 1366x768: aprovado.
- `/companies/ChIJj0sXw8ZfXpMROoZMG7bU_7w` mobile 375x812: aprovado.
- `bodyScrollWidth` voltou a ser igual ao `bodyClientWidth` no mobile.

### Validacoes tecnicas apos correcao dos badges

- `node --check scripts/validate-responsive-overflow.mjs` aprovado.
- `git diff --check` aprovado, apenas aviso LF/CRLF do Windows.
- `apps/web`: `npm run lint` aprovado.
- `apps/web`: `npm run typecheck` aprovado.
- `apps/web`: `npm run build` aprovado.
- Raiz: `npm run build` aprovado.
- Publicacao/validacao final em producao: APROVADA.

### Deploys do reteste

- Commit estrutural: `2996498` (`fix: corrigir overflow real dos badges em zoom 100`)
- Deploy Vercel: `dpl_BzDxdWtAebosVGj2N9m8xrnwsrwe`
- Resultado: corrigiu `/companies`, mas revelou necessidade de validar Ficha 360.
- Commit final da Ficha 360: `063c521` (`fix: corrigir overflow mobile da ficha 360`)
- Deploy Vercel final: `dpl_AHkqWdYm6iQJBQj2JjbqFXHxooB3`
- URL final: `https://web-37v2qf9l7-edipo-lima-s-projects.vercel.app`
- Alias de producao: `https://nodere.com.br`
- Backend/Render: nao necessario.

### Evidencia final de producao

Script executado em producao com `NODERE_ALLOW_LOGIN=0`, ou seja, qualquer redirecionamento para login reprovaria o teste.

Rotas aprovadas em desktop 1366x768 e mobile 375x812:

- `/dashboard`
- `/app/dashboard`
- `/companies`
- `/crm`
- `/discovery`
- `/catalog`
- `/app/proposals`
- `/reports`
- `/settings`
- `/companies/ChIJj0sXw8ZfXpMROoZMG7bU_7w`

Resultado consolidado:

- `ok: true`
- `failures: []`
- `isLogin: false` em todas as rotas
- `headerOverlap: false` em todas as rotas
- `offenders: []` em todas as rotas
- `documentElement.scrollWidth === clientWidth` nas rotas testadas
- `bodyScrollWidth === bodyClientWidth` nas rotas testadas

Tambem houve amostragem em 1440x900 e 1920x1080 para `/dashboard`, `/companies`, `/crm`, `/discovery` e `/reports`, todas aprovadas.

## Status atual

- Zoom 100 corrigido estruturalmente: SIM
- Overflow horizontal global mitigado: SIM
- Header sem sobreposicao estrutural: SIM
- Sidebar ajustada: SIM
- Busca de empresas ajustada: SIM
- Empresas preservada em cards: SIM
- CRM/Funil ajustado: SIM
- Testes tecnicos aprovados: SIM
- Producao validada: SIM
- Ferramenta liberada: SIM
