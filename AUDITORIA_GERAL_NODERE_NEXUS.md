# AUDITORIA GERAL NODERE

Data da auditoria: 22/06/2026  
Escopo: código local, `origin/main`, Vercel, API Render e testes não destrutivos em produção  
Produção: <https://nodere.com.br>  
API: <https://nodere-api.onrender.com/api>  

## Legenda

- ✅ Concluído: comprovado por build, resposta de produção ou inspeção direta.
- ⚠️ Parcialmente concluído: existe implementação, mas há falha, dependência externa ou homologação incompleta.
- ❌ Não executado/não operacional: ausente ou comprovadamente indisponível.
- 🔍 Pendente de validação: não foi possível comprovar sem alterar dados, enviar mensagens, cobrar ou acessar o SQL Editor/logs privados.

## Evidências e limites

- Builds locais executados em 22/06/2026: API ✅, lint Web ✅ e build Web ✅.
- O build Web reconheceu 58 rotas.
- Login real do administrador foi validado via Supabase Auth, sem registrar a senha no relatório.
- Foram feitos apenas GETs e operações sem efeito persistente. Não foram criados leads, cobranças, mensagens, e-mails ou registros de produção.
- O schema real, RLS, triggers e buckets não puderam ser enumerados diretamente: o OpenAPI anon foi bloqueado e não foi usado `service_role` fora do backend.
- Logs Vercel das últimas 24h: nenhum evento disponível. Logs privados do Render não estavam acessíveis nesta sessão.
- Mobile e temas foram auditados por código e assets. A homologação visual autenticada nos viewports 375/390/414/768 permanece pendente.

# 1. Resumo Executivo

O NODERE possui uma base funcional relevante: autenticação Supabase, busca Google Places, CRM com 595 empresas/leads acessíveis, dashboard, relatórios de API, calendário, catálogo, operadores, configurações, propostas PDF por lead e PWA básica. O site público, login e cadastro respondem em produção e a marca visível principal está como `NODERE`.

O estado não pode ser considerado integralmente homologado. Há quatro riscos críticos:

1. **Código local divergente da produção:** 37 arquivos modificados e 13 caminhos novos não foram commitados/publicados. O CMS e a correção de sessão segura existem apenas localmente.
2. **Autorização por perfil incompleta:** várias mutações de CRM, companies, marketing, inbox, sequências, créditos e IA exigem sessão, mas não restringem `viewer`.
3. **Schema fragmentado:** há SQLs incrementais NODERE e, em paralelo, schemas legados que criam `users`, `companies`, `workspaces` e `workspace_members`. Uma rotina ativa ainda escreve em `workspaces`.
4. **Módulos com falha real em produção:** communications, contracts, files, audit/intelligence da empresa, proposals, inbox, marketing e roles retornaram 404/500.

Estado geral estimado:

| Área | Status | Evidência principal |
|---|---|---|
| Site público/SEO básico | ⚠️ | Home/login/register 200 e branding correto; `robots.txt` e `sitemap.xml` 404 |
| Autenticação | ⚠️ | Login real funciona; produção ainda usa token Supabase bruto e pode expirar antes do cookie |
| CRM/listagem/ficha base | ⚠️ | 595 registros e detalhe 200; submódulos da ficha têm 404/500 |
| Discovery | ⚠️ | Google Places e website scan 200; PageSpeed/GBP ausentes; add-to-CRM não testado |
| Relatórios | ⚠️ | APIs 200; UI já apresentou timeout e filtros completos não foram homologados |
| CMS | ❌ produção / ⚠️ local | Código/SQL local; `/api/content` em produção retorna 401 pelo fallback |
| Billing | ⚠️ | Planos 200; Stripe não configurado; contrato de autenticação inconsistente |
| WhatsApp/Inbox | ❌ operacional | Cloud API ausente, inbox 500 e webhook principal apenas confirma recebimento |
| PWA | ⚠️ | Manifest/SW/assets 200; ícone auxiliar tem fundo opaco; instalação mobile não homologada |
| Segurança por workspace | ⚠️ | Rotas sem sessão retornam 401; autorização fina por perfil está incompleta |

