# RELATORIO_CORRECAO_SCROLL_NAVEGACAO

## Objetivo

Corrigir a navegacao e a rolagem vertical do app NODERE em telas autenticadas, fichas, abas, drawers, modais e areas internas, sem alterar regras de negocio, autenticacao, permissoes, APIs ou banco.

## Causa raiz

O layout privado novo usava `height: 100vh` no container principal e `overflow: hidden` no wrapper flex sem garantir `min-height: 0` nos filhos. Em desktop isso fazia a rolagem depender exclusivamente de `.app-content`; em mobile/PWA, `100vh` podia calcular altura incorreta e cortar conteudo. Alguns modais, drawers, calendario, inbox e CRM tambem usavam `vh` fixo, o que aumentava o risco de campos e botoes ficarem inacessiveis em telas menores.

## Correcoes implementadas

- Ajustado o shell privado para usar `100dvh` com fallback em `100vh`.
- Adicionado `min-height: 0`, `min-width: 0`, `overflow-x: clip` e rolagem suave no container real de conteudo.
- No desktop, a navegacao lateral e o conteudo principal permanecem com scroll interno controlado.
- No mobile, o conteudo deixa de ficar preso em scroll interno e volta a rolar pelo documento, com espaco inferior para menu/PWA.
- Convertidos pontos de `100vh`/`vh` criticos para `100dvh`/`dvh` em drawer, modais, inbox, calendario e ficha CRM.
- Ajustado footer do drawer da ficha para quebrar linha no mobile sem esconder botoes.
- Mantidos tema claro/escuro, autenticacao, permissoes e fluxos existentes.

## Telas corrigidas/revisadas

- `/app/dashboard`
- `/app/leads`
- Ficha Comercial/Ficha Cliente
- Abas internas com conteudo longo
- CRM/Funil
- Calendario/Agenda
- Inbox/WhatsApp
- Admin/Conteudo
- Configuracoes
- Discovery
- Relatorios
- Propostas e contratos por preservacao do shell global
- Modais e drawers principais
- Mobile/PWA por uso de viewport dinamico

## Arquivos alterados

- `apps/web/app/globals.css`
- `apps/web/components/AppShell.tsx`
- `apps/web/components/Sidebar.tsx`
- `apps/web/components/crm/LeadDrawer.tsx`
- `apps/web/app/calendar/CalendarClient.tsx`
- `apps/web/app/inbox/InboxClient.tsx`
- `apps/web/app/crm/CrmBoard.tsx`
- `apps/web/app/app/crm/clientes/[id]/CrmClientFullPage.tsx`
- `apps/web/app/companies/[id]/LeadOperations.tsx`
- `apps/web/app/manual/page.tsx`
- `apps/web/app/reports/ReportsClient.tsx`
- `RELATORIO_CORRECAO_SCROLL_NAVEGACAO.md`

## Validacao executada

- `git diff --check` aprovado.
- `apps/web`: `npm run typecheck` aprovado.
- `apps/web`: `npm run lint` aprovado.
- `apps/web`: `npm run build` aprovado.
- `apps/api`: `npm run build` aprovado.
- `apps/api`: `npm run typecheck` aprovado.
- Raiz: `npm run build` aprovado.

## Problemas encontrados

- O shell privado era o principal ponto de bloqueio por combinar altura fixa de viewport com overflow interno.
- Alguns componentes usavam `vh` fixo em areas que precisam respeitar barras moveis do navegador no mobile.
- O drawer da ficha tinha footer sem quebra de linha, podendo cortar acoes em telas estreitas.

## Pendencias

- Validacao visual manual em dispositivos reais/PWA ainda e recomendada, pois o ambiente local automatizado nao substitui comportamento de barras dinamicas em navegadores moveis reais.

## Atualizacao obrigatoria — Relatorios Executivos e Manual NODERE

- Manual NODERE atualizado na secao App no celular/PWA para documentar rolagem com altura dinamica.
- Relatorios Executivos atualizado na governanca para incluir rolagem como item obrigatorio de revisao.

## Status final

Aprovado tecnicamente para homologacao visual.
