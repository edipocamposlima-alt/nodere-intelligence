# RELATORIO - Tema, Fonte e Layout NODERE

## Causa raiz

A area "Tema, fonte e layout" existia visualmente, mas parte das opcoes nao tinha efeito global real porque:

- `apps/web/lib/theme.ts` normalizava poucos valores e forçava `colorPrimary` para `#03624C`.
- O formulario de `apps/web/app/settings/SettingsClient.tsx` expunha apenas tres temas, tres tamanhos de fonte e densidades antigas.
- A cor principal estava desabilitada e era aplicada apenas como preview fixo.
- `ThemeProvider` aplicava somente localStorage; preferencias salvas no backend so eram recarregadas ao abrir Configuracoes.
- A API sanitizava poucos campos de preferencias.
- O tema claro dependia de correcoes parciais para classes escuras (`bg-ink`, `bg-panel`, `text-white`) e nao cobria editor, cards, inputs, tabelas e blocos internos de forma uniforme.

## Arquivos alterados

- `apps/web/lib/theme.ts`
- `apps/web/app/layout.tsx`
- `apps/web/components/providers/ThemeProvider.tsx`
- `apps/web/app/settings/SettingsClient.tsx`
- `apps/web/components/Header.tsx`
- `apps/web/app/globals.css`
- `apps/api/src/services/settingsStore.ts`
- `RELATORIO_TEMA_FONTE_LAYOUT_NODERE.md`

## Campos de configuracao

Campos existentes preservados:

- `theme`
- `mode`
- `colorPrimary`
- `fontFamily`
- `fontSize`
- `layoutDensity`
- `cardStyle`
- `backendUrl`

Campos adicionados/normalizados no JSON de preferencias:

- `themeVariant`
- `density`
- `layoutVariant`
- `visualStyle`
- `themeUpdatedAt`

Nao foi criada migration SQL porque `nodere_app_settings` ja persiste preferencias como JSON por workspace.

## Aplicacao global

O `ThemeProvider` agora:

- aplica localStorage imediatamente;
- sincroniza `/api/settings` quando a sessao permite;
- reaplica as preferencias remotas mais recentes;
- mantem fallback local se a API falhar;
- dispara evento global `nodere:theme-change`.

O script anti-flicker em `apps/web/app/layout.tsx` agora aplica antes da hidratacao:

- `data-theme`
- `data-theme-mode`
- `data-theme-variant`
- `data-font-family`
- `data-font-size`
- `data-density`
- `data-layout`
- `data-card-style`
- `data-visual`
- `--nodere-font-family`
- `--brand-primary`
- `--nodere-primary`

## Temas

Opcoes reais implementadas:

- Claro
- Escuro
- Sistema
- Verde NODERE
- Alto contraste escuro
- Alto contraste claro

Cada tema altera variaveis globais de fundo, cards, bordas, textos, inputs, header/sidebar, editor e superficie principal.

## Fonte

Opcoes com fallback seguro:

- Inter
- Arial
- Roboto
- System
- Poppins
- Montserrat
- Manrope
- Nunito Sans
- Lato
- Open Sans
- DM Sans
- Urbanist
- Source Sans 3

A fonte e aplicada em `html`, `body`, inputs, botoes, editor, shell e conteudo autenticado via `--nodere-font-family`.

## Tamanho da fonte

Opcoes:

- Compacta
- Pequena
- Normal
- Grande
- Extra grande

Aplicado por `data-font-size` em body, campos e botoes.

## Densidade

Opcoes:

- Compacto
- Confortavel
- Espacoso

Aplicado por variaveis:

- `--nodere-density-card-padding`
- `--nodere-density-control-height`
- `--nodere-density-gap`
- `--nodere-density-button-padding-x`
- `--nodere-density-button-padding-y`

## Layout

Opcoes:

- Padrao
- Compacto
- Confortavel
- Elevado premium
- Operacao comercial
- Alta densidade

Aplicacao:

- largura maxima do conteudo;
- raio de cards;
- sombra/elevação;
- borda lateral comercial;
- densidade visual.

## Cor principal

A cor principal agora e editavel e persistida. Ela alimenta:

- `--brand-primary`
- `--brand-primary-hover`
- `--brand-primary-dark`
- `--brand-primary-active`
- `--nodere-primary`
- foco de inputs;
- botoes primarios;
- links/destaques que usam tokens de marca.

## Correcoes no tema claro

Foram reforcadas regras globais para:

- `bg-panel*`
- `bg-ink*`
- inputs/selects/textareas;
- editor e preview;
- tabelas;
- cards;
- sidebar/header;
- textos fixos claros em tema claro.

Objetivo: impedir blocos escuros residuais em Propostas/Contratos, Ficha 360, Empresas, CRM/Funil, Dashboard, Relatorios e Configuracoes.

## Testes tecnicos executados

