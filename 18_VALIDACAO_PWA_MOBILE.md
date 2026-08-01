# 18 — Validação PWA e mobile

O service worker, manifest e instalabilidade existentes foram preservados. A navegação inferior agora prioriza NODERE AI, Dashboard, Prospecção e CRM; Empresas permanece no drawer. O chat usa `100dvh`, input no rodapé, áreas roláveis internas e bloqueio de overflow horizontal.

Os dois manifests agora usam `/ai?source=pwa` e oferecem atalho NODERE AI; Dashboard continua como módulo. `npm run test:mobile-pwa` passou 25 verificações de manifest, ícones, standalone, offline, exclusão de APIs/páginas autenticadas do cache, breakpoints, safe area, navegação e ausência de token em localStorage.

O Playwright passou redirecionamento e sessão inválida em Desktop Chrome e Pixel 5. Continuam pendentes: inspeção autenticada em 320/375/768/1024 px, teclado virtual, iOS real e atualização do service worker após preview.