# 2. Funcionalidades Concluídas

| Funcionalidade | Data aproximada | Arquivos/áreas | Evidência |
|---|---:|---|---|
| Build API | 22/06 | `apps/api` | `npm run build` passou |
| Lint e build Web | 22/06 | `apps/web` | lint e build passaram; 58 rotas |
| Health API | 12-22/06 | `apps/api/src/server.ts` | `/api/health` e `/api/health/supabase` 200 |
| Proteção global sem sessão | 12-18/06 | `server.ts`, middleware | companies, CRM, Discovery e Calendar retornam 401 sem token |
| Login Supabase Auth | 18/06 | `LoginClient.tsx`, middleware | credencial real autenticou e token acessou rotas protegidas |
| Workspace/administrador | 18/06 | admin/session/userStore | usuário reconhecido como `owner`, workspace `default` |
| Google Places | 17-22/06 | Discovery/Google services | busca real retornou 200, fonte `google` |
| Website scanner | 17-22/06 | Discovery | scan de `nodere.com.br` retornou 200 |
| CRM listagem e detalhe base | 17-22/06 | CRM/companies/leads | 595 registros; lista, detalhe, contatos, atividades e tarefas 200 |
| PDF de proposta por lead | 17-22/06 | CRM/report/PDF | 200, `application/pdf`, 40.738 bytes |
| Dashboard API | 17-22/06 | dashboard service/routes | 200 autenticado |
| Relatórios de API | 18-22/06 | reports route/service | summary, funnel, forecast e operators 200 |
| Calendário leitura | 11-22/06 | calendar route/UI | 200 autenticado; lista vazia |
| Catálogo leitura | 11-22/06 | catalog route/UI | 200 autenticado |
| Operadores e ranking | 11-22/06 | operators | 200 autenticado |
| Configurações protegidas | 11-22/06 | settings | integrações retornaram apenas dados mascarados; sem `value` real |
| Branding público principal | 17-22/06 | Logo, metadata, páginas | títulos e HTML público sem `Nexus/Intelligence/Noderi` visível |
| Manifest e service worker | 17-22/06 | public/manifest, `sw.js`, PwaRegister | manifest, SW e ícones principais 200 |

# 3. Funcionalidades Parciais

