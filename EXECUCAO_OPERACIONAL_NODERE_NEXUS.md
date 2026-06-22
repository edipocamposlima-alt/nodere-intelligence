# EXECUÇÃO OPERACIONAL — NODERE NEXUS

**Origem:** `PLANO_MESTRE_NODERE_NEXUS.md`  
**Data-base:** 22/06/2026  
**Escopo:** transformar as 60 pendências do Plano Mestre em uma sequência executável de desenvolvimento, validação e deploy.  
**Situação deste documento:** planejamento somente; nenhum código alterado, SQL executado ou deploy realizado.

---

## 1. Dashboard Executivo

| Indicador | Resultado |
|---|---:|
| Total de pendências | **60** |
| Itens críticos P0 | **12** |
| Itens altos P1 | **27** |
| Itens médios P2 | **18** |
| Itens baixos P3 | **3** |
| Fases operacionais | **7** |
| Atividades planejadas | **74** |
| Esforço estimado | **150–205 pessoa/dias** |
| Prazo calendário estimado | **60–90 dias**, com frentes paralelas |
| Risco geral atual | **Alto** |
| Percentual atual | **58%** |
| Após FASE 1 | **72%** |
| Após FASE 2 | **84%** |
| Após FASE 3 | **88%** |
| Após FASE 4 | **92%** |
| Após FASE 5 | **97%** |
| Após FASE 6 | **99%** |
| Após FASE 7 | **100%*** |

\* Projeção condicionada à disponibilidade de credenciais, aprovação dos provedores externos e aprovação integral dos gates de homologação.

### 1.1 Sequência obrigatória

```text
FASE 1 — Estabilização crítica
    ↓ gate: zero P0, sessão e schema homologados
FASE 2 — Recuperação operacional
    ↓ gate: jornada comercial E2E funcional
FASE 3 — Publicação das melhorias locais
    ↓ gate: CMS/CRM local preservado, migrado e homologado em Preview
FASE 4 — Experiência do usuário
    ↓ gate: matriz visual, mobile e PWA aprovada
FASE 5 — Integrações
    ↓ gate: integrações reais ou erro controlado, sem segredo exposto
FASE 6 — Homologação final
    ↓ gate: owner/admin/operator/viewer aprovados
FASE 7 — Deploy
    ↓ gate: produção monitorada e rollback disponível
Baseline estável
```

### 1.2 Regras de governança

1. Nenhuma fase avança enquanto existir P0 aberto na fase anterior.
2. Cada frente usa branch e commits de escopo único.
3. Toda migração é incremental, revisada e aplicada manualmente no ambiente correto.
4. Nunca criar tabelas paralelas de usuários, workspaces, leads ou empresas.
5. Nenhum deploy ocorre com build, lint, teste de autorização ou fluxo crítico falhando.
6. Preview é obrigatório antes de produção.
7. Toda atividade deve produzir evidência: teste, status HTTP, log, screenshot ou consulta controlada.
8. Credenciais reais não entram no Git, nos logs ou no frontend.

---

# FASE 1 — ESTABILIZAÇÃO CRÍTICA

## Objetivo

Eliminar riscos de segurança e falhas estruturais, unificar sessão e schema e recuperar endpoints críticos. A saída obrigatória é **zero P0 aberto**.

## Plano operacional

