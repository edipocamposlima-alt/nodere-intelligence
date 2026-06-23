# STATUS PUBLICACAO FINAL - NODERE

Data: 2026-06-23

## Resultado geral

Publicacao da aplicacao web concluida em producao na Vercel.

O dominio `https://nodere.com.br` foi atualizado para o deployment novo:

- Deployment Vercel: `dpl_2WaeMaZrBsysq52QyUC7mnhXsTzZ`
- URL do deployment: `https://web-ce4p8vc7e-edipo-lima-s-projects.vercel.app`
- Alias de producao: `https://nodere.com.br`
- Status: `READY`

## O que foi publicado

- Fase 2 integrada na branch `main`.
- Home humanizada portada para o App Router em `apps/web/app/page.tsx`.
- CSS da home humanizada publicado em `apps/web/app/globals.css`.
- Ajustes da Ficha Comercial em `apps/web/app/companies/[id]/LeadOperations.tsx`.
- Correcoes das rotas administrativas legadas:
  - `/admin/integrations`
  - `/admin/modules`
  - `/admin/plans`
  - `/admin/users`
- Configuracao local de deploy do app web em `apps/web/vercel.json`.
- Next.js atualizado para `15.5.19`, removendo o bloqueio de seguranca da Vercel contra `15.1.3`.

## O que ainda nao foi publicado

- Backend Render nao recebeu deploy manual por CLI nesta execucao, pois nao ha Render CLI/token configurado no ambiente.
- Banco Supabase nao foi alterado nesta execucao.
- SQL pendente deve continuar sendo aplicado manualmente no projeto Supabase correto quando houver migracoes novas.

## Git

- Branch publicada no remoto: `main`
- Commit funcional publicado no deploy Vercel: estado local com base em `e07b07f` mais os ajustes de deploy descritos neste arquivo.
- Observacao: os ajustes finais de deploy foram aplicados localmente depois do push inicial para permitir a publicacao pela Vercel CLI.

## Validacoes executadas

### Frontend local

- `apps/web`: `npm run lint` - OK
- `apps/web`: `npm run build` - OK

### Backend local

- `apps/api`: `npm run lint` - OK
- `apps/api`: `npm run build` - OK

### Producao web

- `https://nodere.com.br` - 200
- `/login` - 200
- `/register` - 200
- `/precos` - 200
- `/contato` - 200
- `/solucoes` - 200
- `/admin` - 307 esperado por protecao/autenticacao
- `/admin/content` - 307 esperado por protecao/autenticacao
- `/app/dashboard` - 307 esperado por protecao/autenticacao

### Producao API

- `https://nodere-api.onrender.com/health` - 200
- `https://nodere-api.onrender.com/api/health` - 200
- `/api/crm/leads` sem sessao - 401
- `/api/companies` sem sessao - 401
- `/api/discovery/search` sem sessao - 401
- `/api/calendar` sem sessao - 401
- `/api/billing/plans` sem sessao - 200

## Causa raiz da nao publicacao

As alteracoes estavam locais/em branch de desenvolvimento e nao estavam na producao.

Alem disso, a Vercel estava sendo acionada a partir da raiz do repositorio, onde existe um `vercel.json` legado para build estatico com `outputDirectory: dist`. A aplicacao real atual e um app Next.js em `apps/web`, que deve ser publicado a partir desse diretorio.

Durante a correcao, a Vercel tambem bloqueou a publicacao com Next.js `15.1.3` por vulnerabilidade critica. A versao foi atualizada para `15.5.19`.

## Deploy Render

Nao foi executado deploy manual no Render nesta etapa. O backend respondeu corretamente nos endpoints de saude e nas rotas protegidas testadas.

## Pendencias restantes

- Confirmar no painel Render se o backend esta conectado ao mesmo commit desejado ou se precisa deploy manual.
- Executar homologacao autenticada real no navegador para CRM, Discovery, Dashboard, CMS, Relatorios, Configuracoes e mobile.
- Resolver vulnerabilidades moderadas restantes do `npm audit` do web quando houver caminho sem breaking change.
- Confirmar se GitHub/Vercel deve ser reconfigurado para deploy automatico a partir de `apps/web`, evitando deploy manual via CLI.