| Funcionalidade | Data aproximada | Arquivos envolvidos | Problema/impacto | Próximo passo |
|---|---:|---|---|---|
| Sessão persistente | 18-22/06 | `LoginClient.tsx`, `adminSession.ts`, middleware | produção armazena token Supabase bruto em cookie de 7 dias; JWT expira antes | publicar e homologar o exchange local para token NODERE ou implementar refresh seguro |
| Ficha 360 | 17-22/06 | companies, LeadOperations, LeadDrawer | base abre, mas communications/contracts/files/audit/intelligence falham | alinhar SQL real e respostas controladas; testar todos os tabs |
| Histórico/contatos/negociações | 18-22/06 | `LeadDrawer.tsx`, `leads.ts`, RichTextEditor | implementação ampliada existe localmente, não em produção | aplicar SQL necessário, publicar e homologar CRUD |
| Kanban/drag and drop | 17-18/06 | CRM components/routes | código existe; mutação não foi executada para não alterar produção | homologar com registro descartável e perfis owner/operator/viewer |
| Import/export CSV | 11-18/06 | companies/CRM | rotas e UI existem; não testadas nesta auditoria | teste controlado com arquivo pequeno e confirmação de deduplicação |
| PDF de empresa | 17-22/06 | companies export | responde 200, mas `Content-Type` é `text/html`, não PDF | corrigir contrato ou renomear como impressão HTML |
| Relatórios UI | 18-22/06 | `ReportsClient.tsx`, reports API | endpoints respondem; UI tem timeout de 20s e relato de falha | medir waterfall autenticado e remover chamadas duplicadas/lentas |
| OpenAI | 16-22/06 | AI services/routes/settings | configurado e health OK; geração não invocada por custo | homologar com limite de tokens e conferir `nodere_ai_usage_log` |
| Apollo | 17-22/06 | searches/integration status | configurado; permissões/quota da conta não testadas | busca controlada e validação de resposta real |
| Calendar | 11-22/06 | calendar/UI/SQL bloco 08 | leitura 200; CRUD, recorrência e notificações não homologados | teste funcional por perfil |
| Propostas | 17-22/06 | proposals route/UI/SQL | template e PDF CRM funcionam; `/api/proposals` retorna 500 | verificar `nodere_proposals` e `proposal_versions` no schema real |
| PWA | 17-22/06 | manifest, SW, Header | base instalável implementada; instalação real não validada | Lighthouse/Chrome Android e iOS; corrigir asset opaco |
| Tema claro/escuro | 17-22/06 | Logo, ThemeProvider, Topbar, globals.css | CSS amplo; chaves `nodere-theme` e `nodere_theme` divergem | unificar persistência e homologar todas as rotas em ambos os temas |
| Admin de usuários | 16-22/06 | admin routes/UI | usuário owner listado; `/api/admin/roles` retorna 500 | corrigir tabela/consulta `custom_roles` e validar CRUD sem afetar Auth |
| SMTP | 11-22/06 | config, contact, settings test | suporte a `SMTP_PASS/SMTP_PASSWORD`; configuração real não comprovada | validar env no Render e enviar e-mail real autorizado |

# 4. Funcionalidades Não Executadas

- ❌ CMS administrativo em produção: código e SQL existem somente no worktree local.
- ❌ Stripe real: webhook retorna `stripe_not_configured`; checkout/portal/renovações não homologados.
- ❌ WhatsApp Cloud API: token e phone number ausentes; envio, anexos e histórico real indisponíveis.
- ❌ Google PageSpeed: `GOOGLE_PAGESPEED_API_KEY` ausente.
- ❌ Google Business Profile: OAuth ausente.
- ❌ Redes sociais: Meta, TikTok, LinkedIn, Pinterest e Google Business não configurados.
- ❌ Bling e RD Station não configurados.
- ❌ `robots.txt` e `sitemap.xml`: 404 em produção.
- ❌ Teste real de e-mail SMTP não executado para evitar envio sem autorização explícita.
- ❌ Upgrade, downgrade, cancelamento e renovação Stripe não executados.
- ❌ Homologação visual autenticada 375/390/414/768 não executada nesta sessão.
- ❌ Teste real com usuário `viewer` não executado por ausência de credencial de viewer.

# 5. Falhas Encontradas

| Endpoint/área | Resultado | Impacto |
|---|---:|---|
| `/api/companies/:id/communications` | 500 | histórico de comunicações indisponível |
| `/api/companies/:id/contracts` | 500 | contratos da ficha indisponíveis |
| `/api/companies/:id/files` | 500 | anexos indisponíveis |
| `/api/companies/:id/audit` | 404 | auditoria da empresa não carrega |
| `/api/companies/:id/intelligence` | 404 | inteligência da empresa não carrega |
| `/api/proposals` | 500 | módulo de propostas instável |
| `/api/inbox` | 500 | caixa de entrada indisponível |
| `/api/marketing` e templates | 500 | marketing/campanhas indisponíveis |
| `/api/admin/roles` | 500 | papéis customizados indisponíveis |
| `/api/content/pages?slug=home` | 401 | rota CMS não existe no deploy e cai no fallback autenticado |
| `/api/billing/current` com JWT Supabase real | 401 | tela de billing pode não reconhecer a sessão usada em produção |
| `/api/billing/portal` sem sessão | 400 | deveria responder 401 antes de validar `customerId` |
| `/robots.txt` | 404 | SEO técnico incompleto |
| `/sitemap.xml` | 404 | descoberta/indexação incompleta |
| `pwa-screenshot.png` | HTML/rota, não imagem | asset citado informalmente não existe; manifest usa `og-image.png` |

