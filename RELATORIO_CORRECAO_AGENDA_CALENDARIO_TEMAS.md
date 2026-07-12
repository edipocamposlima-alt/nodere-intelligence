# RELATORIO_CORRECAO_AGENDA_CALENDARIO_TEMAS

Data: 2026-07-12
Branch: main
Escopo: Agenda/Calendario, tema claro/escuro e varredura visual relacionada

## Causa raiz identificada

O modulo Agenda/Calendario usa `react-big-calendar` em `apps/web/app/calendar/CalendarClient.tsx`.

A falha visual do modo escuro vinha de dois pontos combinados:

1. O wrapper real do calendario estava com classes fixas `bg-white` e `text-slate-950`.
2. As classes internas da biblioteca `react-big-calendar` nao tinham uma camada global de tokens NODERE para fundo, texto, borda, toolbar, celulas, cabecalhos, agenda/lista, hover, dia atual e selecao.

Como resultado, a biblioteca preservava superficies claras dentro de telas escuras, principalmente nas celulas e blocos internos do calendario.

## Correcoes aplicadas

- Removido o fundo branco fixo do wrapper `calendar-shell`.
- Criada tematizacao global para `.calendar-shell` e classes `.rbc-*`.
- O calendario agora usa variaveis semanticas derivadas de `--color-panel`, `--color-ink`, `--color-line`, `--color-text`, `--color-muted` e `--color-cyan`.
- Modo escuro cobre:
  - fundo do calendario;
  - celulas;
  - cabecalhos;
  - toolbar;
  - botoes ativos;
  - grade;
  - visualizacao mes/semana/dia/agenda;
  - hover;
  - dia atual;
  - linhas de horario;
  - tabela da agenda;
  - eventos.
- Modo claro recebeu override explicito para manter fundo claro, bordas suaves e contraste adequado.

## Arquivos alterados

- `apps/web/app/calendar/CalendarClient.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/manual/page.tsx`
- `docs/manual-nodere.md`
- `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`
- `RELATORIO_CORRECAO_AGENDA_CALENDARIO_TEMAS.md`

## Areas cobertas

- Agenda global em `/calendario`.
- Rota historica `/calendar`.
- Mini agenda da Ficha 360 via `CompanyMiniCalendar`.
- Calendario de conteudo do Marketing, que reutiliza `CalendarClient`.

## Validacoes executadas

- `apps/web npm run lint`: aprovado.
- `apps/web npm run typecheck`: aprovado.
- `apps/web npm run build`: aprovado.
- `apps/api npm run typecheck`: aprovado.
- `apps/api npm run build`: aprovado.
- `npm run build` na raiz: aprovado.
- `git diff --check`: aprovado, apenas avisos CRLF/LF esperados do Windows.
- Validacao visual local com Playwright/Chrome:
  - `/calendario` em modo escuro.
  - `/calendario` em modo claro.
  - `/calendario` mobile 390x844 em modo escuro.
  - Zoom 33%, 50%, 67%, 75%, 80%, 90%, 100%, 125% e 150%.
  - Visualizacoes Mes, Semana, Dia e Agenda.

## Evidencia visual objetiva

- Modo escuro: `calendar-shell`, `rbc-calendar`, `rbc-header`, `rbc-time-slot` e toolbar com fundo escuro e texto branco/legivel.
- Modo claro: `calendar-shell`, `rbc-calendar`, `rbc-header`, celulas e toolbar com fundo claro e texto escuro.
- Mobile 390x844: calendario presente, sem celulas brancas indevidas no modo escuro.
- Zoom: calendario permaneceu dentro do container e legivel em todos os niveis testados.
- Visualizacoes:
  - Mes: `rbc-month-view` e cabecalhos escuros no modo escuro.
  - Semana: `rbc-time-view`, horarios e cabecalhos escuros no modo escuro.
  - Dia: `rbc-time-view`, horarios e cabecalhos escuros no modo escuro.
  - Agenda: `rbc-agenda-view` escuro no modo escuro.
- Smoke test em producao:
  - `https://nodere.com.br/login`: HTTP 200.
  - `https://www.nodere.com.br/login`: redireciona/serve o mesmo deployment.
  - Login real owner/admin: aprovado.
  - `/calendario`: calendario carregado.
  - `/calendar`: alias historico carregado.
  - Tema escuro: `calendar-shell`, `rbc-calendar`, `rbc-header`, celula/slot e toolbar com fundo escuro.
  - Tema claro: `calendar-shell`, `rbc-calendar`, `rbc-header`, celula/slot e toolbar com fundo claro.
  - Mobile 390x844: calendario escuro validado.
  - Zoom 33%, 50%, 67%, 75%, 80%, 90%, 100%, 125% e 150%: aprovado.

## Publicacao

- Commit de codigo: `93b1c83c6e2f0f2a18002db62631dcb1fd54cd76`.
- Deploy Vercel: `dpl_EeLG3azTTPjNj7Pb6fTaDkG1531C`.
- URL do deployment: `https://web-gipxrfh0d-edipo-lima-s-projects.vercel.app`.
- Alias de producao: `https://nodere.com.br` e `https://www.nodere.com.br`.
- Backend Render confirmado por `/api/health/version`: commit `93b1c83`.

## Status final

- AGENDA/CALENDARIO ESCURO CORRIGIDO: SIM
- CELULAS BRANCAS REMOVIDAS DO MODO ESCURO: SIM
- MODO CLARO PRESERVADO: SIM
- ALTERNANCIA CLARO/ESCURO VALIDADA: SIM
- ZOOM/RESPONSIVIDADE VALIDADO: SIM
- MANUAL NODERE ATUALIZADO: SIM
- TESTES TECNICOS APROVADOS: SIM
- FRONTEND PUBLICADO: SIM
- PRODUCAO VALIDADA: SIM
- FUNCIONALIDADE LIBERADA: SIM
