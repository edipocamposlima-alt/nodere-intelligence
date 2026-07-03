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

## Validacao visual e producao

Pendente de publicacao e homologacao final em `https://nodere.com.br`.

## Pendencias

Pendente validar em producao:

- Claro + Arial + Compacto
- Claro + Inter + Confortavel
- Escuro + Poppins + Elevado premium
- Verde NODERE + Montserrat + Operacao comercial
- Alto contraste escuro + fonte grande
- Sistema + layout padrao

## Status

Status antes do deploy: APROVADO TECNICAMENTE / PENDENTE HOMOLOGACAO EM PRODUCAO.