| ID | Item | Arquivos envolvidos | Dependências | Complexidade | Risco | Tempo estimado |
|---|---|---|---|---|---|---:|
| F1-01 | Preservar worktree e separar mudanças locais | Git, arquivos listados pela auditoria, CMS local | Nenhuma | Média | Alto | 1–2 dias |
| F1-02 | Inventariar rotas protegidas e mutações por perfil | `apps/api/src/routes/*.ts`, `middleware/session.ts` | F1-01 | Alta | Crítico | 2–3 dias |
| F1-03 | Aplicar autorização por perfil | rotas companies, CRM, inbox, marketing, sequences, credits, IA, operators | F1-02 | Alta | Crítico | 3–5 dias |
| F1-04 | Homologar matriz owner/admin/operator/viewer | testes API/E2E, rotas protegidas | Usuários reais de teste | Média | Crítico | 2–3 dias |
| F1-05 | Vincular `workspace_id` exclusivamente à sessão | middleware, stores, services e rotas | F1-02 | Alta | Crítico | 3–5 dias |
| F1-06 | Unificar middleware e estratégia de token | `LoginClient.tsx`, `adminSession.ts`, middleware Web/API, `WorkspaceContext.tsx` | Estratégia de sessão aprovada | Alta | Crítico | 3–5 dias |
| F1-07 | Corrigir refresh token, cookie, logout e reentrada | Supabase Auth, cookies, localStorage e helpers de API | F1-06 | Alta | Crítico | 3–5 dias |
| F1-08 | Inventariar schema real, RLS, policies, FKs e índices | Supabase SQL Editor; SQLs do repositório | Backup recente | Alta | Crítico | 3–4 dias |
| F1-09 | Neutralizar schemas duplicados e corrigir onboarding | `apps/api/src/db/schema.sql`, `packages/database/schema.sql`, `onboardingStore.ts` | F1-08 | Alta | Crítico | 3–5 dias |
| F1-10 | Reconciliar tabelas da ficha e módulos críticos | SQL incremental; companies, communications, contracts, files, audit, intelligence | F1-08 | Alta | Crítico | 4–6 dias |
| F1-11 | Recuperar endpoints 404 | audit, intelligence, ficha e subrotas | F1-09/10 | Alta | Crítico | 2–4 dias |
| F1-12 | Recuperar endpoints 500 | communications, contracts, files, inbox, marketing, proposals e roles | F1-09/10 | Alta | Crítico | 4–6 dias |
| F1-13 | Restringir CORS e executar regressão crítica | `apps/api/src/server.ts`, Preview, testes HTTP | URLs oficiais e F1-03/07 | Média | Alto | 2–3 dias |

## Checklist técnico

- [ ] Worktree atual preservado e mudanças separadas por escopo.
- [ ] Todas as mutações possuem guard de papel e workspace.
- [ ] Sem sessão retorna 401.
- [ ] Sessão sem permissão retorna 403.
- [ ] Owner/admin/operator recebem 200 apenas no escopo permitido.
- [ ] Viewer permanece somente leitura.
- [ ] Refresh mantém sessão válida sem loop ou logout antecipado.
- [ ] Logout invalida estado local e cookie.
- [ ] Schema real documentado e backup confirmado.
- [ ] Nenhum schema paralelo é executado ou consultado.
- [ ] Endpoints críticos não retornam 404 ou 500.
- [ ] CORS aceita somente origens oficiais.
- [ ] Build API, lint/typecheck/build Web e testes de autorização aprovados.

## Gate de saída

**Aprovar somente com:** zero P0; sessão persistente; isolamento por workspace comprovado; schema único; endpoints críticos respondendo de forma controlada; Preview seguro.  
**Percentual projetado:** 72%.

---

# FASE 2 — RECUPERAÇÃO OPERACIONAL

## Objetivo

Restaurar a operação comercial completa, da descoberta de empresas à ficha, negociação, proposta, contrato, comunicação e relatório.

## Plano operacional

| ID | Frente | Atividade | Dependências | Complexidade | Tempo estimado |
|---|---|---|---|---|---:|
| F2-01 | CRM | Recuperar ficha 360 e subrotas de dados | FASE 1, DB-04 | Alta | 3–5 dias |
| F2-02 | CRM | Homologar Visão Geral e persistência | F2-01 | Média | 1–2 dias |
| F2-03 | CRM | Homologar Kanban, drag and drop e rollback | F2-01, autorização | Média | 2–3 dias |
| F2-04 | CRM | Homologar importação, deduplicação e exportação CSV | Backup e massa controlada | Média | 2–3 dias |
| F2-05 | Discovery | Validar busca Google Places e detalhes | Credencial Google | Média | 2–3 dias |
| F2-06 | Discovery | Validar score, social scan e Adicionar ao CRM | F2-01/05 | Média | 2–3 dias |
| F2-07 | Contratos | Recuperar CRUD, versões, vínculo e download | FASE 1, schema reconciliado | Alta | 3–5 dias |
| F2-08 | Propostas | Recuperar CRUD, geração e PDF real | CRM funcional e assets | Alta | 3–5 dias |
| F2-09 | Arquivos | Homologar upload, listagem, exclusão e Storage | Bucket e policies | Alta | 2–4 dias |
| F2-10 | Inbox | Recuperar listagem e persistência de conversas | FASE 1, DB-05 | Alta | 3–5 dias |
| F2-11 | Marketing | Recuperar API, templates e campanhas locais | FASE 1, DB-05 | Alta | 3–5 dias |
| F2-12 | Relatórios | Remover timeout e medir consultas | Observabilidade | Alta | 3–5 dias |
| F2-13 | Relatórios | Homologar filtros, escopo por perfil/plano e indicadores | F2-12, matriz de papéis | Alta | 3–5 dias |
| F2-14 | Relatórios | Validar PDF/CSV e consistência dos dados | F2-13 | Média | 2–3 dias |

