# NODERE — Resultados de Testes e Evidências

Data de execução: 2026-07-18
Ambiente local: Windows, Node.js 24.16, npm 11.13, Chromium Playwright

## Resumo

| Grupo | Aprovados | Falhas | Ignorados |
|---|---:|---:|---:|
| Testes API | 33 | 0 | 0 |
| Testes E2E públicos/de segurança | 4 | 0 | 2 autenticados |
| Validador PWA | 19 | 0 | 0 |
| Typechecks/builds | 4 grupos | 0 | 0 |
| Auditorias npm | 2 workspaces com 0 alertas | 0 | 0 |

## API

Passaram 33 testes:

- segurança: 11;
- calendário: 5;
- relatórios: 4;
- CRM: 2;
- WhatsApp: 5;
- descoberta/IA: 2;
- importação segura: 4.

O teste de relatórios que antes dependia de `Date.now()` agora recebe uma data de referência, eliminando falha futura por janela móvel. Os testes de importação cobrem CSV, XLSX moderno e rejeição explícita do XLS legado.

## Web e build

- typecheck do frontend: aprovado;
- typecheck e build do backend: aprovados;
- check e build pela raiz: aprovados;
- build Next.js de produção: aprovado em aproximadamente 67 segundos;
- 62 páginas App Router compiladas.

Rotas com First Load JS ainda elevado no build observado:

- Ficha/lead e empresa: aproximadamente 471 kB;
- Empresas: aproximadamente 390 kB;
- Marketing: aproximadamente 329 kB;
- Calendário: aproximadamente 324 kB;
- CRM: aproximadamente 275 kB;
- Buscas: aproximadamente 262 kB;
- Relatórios: aproximadamente 231 kB.

Esses valores são baseline de otimização e não falha de compilação.

## Navegador

Com servidor local em `127.0.0.1:3100`:

- Chromium desktop sem sessão redirecionou ao login;
- Pixel 5 sem sessão redirecionou ao login;
- token inválido em desktop não exibiu conteúdo privado;
- token inválido em Pixel 5 não exibiu conteúdo privado;
- POST de token inválido em `/api/auth/session` retornou 401;
- login local carregou sem overlay do Next.js e com layout legível.

Os cenários autenticados foram marcados como ignorados porque `NODERE_E2E_EMAIL` e `NODERE_E2E_PASSWORD` não existem. Nenhuma credencial pessoal foi reutilizada ou gravada.

## PWA

O validador registrou 19/19. Entre as condições verificadas:

- manifest válido com `id` e orientação apropriados;
- viewport e regras mobile presentes;
- service worker versionado;
- navegação usa rede e fallback offline;
- precache não contém Dashboard;
- cache runtime limitado a recursos públicos/estáticos;
- caches antigos removidos na ativação.

## Dependências

Depois da remoção de `xlsx`, atualização de Nodemailer e overrides corretivos de PostCSS/UUID:

- `apps/web`: 0 vulnerabilidades no `npm audit`;
- `apps/api`: 0 vulnerabilidades no `npm audit`.

“0” significa ausência de alertas conhecidos no banco consultado nessa data; não é garantia de ausência absoluta de vulnerabilidade futura.

## Produção no início da auditoria

A API Render respondeu 200 em `/health`, `/api/health` e `/api/health/version`. Reportou versão 1.0.1, ambiente de produção, Supabase conectado, OpenAI saudável, Anthropic indisponível e o commit de baseline `66db603ae9e4463e7c25e9ede83ab59f176f31d0`.

A evidência pós-deploy será registrada em `NODERE_DEPLOY_E_VALIDACAO_PRODUCAO.md`.