- `apps/web`: `npm run lint` - aprovado
- `apps/web`: `npm run typecheck` - aprovado
- `apps/web`: `npm run build` - aprovado
- `apps/api`: `npm run typecheck` - aprovado
- `apps/api`: `npm run build` - aprovado
- Raiz: `npm run build` - aprovado
- `git diff --check` - aprovado, apenas avisos LF/CRLF do Windows

## Validacao visual e producao

Frontend publicado em producao:

- Commit: `fd76cbf`
- Vercel deployment: `dpl_CD7LwFWfAHy5tcSHSoFQ7djMmESm`
- URL: `https://web-4fnxk0a6f-edipo-lima-s-projects.vercel.app`
- Alias: `https://nodere.com.br`

Validacao automatizada em producao:

- Edge isolado sem sessao confirmou aplicacao visual via `localStorage` das combinacoes obrigatorias.
- Resultado visual: `data-theme`, `data-theme-variant`, `data-font-size`, `data-density`, `data-layout`, `data-visual`, `fontFamily` e `--brand-primary` mudaram conforme as combinacoes.
- Rotas amostradas: `/dashboard`, `/companies`, `/crm`, `/app/proposals`, `/settings`.
- Nao houve overflow global nos resultados do Edge isolado: `bodyScrollWidth === bodyClientWidth`.

Validacao com sessao real em producao:

- Uma sessao real owner/admin foi localizada no Chrome em `https://nodere.com.br/dashboard`.
- A sessao real tinha `nodere_admin_token` presente.
- `GET https://nodere-api.onrender.com/api/health` retornou `200`.
- `GET https://nodere-api.onrender.com/health` retornou `200`.
- O backend retornou `supabaseConfigured: true` e `databaseUrlConfigured: true`.
- Foi executado `PATCH https://nodere-api.onrender.com/api/settings` autenticado com as preferencias:
  - `theme: Claro`
  - `mode: light`
  - `themeVariant: default`
  - `colorPrimary: #0A7A5F`
  - `fontFamily: Arial`
  - `fontSize: small`
  - `density: compact`
  - `layoutDensity: compact`
  - `layoutVariant: compact`
  - `visualStyle: solid`
  - `cardStyle: solid`
- Em seguida, `GET https://nodere-api.onrender.com/api/settings` autenticado retornou os mesmos campos persistidos.
- A existencia e retorno dos campos `themeVariant`, `density`, `layoutVariant`, `visualStyle`, `fontSize` e `colorPrimary` confirmam que o backend Render esta executando o commit `fd76cbf` ou posterior.

Validacao de refresh e fonte de verdade:

- Foram removidos do navegador os caches locais `nodere_settings`, `nodere-theme` e `nodere_theme`.
- Ao abrir novamente `https://nodere.com.br/settings`, o `ThemeProvider` recarregou as preferencias a partir do backend.
- O DOM aplicou:
  - `data-theme: light`
  - `data-theme-variant: default`
  - `data-font-size: small`
  - `data-density: compact`
  - `data-layout: compact`
  - `data-visual: solid`
  - `--brand-primary: #0A7A5F`
  - `fontFamily: Arial, Helvetica, sans-serif`
- Conclusao: o `localStorage` nao e a unica fonte de verdade; ele e reidratado pelo backend quando a sessao esta autenticada.

Validacao mobile em producao:

- Executado `node scripts/validate-responsive-overflow.mjs` contra `https://nodere.com.br`.
- Viewport: `mobile-375:375x812`.
- Rotas validadas:
  - `/dashboard`
  - `/companies`
  - `/crm`
  - `/discovery`
  - `/app/proposals`
  - `/settings`
- Resultado: `ok: true`, `failures: []`.
- Todas as rotas retornaram:
  - `isLogin: false`
  - `clientWidth: 375`
  - `scrollWidth: 375`
  - `bodyClientWidth: 375`
  - `bodyScrollWidth: 375`
  - `headerOverlap: false`
  - `offenders: []`

Backend:

- Houve alteracao em `apps/api/src/services/settingsStore.ts`.
- O push para `main` foi realizado anteriormente.
- O Render foi validado por comportamento em producao: `/api/health` esta ativo e `/api/settings` persiste/retorna os novos campos do commit `fd76cbf` ou posterior.

## Pendencias

- Persistencia backend validada com sessao owner/admin real.
- Refresh validado com recarga a partir de `/api/settings`.
- Mobile 375x812 validado nas rotas principais.
- Pendente apenas validacao de logout/login real completa, porque a automacao nao possui a senha do usuario. Nao foi feito logout para nao perder a sessao owner/admin ativa e bloquear as validacoes restantes.

## Status

Status: APROVADO TECNICAMENTE / PUBLICADO FRONTEND / BACKEND RENDER VALIDADO / PERSISTENCIA BACKEND VALIDADA / MOBILE VALIDADO / PENDENTE LOGOUT-LOGIN REAL COM CREDENCIAL.