## Checklist técnico

### CRM

- [ ] Listagem, criação, edição e exclusão respeitam workspace e papel.
- [ ] Ficha existente abre sem 404/500.
- [ ] Kanban persiste cada transição e suporta rollback em erro.
- [ ] Importação CSV valida, deduplica e relata rejeições.
- [ ] Exportação CSV contém somente dados autorizados.

### Discovery

- [ ] Busca por termo, segmento e cidade retorna resultados reais.
- [ ] Detalhes por `placeId` carregam.
- [ ] Score e social scan apresentam resultado ou erro controlado.
- [ ] Adicionar ao CRM cria uma única empresa e abre a ficha correta.

### Contratos, propostas e arquivos

- [ ] Contratos e propostas possuem CRUD, versões e histórico.
- [ ] PDFs são arquivos PDF válidos, com identidade aprovada.
- [ ] Uploads usam bucket e policy corretos.
- [ ] Exclusão remove referência e objeto conforme política.

### Inbox e Marketing

- [ ] Inbox lista e persiste conversas sem usar memória como fonte principal.
- [ ] Marketing/templates não retornam 500.
- [ ] Falta de credencial externa gera erro controlado.

### Relatórios

- [ ] Tela não falha por timeout fixo.
- [ ] Filtros respeitam perfil, plano e workspace.
- [ ] Indicadores conferem com consultas de referência.
- [ ] PDF e CSV são válidos e reproduzíveis.

## Gate de saída

**Aprovar somente com:** jornada Google Places → CRM → ficha → atividade → proposta/contrato → relatório funcionando E2E e sem fonte de verdade em memória.  
**Percentual projetado:** 84%.

---

# FASE 3 — PUBLICAÇÃO DAS MELHORIAS LOCAIS

## Objetivo

Preservar, reconciliar e publicar em Preview as melhorias já existentes localmente, sem misturar alterações de sessão, CRM ou CSS e sem sobrescrever estruturas de produção.

## Mapa de arquivos e dependências

| ID | Item | Arquivos novos | Arquivos modificados | SQL necessário | Dependências | Tempo estimado |
|---|---|---|---|---|---|---:|
| F3-01 | CMS — preservação | branch/checkpoint e inventário | nenhum arquivo funcional inicialmente | Não | Git limpo e FASE 1 | 1 dia |
| F3-02 | CMS — backend | `packages/database/block_admin_cms.sql` se confirmado | `apps/api/src/routes/content.ts`, registro no servidor | Incremental, manual | Schema real, roles e workspace | 2–4 dias |
| F3-03 | CMS — frontend público | componentes/rotas CMS locais | `DynamicCmsPage.tsx`, `publicContent.ts`, páginas públicas | Usa F3-02 | API CMS e fallback | 2–4 dias |
| F3-04 | Admin Content | `apps/web/app/admin/content/*` | menu/admin guards, cliente API | Usa F3-02 | Admin real e Storage | 3–5 dias |
| F3-05 | Histórico | componentes/formulários locais | LeadDrawer, leads/companies routes | Migração incremental se faltar tabela/campo | CRM e autorização | 2–4 dias |
| F3-06 | Contatos | componentes/formulários locais | LeadDrawer, contacts routes | Migração incremental se necessária | CRM e autorização | 2–4 dias |
| F3-07 | Negociações | componentes/formulários locais | LeadDrawer, negotiations routes | Migração incremental se necessária | CRM, catálogo e forecast | 3–5 dias |
| F3-08 | RichTextEditor | `RichTextEditor.tsx` e testes, se ainda locais | formulários de histórico, propostas, contratos e CMS | Sanitização/persistência conforme schema | Política HTML e upload | 3–5 dias |
| F3-09 | Storage CMS | políticas/bucket documentados | ContentAdmin, upload helpers | Bucket/policies manuais | Supabase Storage | 2–3 dias |
| F3-10 | Preview e fallback | testes/fixtures de Preview | páginas públicas e admin | SQL já aplicado em homologação | F3-02 a F3-09 | 2–3 dias |