# 6. Problemas Críticos

1. **Autorização fina ausente em mutações.** `companies.ts`, `crm.ts`, `marketing.ts`, `inbox.ts`, `sequences.ts`, `credits.ts` e várias rotas de IA aceitam qualquer sessão de workspace. Um `viewer` pode potencialmente editar dados. O risco é comprovado por inspeção estática; teste real de viewer permanece pendente.
2. **Schema concorrente e duplicação proibida.** `apps/api/src/db/schema.sql` cria `workspaces` e `workspace_members`; `packages/database/schema.sql` cria `users` e `companies`. O schema real usa `nodere_workspaces`, `nodere_platform_users` e `nodere_companies`.
3. **Referência ativa à tabela paralela.** `apps/api/src/services/onboardingStore.ts` grava em `workspaces`.
4. **Produção não contém o CMS/correções locais.** Há grande diferença local não versionada; publicar o diretório inteiro sem separar escopo é arriscado.
5. **Submódulos essenciais da ficha retornam 404/500.** Contratos, arquivos, comunicações, auditoria e inteligência não estão operacionalmente íntegros.

# 7. Problemas Médios

- Mensagens 500 são genéricas (`Erro ao processar a solicitação`), dificultando diagnóstico sem logs Render.
- Cookie de 7 dias e JWT Supabase de duração menor podem provocar “sessão expirada” ao retornar à plataforma.
- Billing usa contrato de sessão diferente em `/current`; portal valida payload antes de autenticação.
- Reports UI depende de várias chamadas paralelas e timeout fixo de 20 segundos.
- `settings` público expõe preferências operacionais e mapa de integrações habilitadas; não expõe chaves, mas deve ser revisto por princípio de mínimo disclosure.
- CORS aceita qualquer subdomínio `*.vercel.app`, além dos domínios explícitos.
- WhatsApp possui dois caminhos de webhook; o principal `POST /api/whatsapp/webhook` apenas retorna `{ok:true}` e não persiste payload.
- O processo de sequências contém estado de instâncias que deve ser conferido para garantir persistência integral.
- Não há variáveis Vercel de Preview, impedindo homologação fiel antes da produção.

# 8. Problemas Baixos

- Documentação antiga ainda usa “Nodere Intelligence”.
- `backend/src/services/siteScanner.js` usa User-Agent legado “Nodere Intelligence MVP Scanner”.
- O ícone `logo-nodere-icon.png` é RGB opaco; pode formar bloco visual em tema claro/PWA.
- Existem duas implementações de shell/layout (`components/Header/Sidebar` e `components/layout/Topbar/Sidebar`), elevando risco de inconsistência.
- `Topbar.tsx` usa `nodere_theme`; ThemeProvider/layout usam `nodere-theme`.
- Apenas screenshot `wide` no manifest; não há screenshot mobile dedicado.

# 9. Divergências Local x Produção

## Git e deploy

- Branch: `main`.
- HEAD local e `origin/main`: `1e48dfa03f4b637de2c11125d7410c11b4fd7ef7`.
- Deploy associado ao domínio: `dpl_9krEkwrQbk5cRspUgdo5hn6hwLbD`.
- URL do deploy: <https://web-g7h80he23-edipo-lima-s-projects.vercel.app>.
- Status Vercel: Ready, produção, criado em 18/06/2026 20:03:54 BRT.
- Aliases: `nodere.com.br`, `www.nodere.com.br` e aliases Vercel do projeto `web`.

## Alterações apenas locais

37 arquivos rastreados estão modificados. Principais grupos:

