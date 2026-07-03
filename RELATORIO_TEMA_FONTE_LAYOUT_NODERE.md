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

Validacao com sessao real:

- Uma aba real do Chrome foi encontrada em `https://nodere.com.br/app/proposals`.
- A sessao real tinha `nodere_admin_token` presente.
- A tentativa de homologar todas as combinacoes via Chrome autenticado excedeu o tempo da ponte de automacao e resetou a sessao de ferramenta.
- Portanto, a persistencia real no backend nao foi marcada como 100% validada neste relatorio.

Backend:

- Houve alteracao em `apps/api/src/services/settingsStore.ts`.
- O push para `main` foi realizado.
- A publicacao manual/confirmada do Render nao foi executada nesta etapa pela ferramenta; se o Render estiver com auto-deploy via GitHub, deve publicar o commit `fd76cbf`.

## Pendencias

Pendente validar com sessao owner/admin real apos Render publicar o backend:

- Claro + Arial + Compacto
- Claro + Inter + Confortavel
- Escuro + Poppins + Elevado premium
- Verde NODERE + Montserrat + Operacao comercial
- Alto contraste escuro + fonte grande
- Sistema + layout padrao
- Salvar em `/settings`.
- Recarregar a pagina.
- Fazer logout/login.
- Confirmar retorno de `/api/settings` com `fontSize`, `density`, `layoutVariant`, `visualStyle`, `themeVariant` e `colorPrimary`.

## Status

Status: APROVADO TECNICAMENTE / PUBLICADO FRONTEND / PENDENTE VALIDACAO FINAL DE PERSISTENCIA AUTENTICADA.