## Requisitos de publicação local

- [ ] Inventário exato de arquivos novos, modificados e não rastreados anexado ao PR.
- [ ] Alterações CMS separadas das correções de sessão/CRM/CSS.
- [ ] SQL revisado contra schema real e sem `DROP` destrutivo.
- [ ] `workspace_id` aplicado onde o conteúdo não for global.
- [ ] APIs administrativas retornam 401 sem sessão e 403 sem papel admin.
- [ ] Conteúdo público publicado é legível sem login.
- [ ] Na ausência de conteúdo publicado, o conteúdo atual continua disponível.
- [ ] HTML do editor é sanitizado no servidor e na renderização.
- [ ] Upload trata tamanho, tipo, falha, URL e exclusão.

## Gate de saída

**Aprovar somente com:** melhorias locais preservadas em commits isolados; CMS e ficha avançada funcionais em Preview; fallback público comprovado; SQL aplicado apenas manualmente em homologação.  
**Percentual projetado:** 88%.

---

# FASE 4 — EXPERIÊNCIA DO USUÁRIO

## Objetivo

Homologar tema claro/escuro, responsividade, mobile e PWA, eliminando controles inacessíveis, overflow e regressões visuais.

## Plano operacional

| ID | Item | Escopo | Dependências | Complexidade | Tempo estimado |
|---|---|---|---|---|---:|
| F4-01 | Tema Claro | contraste, marca, cards, formulários, editor, tabelas e Kanban | CSS consolidado | Alta | 3–5 dias |
| F4-02 | Tema Escuro | contraste, estados, modais, menus, editor e relatórios | F4-01 | Alta | 3–5 dias |
| F4-03 | Tema único | unificar chaves de tema e remover overrides conflitantes | ThemeProvider, layouts e CSS | Alta | 2–4 dias |
| F4-04 | Responsividade estrutural | AppShell, sidebar, topbar, rodapé e área útil | F4-03 | Alta | 3–5 dias |
| F4-05 | Mobile operacional | CRM, ficha, relatórios, admin, tabelas e editor | F4-04 | Alta | 4–6 dias |
| F4-06 | Navegação mobile | Sair, menu, busca, notificações e ações principais | F4-04 | Média | 2–3 dias |
| F4-07 | PWA — instalação | manifest, install prompt, standalone e ícones | HTTPS e assets aprovados | Média | 2–3 dias |
| F4-08 | PWA — ciclo | service worker, cache, atualização, offline e logout | F4-07, sessão estável | Média | 2–4 dias |
| F4-09 | SEO técnico | `robots.txt`, `sitemap.xml`, metadata, OG e crawl | Rotas públicas finais | Média | 2–3 dias |
| F4-10 | Performance percebida | lazy loading, skeleton, cache e chamadas duplicadas | Observabilidade | Alta | 3–5 dias |
| F4-11 | Matriz visual final | screenshots e testes de interação em todos os viewports | F4-01 a F4-10 | Média | 2–3 dias |

## Matriz obrigatória de viewport

| Viewport | Dispositivo de referência | Tema Claro | Tema Escuro | Navegação | Formulários | PWA |
|---:|---|---|---|---|---|---|
| 375px | iPhone compacto | Pendente | Pendente | Pendente | Pendente | Pendente |
| 390px | iPhone atual | Pendente | Pendente | Pendente | Pendente | Pendente |
| 414px | Mobile amplo | Pendente | Pendente | Pendente | Pendente | Pendente |
| 768px | Tablet retrato | Pendente | Pendente | Pendente | Pendente | N/A |
| 1024px | Tablet paisagem/notebook | Pendente | Pendente | Pendente | Pendente | N/A |
| 1440px | Desktop | Pendente | Pendente | Pendente | Pendente | N/A |

