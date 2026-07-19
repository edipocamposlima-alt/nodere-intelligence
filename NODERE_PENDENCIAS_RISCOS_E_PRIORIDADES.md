# NODERE - Pendencias, Riscos e Prioridades

Data: 2026-07-17
Branch: `main`
Commit: `66db603ae9e4463e7c25e9ede83ab59f176f31d0`

## 1. Criterios usados

Estados:
- CONFIRMADO E FUNCIONAL
- CONFIRMADO COM FALHA
- PARCIALMENTE IMPLEMENTADO
- NAO IMPLEMENTADO
- NAO VALIDADO
- BLOQUEADO POR ACESSO
- DOCUMENTADO, MAS NAO LOCALIZADO NO CODIGO

Esta lista prioriza continuidade segura. Nao significa que o modulo esteja quebrado; significa que precisa validacao ou saneamento antes de evoluir.

## 2. Riscos criticos

### R1 - Producao nao validada ao vivo nesta auditoria

Estado: BLOQUEADO POR ACESSO / NAO VALIDADO.

Descricao:
O codigo local foi inspecionado, mas nao houve consulta autenticada aos paineis Vercel, Render e Supabase nem smoke test real com usuario.

Impacto:
Nao e possivel garantir, a partir desta etapa, que o commit `66db603` e o implantado em todos os ambientes.

Prioridade: P0.

Acao recomendada:
Validar Vercel, Render, health checks, commit publicado e login real antes de novas publicacoes.

### R2 - Banco vivo nao introspectado

Estado: NAO VALIDADO.

Descricao:
Schemas e migrations existem localmente, mas a estrutura atual no Supabase nao foi consultada nesta etapa.

Impacto:
Novas mudancas podem divergir de constraints, RLS, colunas ou policies reais.

Prioridade: P0.

Acao recomendada:
Rodar validadores de schema com credenciais em memoria e documentar objetos reais.

### R3 - Camada legada ainda presente

Estado: CONFIRMADO NO CODIGO.

Descricao:
`app.js`, `serve-nodere.mjs`, `backend/` e root build continuam no repositorio.

Impacto:
Risco de alterar/deployar caminho errado ou confundir versoes.

Prioridade: P1.

Acao recomendada:
Manter como legado preservado ate plano formal de aposentadoria; nao apagar sem aprovacao.

### R4 - Fallbacks/memoria/mock

Estado: CONFIRMADO NO CODIGO.

Descricao:
Existem fallbacks de memoria em `companyStore`, `userStore`, `onboardingStore`, roles admin e mock de busca quando `USE_MOCK_DATA=true`.

Impacto:
Podem mascarar falhas em desenvolvimento; em producao devem estar controlados para nao perder dados.

Prioridade: P1.

Acao recomendada:
Criar matriz por fallback, com condicoes de ativacao e prova de que nao opera em producao para dados comerciais reais.

### R5 - Rotas duplicadas/aliases historicos

Estado: CONFIRMADO NO CODIGO.

Descricao:
Existem aliases em portugues/ingles e `app/*`, como `/dashboard` e `/app/dashboard`.

Impacto:
Risco de corrigir a rota errada ou deixar componente morto governando producao.

Prioridade: P1.

Acao recomendada:
Em qualquer mudanca visual, testar rota canonica e aliases relacionados.

### R6 - CORS flexivel para `.vercel.app`

Estado: CONFIRMADO NO CODIGO.

Descricao:
API aceita qualquer origin terminado em `.vercel.app`.

Impacto:
Facilita previews, mas amplia superficie de origem em producao.

Prioridade: P2.

Acao recomendada:
Avaliar whitelist por projeto Vercel quando o fluxo de preview estiver estabilizado.

## 3. Pendencias por modulo

### Autenticacao e usuarios

Estado: PARCIALMENTE IMPLEMENTADO.

Pendencias:
- Validar login owner/admin/operator/viewer em producao.
- Confirmar `auth_user_id` em `nodere_platform_users`.
- Confirmar refresh/logout e cookies.
- Confirmar que `/api/auth/me` retorna usuario correto.

Prioridade: P0.

### Dashboard e navegacao

Estado: PARCIALMENTE IMPLEMENTADO.

Pendencias:
- Validar `/dashboard` e `/app/dashboard` em producao.
- Confirmar menu lateral e mobile sem abas removidas.
- Confirmar contadores reais.
- Confirmar tema claro/escuro e zoom.

Prioridade: P1.

### Ficha 360

