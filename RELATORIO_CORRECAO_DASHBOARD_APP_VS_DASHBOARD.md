# Relatorio - Correcao Dashboard /app/dashboard vs /dashboard

Data: 2026-07-02

## Causa da diferenca

As rotas `/dashboard` e `/app/dashboard` ja reutilizavam o mesmo componente de dashboard:

- `/dashboard`: `apps/web/app/dashboard/page.tsx`
- `/app/dashboard`: `apps/web/app/app/dashboard/page.tsx`
- Componente comum: `apps/web/app/dashboard/DashboardHome.tsx`

A diferenca visual vinha do layout:

- `/dashboard` usava `AppShell`, com `components/Sidebar`, `components/Header` e `components/MobileNav`.
- `/app/dashboard` usava `apps/web/app/app/layout.tsx`, com `components/layout/Sidebar` e `components/layout/Topbar`.

Esse segundo shell tinha outro padrao visual, menu reduzido e links diferentes, por isso `/app/dashboard` parecia uma versao baguncada.

## Ajuste aplicado

- `apps/web/app/app/layout.tsx` passou a usar o mesmo shell visual de `/dashboard`.
- O `WorkspaceProvider` foi preservado dentro de `/app/*` para nao quebrar configuracoes/workspace.
- `AuthProvider` e `CreditsProvider` foram adicionados ao layout `/app/*`, mantendo header, creditos, logout, busca, preferencias e mobile nav.
- `/dashboard` foi preservado.
- `/app/dashboard` continua usando `DashboardHome`.

## Menu lateral

O menu correto foi organizado por grupos em `apps/web/components/Sidebar.tsx`:

- Principal
- Descoberta
- CRM
- Comunicacao
- Inteligencia
- Analytics
- Operacoes
- Administracao

## Abas preservadas

- Inicio / Dashboard
- Busca de empresas / Prospeccao
- Empresas
- CRM / Funil
- Pipeline
- Leads
- Agenda / Calendario
- Propostas
- Inteligencia / IA NODERE
- Caixa de entrada
- WhatsApp
- E-mail
- Omnichannel
- Automacoes
- Operadores
- Relatorios
- Marketing
- Catalogo
- Faturamento
- Projetos
- Integracoes
- Configuracoes
- Ajuda / Manual NODERE
- Administrador

Observacao: `WhatsApp` e `E-mail` nao possuem rota dedicada nesta arvore e apontam para `/inbox`, que e a caixa omnichannel valida. `Projetos` aponta para `/app/upgrade?module=OPS-01`, evitando rota 404 enquanto o modulo dedicado nao existe.

## Arquivos alterados

- `apps/web/app/app/layout.tsx`
- `apps/web/components/Sidebar.tsx`
- `apps/web/components/MobileNav.tsx`
- `apps/web/components/Header.tsx`
- `RELATORIO_CORRECAO_DASHBOARD_APP_VS_DASHBOARD.md`

## Rotas validadas

Validacao local em `http://localhost:3006`:

- `/dashboard`
- `/app/dashboard`

## Evidencia textual de validacao visual

Sinais encontrados em ambas as rotas:

- `Configure o NODERE`
- `Dashboard executivo`
- `Buscar empresas`
- `Abrir CRM`
- `Score medio`
- grupos de menu `Principal`, `Descoberta`, `CRM`, `Comunicacao`, `Operacoes`, `Administracao`
- abas `Propostas`, `Catalogo`, `Projetos`, `WhatsApp`, `E-mail`

Sinal removido de `/app/dashboard`:

- Topbar antigo com `Workspace NODERE` / estrutura `components/layout/Topbar`.

Resultado da comparacao local: os sinais principais de `/dashboard` e `/app/dashboard` ficaram equivalentes.

## Testes executados

- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run build` - aprovado.
- raiz: `npm run build` - aprovado.
- `git diff --check` - aprovado.

API nao foi alterada, portanto `apps/api` build/typecheck nao foi necessario nesta correcao.

## Pendencias

- Validacao visual em producao depende de deploy. Nenhum deploy foi feito nesta etapa.
- Se forem criadas rotas dedicadas futuras para WhatsApp, E-mail e Projetos, atualizar os links do menu para essas rotas especificas.

## Status final

Aprovado localmente. `/app/dashboard` agora usa o mesmo padrao visual e estrutural correto de `/dashboard`, com menu organizado e abas preservadas.