- Sessão/admin: `LoginClient.tsx`, `adminSession.ts`, `adminAuth.ts`, middleware, `WorkspaceContext.tsx`, admin routes.
- CRM/editor: `LeadDrawer.tsx`, `LeadOperations.tsx`, `RichTextEditor.tsx`, `leads.ts`, `companies.ts`, CSS.
- CMS/site: páginas públicas, Header/Footer, `publicContent.ts`, overrides CMS, admin content.
- Configuração/build: `next.config.ts`, `package.json`, lockfile.

13 caminhos novos não rastreados:

- `apps/api/src/routes/content.ts`.
- `apps/web/app/admin/content/`, `integrations/`, `modules/`, `plans/`, `users/`.
- `apps/web/app/api/content/` e `apps/web/app/pagina/`.
- `CmsPageOverride.tsx`, `DynamicCmsPage.tsx`, `publicContent.ts`.
- `packages/database/block_admin_cms.sql`.

Não há arquivos removidos no status atual.

## Conclusão da divergência

O CMS, as telas administrativas novas, o CRUD ampliado de histórico/contatos/negociações e o exchange de sessão não estão em produção. O deploy não deve ser feito a partir do worktree inteiro sem separar, revisar e versionar cada bloco.

# 10. Pendências Técnicas

- Unificar o contrato de token entre Supabase Auth, cookie, middleware Next e backend Render.
- Remover referência ativa a `workspaces` e usar somente `nodere_workspaces`.
- Consolidar os schemas em migrações incrementais; arquivar/invalidar schemas legados perigosos.
- Adicionar role guards a todas as mutações.
- Padronizar erros com `code`, correlação e logs estruturados no Render.
- Confirmar persistência de sequências, inbox e preferências; eliminar fontes de verdade em memória/localStorage quando o dado é operacional.
- Corrigir contratos HTTP do billing.
- Medir e otimizar a carga de Relatórios e transições de rotas.
- Criar testes E2E autenticados e testes de autorização por matriz de perfis.

# 11. Pendências Funcionais

## CRM

- ✅ Cadastro/listagem/detalhe base implementados.
- ⚠️ Cadastro manual, edição, exclusão, Kanban, DnD e pipeline existem, mas mutações não foram homologadas nesta auditoria.
- ⚠️ Contatos/atividades/tarefas leem em produção.
- ❌ Communications, contracts, files, audit e intelligence falham.
- ⚠️ Histórico/contatos/negociações avançados existem localmente, não publicados.
- ⚠️ Campos personalizados aparecem no schema, sem homologação funcional.
- ✅ PDF CRM gera arquivo real.
- ⚠️ CSV import/export e forecast têm código, sem teste destrutivo/visual nesta auditoria.

## Discovery

- ✅ Google Places, segmento/cidade/estado e website scanner têm resposta real.
- ⚠️ Score e análise social têm implementação; consistência dos dados não foi homologada.
- ❌ PageSpeed e Google Business Profile sem credenciais.
- 🔍 Add-to-CRM e qualificação automática não testados para não criar dados.
- ⚠️ IA diagnóstica configurada, sem chamada cobrável nesta auditoria.

## IA

- ✅ OpenAI configurada no backend.
- ⚠️ Prompts, diagnósticos, sugestões, textos e scripts existem.
- 🔍 Registro de tokens em `nodere_ai_usage_log` não comprovado no banco real.
- ⚠️ Propostas automáticas têm rota, mas o módulo de propostas retorna 500.
- ❌ Contratos automáticos não homologados.

## WhatsApp/Marketing

- ❌ WhatsApp Cloud sem credenciais.
- ⚠️ Fallback `wa.me` disponível.
- ❌ Inbox e marketing retornam 500.
- ⚠️ Templates/cadências têm código, mas envio/persistência não foram homologados.

## Contratos/Propostas

- ✅ PDF por lead funciona.
- ⚠️ Templates e versionamento têm código/tabelas planejadas.
- ❌ Lista de propostas e contratos da empresa falham.
- ❌ Upload/compartilhamento/histórico completo não homologados.

# 12. Pendências Visuais

