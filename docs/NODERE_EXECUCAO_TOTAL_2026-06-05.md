# NODERE - Execucao Total: estabilizacao aplicada em 2026-06-05

## Escopo executado agora

Esta rodada focou nos bloqueadores tecnicos do arquivo `CODEX_NODERE_EXECUCAO_TOTAL.md` que poderiam quebrar producao, seguranca ou experiencia basica. Nao foram adicionados dados fake, chaves reais ou chamadas diretas a APIs sensiveis pelo frontend.

## Correcoes aplicadas

- Autenticacao/middleware: o service worker `/sw.js` foi liberado como rota publica, mantendo rotas internas protegidas pelo cookie `nodere_session`.
- PWA e identidade: metadados do app foram reforcados com favicon PNG, apple icon e suporte `mobile-web-app-capable`, reaproveitando os ativos NODERE ja existentes.
- Deploy Vercel: o workflow de producao agora injeta `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no build, evitando build sem cliente Supabase publico.
- PDF NODERE: propostas/contratos gerados pela API passaram a embutir o logo NODERE como data URI local, com fallback SVG inline se o arquivo nao estiver disponivel. Isso evita PDF sem logo quando o dominio publico falhar.
- Sidebar: removido texto global de "scanner" no rodape, mantendo comunicacao institucional segura e adequada a todo o sistema.
- Botoes principais: criadas classes globais `btn-primary` e `btn-secondary` com cores solidas, contraste melhor e estados de foco/desabilitado. Aplicadas nas acoes criticas da lista de empresas.
- Lint automatizavel: o lint de web e API ficou nao interativo via typecheck, permitindo CI/CD sem prompt manual.

## Itens ja preservados

- Backend padrao: `https://nodere-api.onrender.com`.
- Persistencia Supabase existente.
- Busca Google Places via backend.
- PageSpeed via backend.
- OpenAI via backend.
- CRM com fallback local e persistencia remota quando autenticado/configurado.
- Configuracoes e status de integracoes.
- Manual existente em `docs/manual-nodere.md`.

## Testes executados

### Local/build

- `npm run lint` em `apps/web`: aprovado.
- `npm run lint` em `apps/api`: aprovado.
- `npm run build` em `apps/web`: aprovado.
- `npm run build` em `apps/api`: aprovado.

### Producao/HTTP

- `https://nodere.com.br/`: HTTP 200.
- `https://nodere.com.br/login`: HTTP 200.
- `https://nodere.com.br/manifest.json`: HTTP 200.
- `https://nodere.com.br/searches`: HTTP 200.
- `https://nodere.com.br/dashboard`: HTTP 200.
- `https://nodere-api.onrender.com/api/health`: HTTP 200.
- `https://nodere-api.onrender.com/api/settings`: HTTP 200.
- `https://nodere-api.onrender.com/api/places/search?segment=academia&city=Caxias%20do%20Sul&state=RS&limit=3`: HTTP 200.

## Pendencias externas ou dependentes de credenciais/plano

- Apollo.io: se a API retornar 403, a causa esperada e plano/permissao do endpoint no Apollo. O sistema deve manter erro claro e nao inventar decisores.
- Econodata: depende de `ECONODATA_API_URL` e `ECONODATA_API_KEY` reais no backend.
- Stripe billing: depende de chaves Stripe, produtos/precos e webhooks em producao.
- Push notifications: depende de VAPID keys e permissao do navegador do usuario.
- Google Ads/Google Business Profile: dependem de OAuth e permissoes da conta Google.
- SMTP/email real: depende de provedor e credenciais; o sistema nao deve simular envio.
- Validacao PWA em Android/iPhone fisicos deve ser feita no dispositivo final, embora manifest e assets estejam publicados.

## Observacao de seguranca

Nenhuma chave real deve ser colocada no frontend ou neste repositorio. Variaveis publicas do Supabase no frontend sao aceitaveis apenas como `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`; chaves service-role, OpenAI, Google, Apollo, Econodata e Stripe devem ficar somente no backend/provedor de deploy.