## Rotas mínimas da matriz

- [ ] Login, recuperação e persistência de sessão.
- [ ] Dashboard e navegação principal.
- [ ] Discovery e resultados.
- [ ] CRM/Kanban e ficha comercial.
- [ ] Histórico, Contatos e Negociações.
- [ ] Relatórios e exportações.
- [ ] CMS/Admin Content.
- [ ] Configurações, billing e integrações.
- [ ] Site público e páginas institucionais.

## Gate de saída

**Aprovar somente com:** zero overflow crítico; contraste aceitável; controles acessíveis; troca de rota sem reload completo; PWA instalada em Android e iOS reais.  
**Percentual projetado:** 92%.

---

# FASE 5 — INTEGRAÇÕES

## Objetivo

Ativar e homologar integrações externas com rastreabilidade, erros controlados e nenhum segredo exposto no frontend.

## Plano operacional

| ID | Integração | Atividade | Dependências | Complexidade | Risco | Tempo estimado |
|---|---|---|---|---|---|---:|
| F5-01 | SMTP | Configurar variáveis e testar envio real | Domínio/remetente e Render | Média | Médio | 1–2 dias |
| F5-02 | OpenAI | Homologar chave, prompts e erros | Settings, workspace e créditos | Média | Alto | 2–3 dias |
| F5-03 | OpenAI | Comprovar log de tokens, custo e workspace | tabela de usage, F5-02 | Média | Alto | 2–3 dias |
| F5-04 | Apollo | Configurar chave, quota e enriquecimento | Consentimento e contrato | Alta | Médio | 2–4 dias |
| F5-05 | Google Places | Homologar busca, detalhes, quota e erros | Credencial Google | Média | Alto | 2–3 dias |
| F5-06 | PageSpeed | Configurar API e integrar score técnico | Credencial Google | Baixa | Baixo | 1–2 dias |
| F5-07 | Google Business Profile | Configurar OAuth, escopos e renovação | Projeto Google e consentimento | Muito alta | Alto | 5–8 dias |
| F5-08 | WhatsApp | Configurar Meta Business, número e Cloud API | Aprovação Meta | Muito alta | Alto | 5–10 dias |
| F5-09 | WhatsApp | Consolidar webhook, assinatura e idempotência | F5-08, Inbox funcional | Alta | Crítico | 3–5 dias |
| F5-10 | Stripe | Configurar produtos, prices e variáveis | Conta Stripe | Alta | Alto | 3–5 dias |
| F5-11 | Stripe | Homologar checkout, portal e ciclo completo | F5-10 e billing/session | Alta | Alto | 3–5 dias |
| F5-12 | Observabilidade | Configurar Preview, logs e alertas das integrações | Vercel/Render | Média | Alto | 2–3 dias |

## Checklist de segurança e operação

- [ ] Todas as credenciais ficam somente em secrets do ambiente adequado.
- [ ] Nenhuma chave real aparece em bundle, Network, HTML, log ou mensagem de erro.
- [ ] Cada integração possui timeout, retry controlado e mensagem compreensível.
- [ ] Webhooks verificam assinatura e são idempotentes.
- [ ] Eventos processados ficam persistidos.
- [ ] Quotas e custos possuem monitoramento.
- [ ] A ausência de credencial não derruba a API.
- [ ] Integrações não configuradas são exibidas como pendência controlada.

## Gate de saída

**Aprovar somente com:** cada integração retornando resultado real ou erro controlado documentado; webhooks assinados e persistentes; custos rastreáveis; segredos ausentes do frontend.  
**Percentual projetado:** 97%.

---

# FASE 6 — HOMOLOGAÇÃO FINAL

## Objetivo

Executar regressão funcional, de autorização, dados, segurança, visual e performance antes da promoção à produção.

## Atividades