Estado: PARCIALMENTE IMPLEMENTADO.

Pendencias:
- Validar abertura com empresa real.
- Validar fallback quando dados parciais.
- Validar PDF da ficha.
- Confirmar nenhuma chamada 404 com recurso valido.

Prioridade: P0/P1 pelo historico recente de erro.

### Catalogo e propostas

Estado: PARCIALMENTE IMPLEMENTADO.

Pendencias:
- Validar SQL comercial aplicado.
- Validar owner/admin cria/edita/inativa.
- Validar operator/viewer bloqueados para mutacao.
- Validar proposta com item ativo e bloqueio de item manual.
- Validar desconto percentual/valor, motivo, snapshot, auditoria e PDF.

Prioridade: P0.

### PDFs/exportacoes

Estado: PARCIALMENTE IMPLEMENTADO.

Pendencias:
- Validar PDF autenticado para ficha, propostas, contratos, relatorios, discovery/IA.
- Confirmar headers Authorization/cookies.
- Confirmar PDF nao expõe observacoes internas.
- Confirmar CSV com encoding/campos completos.

Prioridade: P1.

### Tema, icones, editores e responsividade

Estado: PARCIALMENTE IMPLEMENTADO.

Pendencias:
- Validar modo claro realmente claro e escuro preservado.
- Validar icones em zoom 33%, 50%, 100%, 150%.
- Validar editores ricos em observacoes/marketing/propostas/manual.
- Validar mobile 375px.

Prioridade: P1.

### Integracoes

Estado: NAO VALIDADO.

Pendencias:
- OpenAI/Anthropic real.
- Google Places/Maps/PageSpeed.
- WhatsApp Cloud webhook.
- Stripe checkout/webhook.
- SMTP.
- Push.
- Social/Marketing.
- Apollo/Econodata/ReceitaWS.

Prioridade: P1/P2 conforme modulo afetado.

### Admin/CMS/Manual

Estado: PARCIALMENTE IMPLEMENTADO.

Pendencias:
- Validar CMS public read/admin mutation.
- Manter regra permanente de atualizar Manual NODERE em toda entrega.
- Validar busca/navegacao do manual.

Prioridade: P1.

## 4. Melhorias tecnicas recomendadas

1. Criar mapa automatico de rotas e endpoints versionado.
2. Criar teste e2e minimo autenticado para:
   - login;
   - dashboard;
   - empresas;
   - ficha;
   - catalogo;
   - proposta/PDF.
3. Criar script de auditoria de secrets que liste nomes e bloqueie valores.
4. Consolidar aliases em documento oficial de rotas canonicas.
5. Criar matriz de fallbacks permitidos por ambiente.
6. Validar CORS por ambiente.
7. Criar runbook de incidentes: auth, Supabase, Render, Vercel, PDF, Google, WhatsApp.
8. Criar migrador/verificador de schema unico com dry-run.
9. Registrar snapshots visuais de tema claro/escuro/mobile.
10. Adicionar checagem CI para rootDir Vercel e Render service correto.

## 5. Ordem recomendada para proximas acoes

P0:
1. Confirmar producao: commit Vercel, commit Render, health checks.
2. Validar login real owner/admin.
3. Validar Supabase schema/RLS.
4. Validar catalogo/propostas/PDF se a proxima tarefa for comercial.
5. Validar Ficha 360 se a proxima tarefa envolver empresas/leads.

P1:
1. Executar smoke visual mobile/desktop.
2. Validar tema/icone/editor.
3. Consolidar documentacao Manual NODERE.
4. Revisar fallbacks/mocks por ambiente.

P2:
1. Melhorar monitoramento.
2. Aperfeicoar CORS por preview/producao.
3. Reduzir duplicidade de rotas com redirects documentados.
4. Planejar aposentadoria do legado.

## 6. Itens bloqueados por acesso nesta etapa

- Vercel project/root directory real.
- Deployments Vercel e commit atual publicado.
- Render service env real e commit atual.
- Logs Render/Vercel.
- Supabase schema vivo.
- Supabase Auth users reais.
- Secrets/variaveis em paineis.
- Smoke test autenticado.

## 7. Itens que nao devem ser alterados sem autorizacao

- SQL em producao.
- Variaveis de ambiente/segredos.
- RLS/policies.
- Service role Supabase.
- Dominios/DNS.
- Webhooks Stripe/WhatsApp.
- Rotas publicas de auth.
- Camada legada ate existir plano formal.
- `nodere-site-premium/`.
