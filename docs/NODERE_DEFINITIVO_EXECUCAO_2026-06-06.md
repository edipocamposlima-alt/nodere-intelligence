# NODERE - Execucao do CODEX_NODERE_DEFINITIVO em 2026-06-06

## Resumo executivo

Esta execucao tratou os bloqueadores tecnicos do comando definitivo que podiam ser corrigidos com seguranca no codigo atual, sem expor segredos, sem criar dados fake e sem quebrar as integracoes ja validadas. O roadmap enterprise completo contem itens que dependem de credenciais, planos comerciais ou APIs oficiais de terceiros; esses itens ficaram documentados como pendencias externas e o sistema mantem comportamento degradado/explicativo quando a variavel ou permissao nao existe.

## Correcoes aplicadas

- PWA: `nodere-logo-192.png` e `nodere-logo-512.png` foram regenerados nas dimensoes reais 192x192 e 512x512, reduzindo peso e corrigindo instalacao com icone NODERE.
- Supabase frontend: criado `assertSupabaseAuthConfig()` em `apps/web/lib/supabaseAuthRest.ts`. Em producao no navegador, a ausencia de `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` gera erro claro em portugues.
- Ficha do cliente: o campo principal deixou de aparecer como `Empresa` e passou para `Nome fantasia`; o campo `Segmento` permanece separado para evitar perda semantica dos dados.
- LinkedIn: as buscas sugeridas usam somente o nome da empresa. Chamadas que passavam cidade/site foram ajustadas, e o manual foi atualizado para remover referencia a dominio.
- Links externos: links dinamicos de LinkedIn na ficha receberam `rel="noopener noreferrer"`.
- Botoes: adicionadas classes `btn-action` e `btn-secondary-action` com cores solidas e melhor contraste, preservando `btn-primary`/`btn-secondary` existentes.
- SQL/RLS: criado `apps/api/src/db/rls_policies.sql` com `CREATE TABLE IF NOT EXISTS`, indexes, `ENABLE ROW LEVEL SECURITY` e policies idempotentes para `nodere_companies`, `nodere_company_notes` e `nodere_app_settings`, sem `DROP TABLE` ou `DROP COLUMN`.
- Variaveis: `.env.example` recebeu placeholders adicionais para Google Business, OneDrive, Dropbox, Canva, WhatsApp Access Token e SMTP_FROM sem valores reais.

## Arquivos criados

- `apps/api/src/db/rls_policies.sql`: policies RLS complementares para persistencia multi-tenant.
- `docs/NODERE_DEFINITIVO_EXECUCAO_2026-06-06.md`: este relatorio tecnico.

## Arquivos modificados

- `.env.example`: placeholders adicionais sem segredos.
- `apps/web/lib/supabaseAuthRest.ts`: validacao clara de variaveis Supabase publicas no runtime.
- `apps/web/app/companies/[id]/LeadOperations.tsx`: LinkedIn somente por nome, label `Nome fantasia`, links externos seguros e botoes de acao solidos.
- `apps/web/app/companies/[id]/page.tsx`: LinkedIn somente por nome.
- `apps/web/app/globals.css`: classes `btn-action` e `btn-secondary-action`.
- `apps/web/app/manual/page.tsx`: manual corrigido para LinkedIn sem dominio.
- `apps/web/public/nodere-logo-192.png`: regenerado 192x192.
- `apps/web/public/nodere-logo-512.png`: regenerado 512x512.

## Testes executados

- `npm run lint` em `apps/web`: PASSOU.
- `npm run lint` em `apps/api`: PASSOU.
- `npm run build` em `apps/api`: PASSOU.
- `npm run build` em `apps/web`: PASSOU apos ajustar a validacao Supabase para runtime do navegador.
- Validacao de icones PWA: `nodere-logo-192.png` = 192x192; `nodere-logo-512.png` = 512x512.


## Testes HTTP de producao

- `https://nodere.com.br/`: HTTP 200.
- `https://nodere.com.br/login`: HTTP 200.
- `https://nodere.com.br/manifest.json`: HTTP 200.
- `https://nodere.com.br/dashboard`: HTTP 200.
- `https://nodere.com.br/searches`: HTTP 200.
- `https://nodere.com.br/companies`: HTTP 200.
- `https://nodere.com.br/manual`: HTTP 200.
- `https://nodere-api.onrender.com/api/health`: HTTP 200.
- `https://nodere-api.onrender.com/api/settings`: HTTP 200.
- `https://nodere-api.onrender.com/api/companies`: HTTP 200.
- `https://nodere-api.onrender.com/api/places/search?segment=academia&city=Caxias%20do%20Sul&state=RS&limit=3`: HTTP 200.
## Pendencias externas que nao devem ser mascaradas

- Apollo.io: endpoints de pessoas/organizacoes podem retornar 403 quando o plano/API nao permite. O NODERE deve exibir erro claro e nao inventar decisores.
- LinkedIn API oficial: automacao real depende de credenciais e aprovacao da API LinkedIn. Sem isso, o sistema abre busca web assistida.
- Econodata: depende de `ECONODATA_API_URL` e `ECONODATA_API_KEY` oficiais.
- Google Ads e Google Business Profile: dependem de OAuth, consentimento e permissoes da conta.
- Bling/RD Station/social OAuth/Drive/OneDrive/Dropbox/Canva: dependem de credenciais e callbacks configurados nos provedores.
- Stripe billing: depende de chaves, produtos/precos e webhooks reais.
- Push notifications: depende de VAPID keys e permissao do navegador.
- Teste PWA em iPhone/Android fisico ainda precisa ser validado no dispositivo final.
- Editor rico global com Tiptap/React Quill em todos os campos e todos os modulos enterprise do TXT continuam sendo um bloco grande de produto; deve ser executado incrementalmente para nao quebrar o SaaS ja em producao.

## SQL a aplicar no Supabase

Aplicar `apps/api/src/db/rls_policies.sql` no Supabase SQL Editor quando houver erro de INSERT/RLS nas tabelas:

- `nodere_companies`
- `nodere_company_notes`
- `nodere_app_settings`

O arquivo e idempotente e pode ser reexecutado. Nao remove tabelas nem colunas.

## Observacoes de seguranca

Nenhuma chave real foi adicionada ao repositorio. Variaveis sensiveis devem ficar somente no Render, Vercel, Supabase ou provedor adequado. Chaves OpenAI, Google, Apollo, Econodata, Stripe e tokens sociais nunca devem ir para frontend ou GitHub.


## Bloco complementar - Busca externa Apollo/LinkedIn

- Mantida a busca principal via Google Places sem alterar endpoints existentes.
- Adicionado endpoint backend `POST /api/searches/apollo` para busca real de empresas ou pessoas no Apollo.io usando `APOLLO_API_KEY` somente no backend.
- Adicionada aba operacional em `Buscas` com:
  - Apollo.io: busca por empresa, dominio, decisor, cargo, cidade, estado e pais.
  - LinkedIn: abertura de buscas oficiais por nome/contexto, sem scraping e sem links genericos incorretos.
- Adicionado campo `Segmento manual` na busca principal. Segmentos digitados ficam salvos no navegador para reaproveitamento sem substituir a lista padrao.
- Se Apollo retornar 401/403/429, o frontend mostra erro claro. Nao ha fallback fake nem dados inventados.

Pendencias externas:

- Apollo.io precisa liberar o endpoint de empresas/pessoas para a chave configurada. HTTP 403 indica plano, escopo ou politica da conta.
- LinkedIn automatico depende de API/produto oficial aprovado pelo LinkedIn. Ate la o sistema abre buscas oficiais pelo navegador.