| ID | Atividade | Evidência obrigatória |
|---|---|---|
| F6-01 | Congelar escopo e registrar commits/SQLs candidatos | hashes, diff e inventário |
| F6-02 | Executar build API e Web, lint e TypeScript | logs completos sem erro |
| F6-03 | Executar matriz de autenticação e autorização | status 401/403/200 por papel |
| F6-04 | Executar jornadas E2E comerciais | screenshots, IDs de registros descartáveis e logs |
| F6-05 | Executar matriz visual e PWA | screenshots por viewport/tema/dispositivo |
| F6-06 | Validar exportações, integrações e ausência de segredos | arquivos gerados e inspeção Network/bundle |
| F6-07 | Executar teste de performance e observabilidade | tempos, queries e logs |
| F6-08 | Formalizar aceite e plano de rollback | checklist assinado e procedimento testado |

## Matriz de homologação

| Área | Testes | Status |
|---|---|---|
| Autenticação | login, refresh, persistência, logout e recuperação | PENDENTE |
| Owner | acesso total do workspace e gestão permitida | PENDENTE |
| Admin | administração funcional sem acesso cruzado | PENDENTE |
| Operator | leitura/mutação somente no escopo atribuído | PENDENTE |
| Viewer | leitura permitida e toda mutação bloqueada com 403 | PENDENTE |
| Workspace | isolamento entre dois workspaces reais | PENDENTE |
| CRM | CRUD, ficha, Kanban, Histórico, Contatos e Negociações | PENDENTE |
| Discovery | busca, detalhes, score e Adicionar ao CRM | PENDENTE |
| Propostas/Contratos | CRUD, versões, PDF e histórico | PENDENTE |
| Inbox/WhatsApp | mensagens, webhook, templates e anexos | PENDENTE |
| Marketing | templates, campanhas e erros controlados | PENDENTE |
| Relatórios | filtros, indicadores, PDF e CSV | PENDENTE |
| CMS/Admin Content | CRUD, publicação, fallback e permissões | PENDENTE |
| Billing | planos, checkout, portal, webhook e ciclo | PENDENTE |
| Mobile/PWA | 375–1440px, instalação, cache e atualização | PENDENTE |
| SEO | robots, sitemap, metadata e OG | PENDENTE |
| Segurança | 401/403/200, CORS, RLS, secrets e headers | PENDENTE |
| Performance | rotas, relatórios, queries e chamadas duplicadas | PENDENTE |

## Critério de aprovação por papel

| Papel | Deve acessar | Deve ser bloqueado |
|---|---|---|
| Owner | todos os recursos do próprio workspace, billing e administração permitida | qualquer outro workspace |
| Admin | módulos e administração operacional autorizada | outro workspace e ações exclusivas do owner, se aplicável |
| Operator | empresas, CRM e atividades atribuídas | administração, integrações sensíveis e dados não atribuídos |
| Viewer | telas e dados de leitura autorizados | toda criação, edição, exclusão, publicação e configuração sensível |

## Gate de saída

**Aprovar somente com:** zero falha crítica; zero vazamento entre workspaces; zero segredo exposto; builds aprovados; aceite dos quatro papéis; rollback pronto.  
**Percentual projetado:** 99%.

---

# FASE 7 — DEPLOY

## Objetivo

Promover a versão homologada com backup, rastreabilidade, rollback e monitoramento de pós-deploy.

## Sequência exata

### F7-01 — 1. Backup

- [ ] Confirmar commit, branch, tag candidata e worktree limpo.
- [ ] Gerar backup recente do Supabase e registrar horário/ambiente.
- [ ] Exportar inventário de schema, policies, funções e triggers.
- [ ] Preservar variáveis e configurações atuais sem registrar valores secretos.
- [ ] Registrar deployment estável anterior e procedimento de rollback.

### F7-02 — 2. Migração

- [ ] Revisar SQL incremental com o schema real.
- [ ] Aplicar manualmente primeiro em homologação.
- [ ] Validar contagens, constraints, RLS e índices.
- [ ] Executar reload do schema cache quando necessário.
- [ ] Aplicar manualmente em produção somente após aceite.
- [ ] Confirmar que nenhum dado foi apagado ou duplicado.

### F7-03 — 3. Preview

- [ ] Publicar commit exato em Preview.
- [ ] Confirmar variáveis equivalentes e CORS do Preview.
- [ ] Executar smoke test público e autenticado.
- [ ] Revisar logs Vercel, Render, Supabase e provedores.