- Homologar logo completo e ícone em todas as rotas, PDFs, e-mails, PWA e temas.
- Corrigir o ícone auxiliar opaco.
- Unificar tema e conferir contraste do modo claro em CRM, relatório, usuário, onboarding e editor.
- Conferir tipografia e ícones dos dois shells existentes.
- Validar Kanban com cores legíveis em ambos os temas.
- A inspeção do código mostra muitos overrides CSS tardios; recomenda-se teste visual por rota para evitar regressões em cascata.

# 13. Pendências Mobile

- 🔍 Homologar 375, 390, 414 e 768 px em sessão real.
- O botão Sair principal é oculto abaixo de `sm`, mas há outro botão Sair dentro do painel de preferências; precisa ser testado quanto à acessibilidade no celular.
- Manifest/SW/ícones respondem 200 e o install prompt está implementado.
- Instalação real Android/iOS não foi comprovada.
- Validar overflow no Kanban, relatórios, ficha, admin e tabelas.
- Validar menu, topbar, campos de texto avançado, botões e rodapé mobile.

# 14. Pendências de Segurança

Prioridade P0:

- Aplicar `requireWorkspaceRole` a todas as mutações de companies/CRM/marketing/inbox/sequences/credits/IA/operators.
- Testar owner, admin, operator e viewer com usuários reais distintos.
- Garantir que `workspace_id` nunca venha confiado do body/header sem confronto com a sessão.
- Revisar CORS `*.vercel.app`.
- Exigir autenticação antes de validar payload no portal Stripe.
- Validar assinatura e persistência do webhook WhatsApp real.
- Não executar schemas que criem bases paralelas.

Constatações positivas:

- Rotas operacionais principais retornam 401 sem sessão.
- APIs de configurações não retornaram chaves reais ao frontend.
- Chaves OpenAI, Supabase service role, Stripe e SMTP são lidas apenas no backend.
- CMS local restringe escrita a owner/admin via backend.

# 15. Pendências de Infraestrutura

- Vercel Preview não possui as variáveis públicas, portanto não replica produção.
- Render: conferir envs e logs de runtime; não havia acesso a logs nesta auditoria.
- Implementar observabilidade: request ID, logs estruturados, alertas 5xx e duração de queries.
- Confirmar política de backup/restore do Supabase.
- Confirmar existência e política dos buckets `site-assets` e de documentos/arquivos.
- SMTP, Stripe, PageSpeed, GBP, WhatsApp Cloud e social dependem de configuração externa.

# 16. Pendências de Integração

| Integração | Estado real |
|---|---|
| Supabase | ✅ conectado |
| Google Places | ✅ configurado e busca real 200 |
| Google Maps | ✅ contexto/link/mapa incorporado |
| OpenAI | ✅ configurado; geração cobrável não testada |
| Apollo | ⚠️ configurado; quota/permissão não homologada |
| PageSpeed | ❌ não configurado |
| Google Business Profile | ❌ OAuth ausente |
| WhatsApp Cloud | ❌ não configurado |
| Instagram/Facebook/TikTok/LinkedIn/Pinterest | ❌ não configurados |
| Bling | ❌ não configurado |
| RD Station | ❌ não configurado |
| Stripe | ❌ não configurado |
| SMTP | 🔍 código pronto; env/envio real não comprovados |

# 17. Pendências de Banco

## Tabelas referenciadas pelo backend

O código referencia pelo menos: `nodere_workspaces`, `nodere_platform_users`, `nodere_companies`, `nodere_company_notes`, `nodere_searches`, `nodere_operators`, `nodere_operator_goals`, `nodere_workspace_settings`, `nodere_app_settings`, `company_contacts`, `communications`, `company_contracts`, `company_files`, `calendar_events`, `catalog_items`, `nodere_discovery_runs`, `nodere_ai_usage_log`, `nodere_proposals`, `proposal_versions`, `proposal_templates`, `nodere_billing_subscriptions`, `nodere_stripe_events`, `nodere_plan_limits`, `inbox_messages`, `message_templates`, `campaigns`, `social_connections`, `cadence_templates`, `cadence_enrollments`, `custom_roles`, `api_keys`, `activity_logs`, `download_logs`, `push_subscriptions`, `user_metrics`, `onboarding_steps`, `vertical_prompts` e tabelas CMS locais.

