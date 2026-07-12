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

## Status

- ICONE DA AGENDA CORRIGIDO EM AMBOS OS TEMAS: A VALIDAR EM PRODUCAO APOS DEPLOY
- ICONES DO DASHBOARD COM COR NO MODO CLARO: A VALIDAR EM PRODUCAO APOS DEPLOY
- FICHA 360 FUNCIONANDO EM DESKTOP/MOBILE: A VALIDAR EM PRODUCAO APOS DEPLOY
- RELATORIO CRIADO: SIM
