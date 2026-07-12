# RELATORIO_ICONES_TEMA_FICHA360_V4

Data: 2026-07-12
Branch: main

## Objetivo

Corrigir a perda de cor dos icones no tema claro e reforcar definitivamente o fluxo da Ficha 360 para impedir abertura com identificadores externos nao canonicos.

## Causa raiz - icones

O tema claro possui overrides globais para classes Tailwind de fundo, borda e texto usadas em componentes do app. Esses overrides sao necessarios para tornar superficies escuras legiveis no modo claro, mas tambem afetavam containers e icones que dependiam de cor herdada. Como resultado, alguns icones perdiam a cor semantica e ficavam cinza/monocromaticos no modo claro.

## Correcoes - icones

- Criada camada global de tons de icone em `apps/web/app/globals.css`.
- A nova camada usa `data-icon-tone` e variaveis fixas para manter a mesma cor cromatica no tema claro e escuro.
- Dashboard executivo passou a declarar explicitamente a cor de cada icone critico:
  - Leads salvos no CRM: verde.
  - Score medio: azul.
  - Leads quentes: laranja.
  - Conversoes: dourado.
  - Empresas encontradas: azul.
  - Sem site: vermelho.
  - Sem WhatsApp: laranja.
  - Sem redes sociais: roxo/magenta.
  - Sem Google Ads: laranja escuro.
  - Acao recomendada: verde.
  - Propostas enviadas: azul.
  - Propostas em aberto: dourado.
- Sidebar e menu mobile receberam tons por modulo.
- CRM/Kanban teve botoes de acao compactos protegidos contra overrides do tema claro, preservando cor, centralizacao e contraste.

## Causa raiz - Ficha 360

A correcao anterior salvava/resolvia resultados embutidos da busca, mas ainda havia lacunas:

- `discovery-*` nao entrava na regra de ID externo que exige persistencia antes da navegacao.
- URLs antigas com ID externo podiam continuar exibindo `/companies/{id_externo}` mesmo quando a API retornava o registro interno.
- O lookup de IDs externos no Supabase usava filtro `.or(...)`, mais sensivel a parsing de caracteres especiais.

## Correcoes - Ficha 360

- `apps/web/components/CompanyTable.tsx`: `discovery-*` agora e tratado como ID externo temporario.
- `apps/web/app/companies/[id]/page.tsx`: a pagina redireciona para `/companies/{id_interno}` quando a API resolve um ID externo para empresa persistida.
- `apps/api/src/services/companyStore.ts`: lookup por `place_id` e `google_place_id` passou a usar consultas sequenciais `eq`, evitando fragilidade de `.or(...)`.

## Arquivos alterados

- `apps/web/app/dashboard/DashboardHome.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/Sidebar.tsx`
- `apps/web/components/MobileNav.tsx`
- `apps/web/app/companies/[id]/page.tsx`
- `apps/web/components/CompanyTable.tsx`
- `apps/api/src/services/companyStore.ts`
- `apps/api/src/server.ts`
- `apps/web/app/manual/page.tsx`
- `docs/manual-nodere.md`
- `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`
- `RELATORIO_CORRECAO_FICHA360_RECURSO_NAO_ENCONTRADO.md`
- `RELATORIO_ICONES_TEMA_FICHA360_V4.md`

## Validacao planejada

- Alternar tema claro/escuro e confirmar que icones mantem cores semanticas.
- Abrir Dashboard e validar cards principais.
- Abrir CRM/Kanban e validar icones de lapis, lixeira, salvar e cancelar.
- Abrir menu lateral e mobile e confirmar tons por modulo.
- Abrir Ficha 360 a partir de busca/listagem/URL antiga com ID externo.
- Executar lint, typecheck, build e regressao de API/web.

## Testes tecnicos executados

- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run build` - aprovado.
- `apps/api`: `npm run typecheck` - aprovado.
- `apps/api`: `npm run build` - aprovado.
- `apps/api`: `npm run test:phase1` - aprovado.
- `apps/api`: `npm run test:crm` - aprovado.
- Raiz: `npm run build` - aprovado.
- `node scripts/validate-commercial-schema.mjs` - aprovado.
- `git diff --check` - aprovado, apenas avisos de normalizacao LF/CRLF do Windows.

## Limitacoes da validacao visual

A validacao tecnica local confirmou compilacao, tipos e schema. A validacao visual autenticada real em producao deve ser feita com sessao owner/admin ativa no navegador, pois o ambiente de execucao nao expoe token de usuario autenticado sem risco de credenciais em log.

## Status

- CORRECOES IMPLEMENTADAS: SIM
- MANUAL ATUALIZADO: SIM
- TESTES TECNICOS: APROVADOS
- PUBLICACAO FRONTEND: APROVADA
- PUBLICACAO BACKEND: EM EXECUCAO; NOVO ENDPOINT `/api/health/version` CRIADO PARA CONFIRMACAO OBJETIVA DO COMMIT EM PRODUCAO

## Publicacao

- Commit: `3dff9d3` - `fix: padronizar icones e reforcar ficha 360`.
- Push: `main` enviado para `origin/main`.
- Vercel frontend: `dpl_6KtKACUxK9Zp7EgcKM8ugo3W9BXj`.
- URL do deployment: `https://web-7r2bycaj4-edipo-lima-s-projects.vercel.app`.
- Alias de producao confirmado: `https://nodere.com.br`.
- Alias `www` confirmado no inspect: `https://www.nodere.com.br`.
- API Render: `GET /health`, `GET /api/health` e `GET /api/health/supabase` responderam 200.

## Smoke publico pos-deploy

- `https://nodere.com.br/login` - 200.
- `https://nodere.com.br/termos` - 200.
- `https://nodere.com.br/privacidade` - 200.
- `https://nodere.com.br/dashboard` - 307 para `/login?next=%2Fdashboard`, esperado sem sessao.
- `https://nodere.com.br/app/dashboard` - 307 para `/login?next=%2Fapp%2Fdashboard`, esperado sem sessao.
- `https://nodere.com.br/manual` - 307 para `/login?next=%2Fmanual`, esperado sem sessao.
- Logs Vercel dos ultimos minutos sem erros; apenas requisicoes 200/307 esperadas.

## Pendencia operacional

O backend passou a expor `/api/health/version` com `commit`, `commitShort`, `version` e metadados seguros de ambiente. A confirmacao final do Render deve comparar esse endpoint com o HEAD publicado nesta sessao.