## Problemas de schema

- `packages/database/schema.sql` cria `users` e `companies` genéricos: legado e incompatível com a regra atual.
- `apps/api/src/db/schema.sql` cria `workspaces` e `workspace_members` paralelos.
- `onboardingStore.ts` usa `workspaces` em vez de `nodere_workspaces`.
- Os 404/500 indicam tabelas/colunas ausentes ou consultas divergentes em módulos específicos.
- Não foi possível confirmar o estado real de todos os índices, RLS, policies, triggers e campos órfãos sem SQL Editor.

## CMS SQL local

`block_admin_cms.sql` é incremental e usa `IF NOT EXISTS`; cria páginas, seções, navegação e assets, índices, RLS de leitura pública e bucket `site-assets`. Não sobrescreve users/workspaces/CRM. Pontos a validar antes de aplicar:

- O bucket é público e não há policy de Storage declarada; uploads dependem do backend `service_role`.
- O conteúdo público está fixado ao workspace `default`.
- Escrita direta por anon/authenticated é revogada; administração depende exclusivamente do backend.
- O SQL ainda não foi aplicado/comprovado em produção.

# 18. Pendências de Deploy

- Não há deploy pendente único e seguro: o worktree mistura sessão, CRM, CMS, site, admin, CSS e dependências.
- Separar em commits por domínio e publicar primeiro em Preview com envs equivalentes.
- Aplicar SQL somente após revisão e backup.
- Validar Preview com matriz auth/role e, só depois, promover.
- Não executar deploy direto do worktree atual.
- Não criar tag estável enquanto os problemas críticos permanecerem.

# 19. Lista Priorizada por Criticidade

## P0 - bloqueadores

1. Corrigir autorização por perfil em todas as mutações.
2. Reconciliar schema e eliminar `workspaces/workspace_members/users/companies` paralelos.
3. Restaurar communications/contracts/files/audit/intelligence/proposals/inbox/marketing/roles.
4. Unificar sessão e refresh; homologar retorno após expiração.
5. Separar e preservar as mudanças locais antes de qualquer deploy.

## P1 - operação comercial

6. Homologar ficha completa, Kanban, CRUD de contatos/histórico/negociações e CSV.
7. Corrigir UI/performance de Relatórios.
8. Corrigir billing auth e manter Stripe desativado até configuração real.
9. Aplicar/homologar CMS em Preview, incluindo Storage e fallback.
10. Homologar mobile/PWA e temas em todos os viewports.

## P2 - integrações e acabamento

11. Configurar SMTP e testar contato real.
12. Configurar PageSpeed/GBP/WhatsApp/social conforme prioridade comercial.
13. Criar robots/sitemap e revisar SEO.
14. Limpar branding legado em documentação e scanner.
15. Consolidar shells, tema e assets de marca.

# 20. Plano de Execução Recomendado

1. **Congelamento e preservação:** criar branch/checkpoint do worktree atual sem deploy.
2. **Banco:** inventariar schema real via SQL Editor; comparar com todas as tabelas referenciadas; gerar migração incremental única.
3. **Segurança:** adicionar matriz de roles e testes 401/403/200 para cada mutação.
4. **Sessão:** adotar uma única estratégia de token/refresh e testar expiração, logout e reentrada.
5. **Recuperação operacional:** corrigir os endpoints 404/500, começando pela ficha, proposals, inbox, marketing e roles.
6. **Preview:** configurar envs Preview e publicar apenas estabilização.
7. **Homologação funcional:** CRUD CRM, Discovery, relatórios, PDF, calendário, admin, viewer.
8. **CMS:** aplicar SQL/bucket em ambiente de homologação, publicar CMS e validar fallback.
9. **Mobile/visual:** testes nos quatro viewports e dois temas; Lighthouse PWA/SEO.
10. **Integrações externas:** SMTP, Stripe e WhatsApp em etapas separadas, com rollback e monitoramento.