### F7-04 — 4. Homologação

- [ ] Executar integralmente a matriz da FASE 6.
- [ ] Registrar OK/FALHOU e evidência para cada área.
- [ ] Corrigir falhas em novo commit e repetir a matriz afetada.
- [ ] Obter aceite formal antes de produção.

### F7-05 — 5. Produção

- [ ] Promover exatamente o commit homologado.
- [ ] Confirmar deployment, domínio e API corretos.
- [ ] Executar smoke test sem sessão e com sessão real.
- [ ] Confirmar que tarefas de migração e webhooks não duplicaram eventos.

### F7-06 — 6. Pós Deploy

- [ ] Monitorar 4xx, 5xx, latência, auth, banco e webhooks por 60 minutos.
- [ ] Revalidar CRM, Discovery, ficha, relatórios, CMS e integrações.
- [ ] Confirmar mobile/PWA e cache atualizado.
- [ ] Executar rollback se qualquer P0 reaparecer.
- [ ] Registrar release, commit, deployment, SQL aplicado e pendências externas.
- [ ] Criar baseline/tag estável somente após a janela de observação.

## Gate final

**Aprovar somente com:** produção servindo o commit homologado; banco íntegro; domínio/API corretos; nenhuma regressão P0; monitoramento estável; evidências arquivadas.  
**Percentual projetado:** 100% do escopo auditado, condicionado às dependências externas.

---

## 2. Cronograma Operacional Consolidado

| Horizonte | Fase principal | Entrega | Percentual projetado |
|---|---|---|---:|
| 0–15 dias | FASE 1 | Segurança, sessão, schema e endpoints críticos | 72% |
| 16–30 dias | FASE 2 | Operação comercial E2E | 84% |
| 31–40 dias | FASE 3 | Melhorias locais e CMS em Preview | 88% |
| 41–60 dias | FASE 4 | UX, mobile, PWA, SEO e performance | 92% |
| 45–75 dias | FASE 5, paralela após F1 | Integrações externas homologadas | 97% |
| 76–85 dias | FASE 6 | Homologação integral | 99% |
| 86–90 dias | FASE 7 | Produção e pós-deploy | 100%* |

## 3. Capacidade Recomendada

| Papel técnico | Dedicação sugerida | Responsabilidade principal |
|---|---:|---|
| Tech Lead/Backend | 1,0 FTE | segurança, sessão, APIs e arquitetura |
| Backend/Database | 1,0 FTE | schema, RLS, migrações e performance SQL |
| Frontend | 1,0 FTE | CRM, CMS, relatórios, UX e responsividade |
| QA/E2E | 0,75 FTE | matrizes de papel, jornada, visual e regressão |
| DevOps/Plataforma | 0,25–0,5 FTE | Preview, Render, Vercel, secrets e observabilidade |
| Produto/Operação | 0,25 FTE | aceite funcional, massa de teste e prioridades |

## 4. Registro de Decisão por Fase

| Fase | Responsável | Data prevista | Status | Decisão | Evidência |
|---|---|---|---|---|---|
| FASE 1 | A definir | A definir | NÃO INICIADA | — | — |
| FASE 2 | A definir | A definir | BLOQUEADA POR F1 | — | — |
| FASE 3 | A definir | A definir | BLOQUEADA POR F1/F2 | — | — |
| FASE 4 | A definir | A definir | BLOQUEADA POR F3 | — | — |
| FASE 5 | A definir | A definir | BLOQUEADA POR F1 | — | — |
| FASE 6 | A definir | A definir | BLOQUEADA POR F1–F5 | — | — |
| FASE 7 | A definir | A definir | BLOQUEADA POR F6 | — | — |

## 5. Resultado Esperado

Ao concluir as sete fases, o NODERE terá uma baseline operacional com autorização e isolamento por workspace comprovados, sessão persistente, schema reconciliado, CRM e Discovery E2E, melhorias locais publicadas com segurança, experiência responsiva homologada, integrações rastreáveis e deploy reproduzível. A projeção é **100% do escopo identificado no Plano Mestre**, desde que as credenciais e aprovações externas estejam disponíveis e todos os gates sejam aprovados.
