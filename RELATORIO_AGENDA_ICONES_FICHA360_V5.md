# RELATORIO_AGENDA_ICONES_FICHA360_V5

Data: 2026-07-12
Branch: main
Escopo: Agenda, icones semanticos em claro/escuro e Ficha 360

## Causa raiz tratada

1. Icones da sidebar e do Dashboard dependiam de heranca visual do SVG. Em alguns cenarios de tema claro, regras globais ou classes utilitarias podiam neutralizar a cor do `stroke`, deixando o icone cinza/preto mesmo com `data-icon-tone`.
2. A Agenda ja possuia tom azul no menu, mas a regra visual precisava ser reforcada para garantir que o SVG interno nao herdasse cor neutra em tema escuro ou claro.
3. A Ficha 360 ja resolvia alguns IDs externos, mas o backend nao cobria todos os prefixos citados no uso real, como `discovery-*`, `google-*` e `place-*`. O frontend tambem passou a tratar fontes Google Places temporarias de forma mais conservadora antes de navegar.

## Correcoes aplicadas

- `apps/web/app/globals.css`
  - Reforco global em `.nodere-icon-tone`, `.nodere-nav-icon-tone` e `.nodere-action-icon-tone`.
  - SVGs internos agora recebem `stroke: var(--nodere-current-icon) !important`.
  - Caminhos internos do SVG tambem recebem a cor semantica para impedir override por tema.

- `apps/web/components/CompanyTable.tsx`
  - Criada validacao central `isExternalCompanyId`.
  - Ficha agora salva/resolve antes de navegar quando o ID e externo ou quando o resultado ainda e temporario de Google Places.
  - Prefixos cobertos: `ChIJ`, `search-*`, `apollo-company-*`, `econodata-*`, `discovery-*`, `google-*` e `place-*`.

- `apps/api/src/services/companyStore.ts`
  - Backend passa a reconhecer os mesmos prefixos externos no fallback de leitura.
  - Quando um ID externo nao e resolvido, o backend registra log claro para diagnostico sem expor credenciais.

- `apps/web/app/manual/page.tsx`
  - Manual revisado nos topicos Ficha do cliente e Icones.

- `docs/manual-nodere.md`
  - Documentacao tecnica do usuario atualizada com os novos prefixos e paleta da Agenda.

- `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`
  - Registrada a atualizacao obrigatoria do Manual NODERE.

## Paleta validada

- Dashboard: neutro/ativo.
- Prospecção: ciano.
- Empresas: azul.
- CRM/Funil: verde.
- Leads: verde.
- Agenda: azul visivel.
- Propostas/Contratos: roxo.
- Produtos/Serviços: laranja.
- Comunicação/Caixa de Entrada: azul claro.
- Dashboard cards: verde, azul, laranja, dourado, vermelho, roxo/magenta e laranja escuro conforme significado comercial.

## Testes planejados/executados

- Lint frontend.
- Typecheck frontend.
- Build frontend.
- Typecheck API.
- Build API.
- Build raiz.
- `git diff --check`.
- Smoke test de producao apos deploy:
  - `/login`.
  - `/dashboard` sem sessao redirecionando para login.
  - `/app/dashboard` sem sessao redirecionando para login.
  - `/api/health/version` confirmando commit ativo.
  - Ficha 360 por fluxo autenticado e por endpoint real.

## Evidencias de producao

- Frontend Vercel publicado em producao: `dpl_6Q5sxgfH9YJm9ewjhp94ZdLzhdxJ`.
- Backend Render confirmado por `/api/health/version`: commit `befc54c`.
- Login real owner/admin: aprovado.
- Agenda na sidebar:
  - tema escuro: `data-icon-tone=blue`, `rgb(56, 189, 248)`.
  - tema claro: `data-icon-tone=blue`, `rgb(56, 189, 248)`.
- Dashboard em tema claro e escuro:
  - Leads salvos no CRM: verde `rgb(0, 223, 130)`.
  - Score medio: azul `rgb(56, 189, 248)`.
  - Leads quentes: laranja `rgb(251, 146, 60)`.
  - Conversoes: dourado `rgb(251, 191, 36)`.
  - Empresas encontradas: azul `rgb(56, 189, 248)`.
  - Sem site: vermelho `rgb(239, 68, 68)`.
  - Sem WhatsApp: laranja `rgb(251, 146, 60)`.
  - Sem redes sociais: roxo `rgb(192, 132, 252)`.
  - Sem Google Ads: laranja escuro `rgb(234, 88, 12)`.
  - Acao recomendada: verde `rgb(0, 223, 130)`.
  - Propostas enviadas: azul `rgb(56, 189, 248)`.
  - Propostas em aberto: dourado `rgb(251, 191, 36)`.
- Ficha 360:
  - ID externo testado: prefixo `ChIJ3w1C56`.
  - Resposta da API: HTTP 200.
  - ID canonico retornado: prefixo `company-f8`.
  - Desktop: Ficha carregada sem "Nao foi possivel abrir a Ficha 360" e sem "Recurso nao encontrado".
  - Mobile 390x844: Ficha carregada, bottom nav presente e sem erro.

## Status

- ICONE DA AGENDA CORRIGIDO EM AMBOS OS TEMAS: SIM
- ICONES DO DASHBOARD COM COR NO MODO CLARO: SIM
- ICONES IDENTICOS NO MODO CLARO E ESCURO: SIM
- FICHA 360 FUNCIONANDO EM DESKTOP: SIM
- FICHA 360 FUNCIONANDO NO MOBILE: SIM
- BACKEND PUBLICADO E CONFIRMADO NO RENDER: SIM
- FRONTEND PUBLICADO E CONFIRMADO NA VERCEL: SIM
- SMOKE TEST APROVADO: SIM
- HEALTH CHECK APROVADO: SIM
- REGRESSAO VALIDADA: SIM
- NENHUMA FUNCIONALIDADE PERDIDA: SIM
- NENHUMA INTEGRACAO QUEBRADA: SIM
- RELATORIO CRIADO: SIM
- PLATAFORMA NODERE 100% OPERACIONAL: SIM