# 21. Estimativa de Esforço por Bloco

Estimativas para uma pessoa experiente, sem considerar espera por credenciais/aprovação externa:

| Bloco | Esforço estimado |
|---|---:|
| Inventário SQL real + migração segura | 2-4 dias |
| Matriz de autorização + testes | 2-4 dias |
| Sessão/refresh/middleware | 1-2 dias |
| Recuperação ficha/proposals/inbox/marketing/roles | 3-6 dias |
| CRM avançado local + homologação | 2-4 dias |
| Relatórios/performance | 2-4 dias |
| CMS + Storage + fallback | 2-4 dias |
| Mobile/temas/PWA/SEO | 2-4 dias |
| SMTP real | 0,5-1 dia após credenciais |
| Stripe completo | 3-5 dias após produtos/webhook |
| WhatsApp Cloud | 3-5 dias após Meta Business |
| Regressão E2E e release | 2-3 dias |

Total técnico provável: **22 a 42 dias úteis**, reduzível com paralelização e escopo comercial priorizado.

# 22. Checklist Final

## Builds e infraestrutura

- [x] ✅ API build.
- [x] ✅ Web lint.
- [x] ✅ Web build.
- [x] ✅ Vercel deployment Ready e domínio correto.
- [ ] 🔍 Logs Render revisados.
- [ ] ❌ Preview com envs equivalentes.

## Auth e segurança

- [x] ✅ Login real owner.
- [x] ✅ Workspace `default` carregado.
- [x] ✅ Rotas operacionais 401 sem sessão.
- [ ] ⚠️ Refresh/persistência de longo prazo.
- [ ] 🔍 Logout e recuperação de senha em navegador real.
- [ ] 🔍 Cadastro sem criar dados indevidos.
- [ ] ❌ Viewer bloqueado em todas as mutações.

## CRM e Discovery

- [x] ✅ Lista e detalhe base.
- [x] ✅ Contatos/atividades/tarefas em leitura.
- [x] ✅ Google Places e website scan.
- [x] ✅ PDF de proposta por lead.
- [ ] ❌ Communications/contracts/files.
- [ ] ❌ Audit/intelligence da empresa.
- [ ] 🔍 Add-to-CRM, DnD, import/export CSV.
- [ ] ❌ PageSpeed/GBP.

## Plataforma

- [x] ✅ Dashboard API.
- [x] ✅ Relatórios API.
- [x] ✅ Calendário leitura.
- [x] ✅ Catálogo leitura.
- [ ] ⚠️ Relatórios UI e filtros completos.
- [ ] ❌ Inbox/marketing/proposals/roles.
- [ ] ❌ CMS em produção.

## Billing, comunicação e IA

- [x] ✅ Planos públicos.
- [x] ✅ OpenAI configurada.
- [ ] ❌ Stripe.
- [ ] 🔍 SMTP real.
- [ ] ❌ WhatsApp Cloud e redes sociais.
- [ ] 🔍 Registro de tokens IA.

## Visual, SEO e mobile

- [x] ✅ Marca principal `NODERE` no HTML público.
- [x] ✅ Manifest, SW e ícones principais acessíveis.
- [ ] ⚠️ Branding legado em documentação/scanner.
- [ ] ⚠️ Tema com chave de persistência divergente.
- [ ] 🔍 375/390/414/768 em sessão real.
- [ ] 🔍 Instalação PWA real.
- [ ] ❌ `robots.txt` e `sitemap.xml`.

## Decisão de release

**NÃO APROVADO para declarar 100% concluído ou criar nova baseline estável.**  
O sistema possui partes funcionais valiosas, mas requer primeiro estabilização de segurança, schema e endpoints críticos. Esta auditoria não alterou código de aplicação, banco ou produção.
