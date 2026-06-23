# RELATORIO PRE EXECUCAO - FASE 2 BLOCO 5

## Escopo

Executar exclusivamente Mobile e PWA na branch `fase-02-desenvolvimento`, sem iniciar Bloco 6 e sem alterar funcionalidades dos Blocos 1, 2, 3 e 4.

## Arquivos impactados

- `apps/web/app/layout.tsx`
  - Metadados PWA, viewport, iOS e tema.

- `apps/web/app/globals.css`
  - Regras responsivas globais, tabelas, formularios, cards, drawers e safe area mobile.

- `apps/web/components/AppShell.tsx`
  - Estrutura base da plataforma autenticada, shell mobile e areas seguras.

- `apps/web/components/Header.tsx`
  - Topbar mobile, botao sair visivel, botao instalar app e comportamento touch.

- `apps/web/components/MobileNav.tsx`
  - Menu inferior e drawer de ferramentas.

- `apps/web/components/Sidebar.tsx`
  - Confirmacao de rolagem das ferramentas no desktop.

- `apps/web/public/manifest.webmanifest`
  - Manifest PWA principal.

- `apps/web/public/manifest.json`
  - Manifest alternativo/compatibilidade.

- `apps/web/public/sw.js`
  - Offline basico para navegacao, cache shell e fallback seguro.

- `apps/web/public/offline.html`
  - Pagina offline estatica.

- `apps/web/app/dashboard/DashboardHome.tsx`
- `apps/web/app/crm/CrmBoard.tsx`
- `apps/web/app/calendar/CalendarClient.tsx`
- `apps/web/app/reports/ReportsClient.tsx`
- `apps/web/app/inbox/InboxClient.tsx`
- `apps/web/app/settings/SettingsClient.tsx`
- `apps/web/app/admin/AdminClient.tsx`
  - Auditoria responsiva; ajustes pontuais somente se necessario.

## Componentes impactados

- `AppShell`
- `Header`
- `MobileNav`
- `Sidebar`
- Cards e tabelas com classes globais responsivas
- Layouts de formulario e modais/drawers

## Rotas impactadas

- `/dashboard`
- `/crm`
- `/calendario`
- `/calendar`
- `/reports`
- `/inbox`
- `/settings`
- `/admin`

## Recursos PWA impactados

- `manifest.webmanifest`
- `manifest.json`
- `sw.js`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `apple-touch-icon.png`
- `favicon-*`
- Novo fallback `/offline.html`

## Achados antes da execucao

- Manifest ja existe e aponta para `/login?source=pwa`.
- Service worker ja existe, mas o fallback offline retorna `/`, que pode ser inadequado para navegacao autenticada/offline.
- Botao de instalacao existe no `Header`, porem o menu mobile inferior nao expoe claramente instalacao/sair dentro do drawer.
- O shell desktop ja possui sidebar rolavel.
- Ajustes devem focar em responsividade, areas seguras, tables/cards/forms e suporte offline basico sem alterar contratos de API.

## Validacoes planejadas

- `apps/web`: `npm run lint`
- `apps/web`: `npm run build`
- `apps/api`: `npm run build`
- Teste mobile automatizado em 375px, 390px, 414px, 768px e 1024px sobre rotas criticas.
