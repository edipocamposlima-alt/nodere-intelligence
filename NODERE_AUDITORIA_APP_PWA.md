# NODERE — Auditoria do App/PWA

Data: 2026-07-18

## Parecer

O NODERE atende aos requisitos locais básicos de instalação e responsividade verificados, e recebeu uma correção essencial: dados e páginas autenticadas não são mais candidatos a cache offline. O PWA é apto para instalação como invólucro seguro da aplicação online; ele não deve ser apresentado como solução offline para o CRM.

## Manifest

- `name`/`short_name` coerentes com NODERE;
- `display` adequado para instalação;
- `id` definido como `/` para identidade estável;
- orientação `any`, permitindo desktop, tablet e celular;
- arquivos `manifest.json` e `manifest.webmanifest` sincronizados.

## Service worker

Política depois da auditoria:

1. precache somente da shell pública/offline;
2. navegações usam network-only;
3. se a navegação falhar, retornar apenas a página offline;
4. recursos estáticos públicos podem usar cache runtime;
5. Dashboard, CRM, Ficha e respostas privadas não são armazenados;
6. caches anteriores são removidos durante `activate`.

Versão do cache auditada: `v5`.

## Mobile e interação

- viewport mobile presente;
- menus e conteúdo usam dimensões dinâmicas;
- Kanban mantém colunas utilizáveis por rolagem horizontal e snap;
- modais/drawers devem continuar roláveis em altura curta;
- `prefers-reduced-motion` é respeitado;
- foco de teclado foi reforçado.

Os testes de browser passaram em viewport Pixel 5 para redirecionamento sem sessão e sessão inválida. Fluxos internos ainda dependem da conta E2E exclusiva.

## Segurança e privacidade

O service worker não substitui o controle de acesso. Mesmo recursos não cacheados devem ser protegidos pelo backend. O ganho desta rodada é eliminar a persistência involuntária no Cache Storage e evitar que uma resposta antiga seja mostrada quando a sessão já expirou.

O logout deve continuar limpando a sessão; a ativação do novo service worker remove caches legados. Em dispositivo compartilhado, o usuário deve sair e fechar o app.

## Resultado automatizado

`apps/web/scripts/validate-mobile-pwa.mjs`: **21/21 aprovado**, incluindo proxy same-origin e ausência de token persistente.

## Pendências

- Lighthouse instalado/produção com conta de teste;
- validação de ícones e splash em iOS/Android físicos;
- teste de atualização do service worker entre duas versões publicadas;
- telemetria de falhas de instalação;
- política documentada de expiração dos poucos recursos públicos cacheados.

## Referência de produto

O comportamento segue a orientação do web.dev: instalação exige manifest/HTTPS e a experiência offline precisa ser deliberada. Para um CRM com dados pessoais e comerciais, o modo seguro é shell/offline informativa, não cache de conteúdo autenticado.
