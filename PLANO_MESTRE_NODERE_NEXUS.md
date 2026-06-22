# PLANO MESTRE DE CORREÇÃO — NODERE

**Origem:** `AUDITORIA_GERAL_NODERE_NEXUS_DOCUMENTO.md`  
**Data-base:** 22/06/2026  
**Objetivo:** estabilizar, recuperar, homologar e expandir a plataforma sem perda de dados ou regressão das funcionalidades existentes.  
**Regra de execução:** nenhuma fase avança com item P0 aberto; SQL é sempre incremental e aplicado manualmente; todo deploy passa por Preview e regressão autenticada.

---

## 1. Resumo Executivo

A auditoria consolidada demonstra que o NODERE possui uma base funcional relevante, porém ainda não pode ser declarado integralmente estável. O plano mestre organiza **60 pendências únicas**, sem duplicar itens repetidos em diferentes seções da auditoria.

| Indicador | Resultado |
|---|---:|
| Total de pendências únicas | **60** |
| Itens críticos P0 | **12** |
| Itens altos P1 | **27** |
| Itens médios P2 | **18** |
| Itens baixos P3 | **3** |
| Conclusão atual estimada | **58%** |
| Após BLOCO 01 | **72%** |
| Após BLOCO 02 | **84%** |
| Após BLOCO 03 | **92%** |
| Após BLOCO 04 | **100%**, condicionado às credenciais externas |

> **Método da estimativa:** percentual heurístico baseado na cobertura funcional comprovada, quantidade e severidade das pendências, integridade operacional e homologação. Não representa telemetria automática nem percentual de linhas de código.

## 2. Critérios de Prioridade e Complexidade

| Código | Definição | Critério de saída |
|---|---|---|
| **P0 — Crítico** | Segurança, perda/isolamento de dados, sessão ou fluxo operacional bloqueado | Zero P0 aberto antes de produção |
| **P1 — Alto** | Módulo principal incompleto ou instável | Fluxo E2E homologado em Preview |
| **P2 — Médio** | Integração, acabamento ou eficiência com alternativa temporária | Aceite funcional e monitoramento |
| **P3 — Baixo** | Limpeza, consistência ou melhoria sem bloqueio operacional | Backlog fechado antes da baseline final |

Complexidade: **Baixa** (até 1 dia), **Média** (1–3 dias), **Alta** (3–6 dias) ou **Muito alta** (mais de 6 dias/dependência externa).

## 3. Tabela Mestre de Pendências

| Prioridade | Item | Status Atual | Impacto | Complexidade |
|---|---|---|---|---|
| P0 | SEC-01 — Restringir mutações por perfil | Guards ausentes em várias rotas | Viewer pode alterar dados | Alta |
| P0 | SEC-02 — Homologar matriz owner/admin/operator/viewer | Sem usuário viewer validado | Permissões não comprovadas | Média |
| P0 | SEC-03 — Vincular workspace exclusivamente à sessão | Há pontos que aceitam contexto externo | Risco de acesso cruzado | Alta |
| P0 | SEC-04 — Unificar sessão, cookie e refresh | JWT expira antes do cookie | Logout/expiração indevida | Alta |
| P1 | SEC-05 — Restringir CORS de Preview | Aceita qualquer `*.vercel.app` | Superfície de origem ampla | Baixa |
| P1 | SEC-06 — Corrigir autenticação do billing | `/current` 401 e portal 400 | Billing incompatível com sessão | Média |
| P2 | SEC-07 — Reduzir disclosure de settings público | Preferências operacionais expostas | Exposição desnecessária | Baixa |
| P0 | DB-01 — Inventariar schema real | Estado completo não comprovado | Migração insegura | Alta |
| P0 | DB-02 — Eliminar schemas paralelos | `users/companies/workspaces` legados | Duplicação e corrupção lógica | Alta |
| P0 | DB-03 — Corrigir `onboardingStore.ts` | Grava em `workspaces` | Onboarding divergente | Baixa |
| P0 | DB-04 — Reconciliar tabelas da ficha | Communications/contracts/files falham | Ficha 360 incompleta | Alta |
| P1 | DB-05 — Reconciliar proposals/inbox/marketing/roles | Endpoints retornam 500 | Módulos indisponíveis | Alta |
| P1 | DB-06 — Auditar RLS, policies, índices e triggers | Não enumerados no banco real | Segurança/performance incertas | Alta |
| P1 | DB-07 — Validar buckets e policies Storage | Buckets não comprovados | Uploads podem falhar | Média |
| P0 | CRM-01 — Recuperar endpoints 404/500 da ficha | Falha real em produção | Operação comercial bloqueada | Alta |
| P1 | CRM-02 — Publicar CRUD avançado da ficha | Implementação somente local | Histórico/contatos/negociações incompletos | Alta |
| P1 | CRM-03 — Homologar Kanban e drag and drop | Código sem teste de mutação | Pipeline não confiável | Média |
| P1 | CRM-04 — Homologar importação/exportação CSV | Não testado E2E | Entrada/saída de dados incerta | Média |
| P2 | CRM-05 — Corrigir PDF de empresa | Retorna HTML como PDF | Download inconsistente | Média |
| P2 | CRM-06 — Homologar campos personalizados e forecast | Schema/código sem validação | Gestão comercial parcial | Média |
| P1 | DISC-01 — Homologar Adicionar ao CRM | Não testado por evitar mutação | Discovery não fecha o ciclo | Média |
| P1 | DISC-02 — Validar score e análise social | Consistência não comprovada | Priorização pode ser imprecisa | Média |
| P2 | DISC-03 — Ativar PageSpeed | API key ausente | Score técnico incompleto | Baixa |
| P2 | DISC-04 — Ativar Google Business Profile/Apollo | OAuth/quota não homologados | Enriquecimento parcial | Alta |
| P1 | IA-01 — Homologar diagnósticos/prompts | Provedor OK, fluxos não testados | IA pode gerar resposta inconsistente | Média |
| P1 | IA-02 — Comprovar log de tokens | Tabela não validada | Custos sem rastreabilidade | Média |
| P2 | IA-03 — Homologar propostas, contratos e resumos IA | Fluxos incompletos | Automação comercial parcial | Alta |
| P1 | WA-01 — Configurar WhatsApp Cloud | Credenciais ausentes | Envio real indisponível | Muito alta |
| P0 | WA-02 — Recuperar Inbox | `/api/inbox` retorna 500 | Comunicação central bloqueada | Alta |
| P1 | WA-03 — Unificar e validar webhooks | Dois caminhos; um não persiste | Mensagens podem ser perdidas | Alta |
| P2 | WA-04 — Homologar templates, anexos e histórico | Código sem persistência comprovada | Operação omnichannel parcial | Alta |
| P0 | MKT-01 — Recuperar Marketing/templates | Endpoints retornam 500 | Campanhas indisponíveis | Alta |
| P2 | MKT-02 — Homologar campanhas e canais sociais | Credenciais ausentes | Expansão de canais bloqueada | Muito alta |
| P0 | CMS-01 — Preservar e separar worktree local | CMS misturado a outras mudanças | Deploy pode causar regressão | Média |
| P1 | CMS-02 — Aplicar SQL incremental em homologação | SQL ainda não aplicado | CMS indisponível em produção | Média |
| P1 | CMS-03 — Homologar upload Storage e fallback | Bucket/policy não comprovados | Imagens e páginas podem falhar | Média |
| P1 | CMS-04 — Homologar páginas, menus, blog e permissões | Implementação somente local | Administração de conteúdo ausente | Alta |
| P1 | BILL-01 — Configurar Stripe, produtos e preços | Stripe não configurado | Checkout indisponível | Alta |
| P1 | BILL-02 — Corrigir `/billing/current` | JWT real recebe 401 | Assinatura não carrega | Média |
| P1 | BILL-03 — Corrigir portal e checkout | Portal responde 400 sem sessão | Contrato HTTP inseguro | Média |
| P1 | BILL-04 — Homologar webhook/idempotência | Webhook apenas informa não configurado | Estado financeiro não persiste | Alta |
| P2 | BILL-05 — Homologar upgrade/downgrade/cancelamento | Não executado | Ciclo da assinatura incompleto | Alta |
| P1 | REP-01 — Corrigir timeout da UI | Timeout fixo de 20s | Tela de relatórios falha | Alta |
| P1 | REP-02 — Homologar filtros e permissões | Filtros completos não validados | Dados podem exceder escopo | Alta |
| P2 | REP-03 — Homologar PDF/CSV e métricas | Exportações sem teste integral | Entrega executiva parcial | Média |
| P1 | MOB-01 — Homologar 375/390/414/768 px | Sem teste autenticado | Experiência mobile incerta | Alta |
| P2 | MOB-02 — Validar Sair/menu/topbar | Acesso depende de preferências | Usuário pode ficar preso | Média |
| P2 | MOB-03 — Corrigir overflow e controles cortados | Kanban/tabelas/admin em risco | Uso no celular prejudicado | Alta |
| P1 | PWA-01 — Homologar instalação Android/iOS | Não testada em dispositivo real | App não comprovado | Média |
| P2 | PWA-02 — Corrigir ícone opaco e screenshot mobile | Asset com fundo e apenas wide | Identidade/instalação inferiores | Baixa |
| P2 | PWA-03 — Validar SW, offline e atualização | Assets 200, ciclo não testado | Cache pode servir versão antiga | Média |
| P2 | SEO-01 — Criar `robots.txt` e `sitemap.xml` | Ambos retornam 404 | Indexação incompleta | Baixa |
| P3 | SEO-02 — Revisar metadata/crawl/branding legado | Documentação/scanner antigos | Marca e descoberta inconsistentes | Média |
| P2 | INT-01 — Configurar SMTP e testar envio | Configuração não comprovada | Contato não homologado | Média |
| P3 | INT-02 — Planejar Bling e RD Station | Não configurados | Integrações comerciais ausentes | Alta |
| P2 | INT-03 — Configurar Preview e observabilidade | Env Preview/logs insuficientes | Homologação e diagnóstico frágeis | Média |
| P1 | PERF-01 — Otimizar relatórios e queries | Chamadas paralelas lentas | Navegação lenta/timeout | Alta |
| P2 | PERF-02 — Reduzir reloads e chamadas duplicadas | Não instrumentado | Latência e custo elevados | Alta |
| P1 | UX-01 — Unificar tema e contraste | Chaves divergentes e relatos visuais | Tema claro/escuro inconsistente | Alta |
| P3 | UX-02 — Consolidar shells, CSS e branding | Duas estruturas e overrides tardios | Regressões visuais recorrentes | Alta |

## 4. Plano Detalhado por Categoria

### 4.1 Segurança

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| SEC-01 | Aplicar `requireWorkspaceRole` em todas as mutações de companies, CRM, marketing, inbox, sequences, credits, IA e operators | `apps/api/src/routes/*.ts`, `middleware/session.ts` | Matriz de papéis | P0 |
| SEC-02 | Criar testes com owner, admin, operator e viewer para 401/403/200 | testes E2E/API, rotas protegidas | Usuários reais de teste | P0 |
| SEC-03 | Confrontar todo `workspace_id` com a sessão autenticada | session middleware, stores e rotas | Inventário de rotas | P0 |
| SEC-04 | Unificar Supabase token, token NODERE, cookie, refresh e logout | `LoginClient.tsx`, `adminSession.ts`, middleware Web/API, `WorkspaceContext.tsx` | Estratégia única de sessão | P0 |
| SEC-05 | Restringir CORS a domínios de produção/Preview conhecidos | `apps/api/src/server.ts` | URLs oficiais de Preview | P1 |
| SEC-06 | Autenticar billing antes de validar payload | `routes/billing.ts`, `services/billing.ts`, Web billing | SEC-04 | P1 |
| SEC-07 | Limitar payload público de settings ao estritamente necessário | `server.ts`, settings routes | Revisão de consumidores Web | P2 |

### 4.2 Banco de Dados

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| DB-01 | Exportar catálogo real de tabelas, colunas, FKs, índices, RLS, policies, funções e triggers | Supabase SQL Editor; SQLs do repositório | Backup recente | P0 |
| DB-02 | Tornar não executáveis os schemas que criam bases paralelas | `apps/api/src/db/schema.sql`, `packages/database/schema.sql` | DB-01 | P0 |
| DB-03 | Migrar onboarding para `nodere_workspaces` | `services/onboardingStore.ts` | Schema real | P0 |
| DB-04 | Criar migração incremental para communications/contracts/files/audit/intelligence | SQL incremental e rotas companies | DB-01 | P0 |
| DB-05 | Reconciliar proposals, inbox, marketing e custom_roles | SQLs existentes e respectivas rotas | Logs Render | P1 |
| DB-06 | Revisar isolamento por workspace e performance dos índices | todos os SQLs/RLS | DB-01 e SEC-03 | P1 |
| DB-07 | Confirmar `site-assets` e buckets de documentos com policies adequadas | `block_admin_cms.sql`, Storage | CMS-02 | P1 |

### 4.3 CRM

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| CRM-01 | Restaurar ficha completa e subrotas 404/500 | `routes/companies.ts`, LeadOperations, LeadDrawer | DB-04 | P0 |
| CRM-02 | Versionar e publicar histórico, contatos e negociações avançados | `LeadDrawer.tsx`, `leads.ts`, `RichTextEditor.tsx` | DB-01, SEC-01 | P1 |
| CRM-03 | Testar transição Kanban e DnD com rollback/registro descartável | componentes CRM e `routes/crm.ts` | SEC-01/02 | P1 |
| CRM-04 | Validar importação, deduplicação e exportação CSV | companies/CRM API e UI | Backup e massa controlada | P1 |
| CRM-05 | Entregar PDF real ou renomear exportação HTML | PDF helpers e companies route | Assets de marca | P2 |
| CRM-06 | Homologar campos customizados e forecast | schema companies, reports/CRM | DB-01 | P2 |

### 4.4 Discovery

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| DISC-01 | Validar Google Places → detalhes → Adicionar ao CRM | Discovery UI/API e CRM | CRM-01, SEC-01 | P1 |
| DISC-02 | Conferir algoritmo de score e social scan com casos conhecidos | Discovery services/routes | Dados de referência | P1 |
| DISC-03 | Configurar e testar PageSpeed | config/integration status/Discovery | Credencial Google | P2 |
| DISC-04 | Homologar GBP e Apollo | searches/integrations | OAuth, quota e consentimento | P2 |

### 4.5 Inteligência Artificial

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| IA-01 | Testar prompts, diagnósticos, sugestões e erros controlados | AI services/routes/settings | OpenAI e massa de teste | P1 |
| IA-02 | Confirmar persistência de tokens, custo e workspace | `nodere_ai_usage_log`, AI routes | DB-01 | P1 |
| IA-03 | Homologar propostas, contratos, resumos e templates gerados | proposals/contracts/AI/WhatsApp | CRM-01, BILL/WA quando aplicável | P2 |

### 4.6 WhatsApp

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| WA-01 | Configurar Cloud API no Meta Business | config/integration status/inbox | Credenciais e número aprovado | P1 |
| WA-02 | Corrigir `/api/inbox` e persistência de conversas | `routes/inbox.ts`, tabelas inbox | DB-05 | P0 |
| WA-03 | Consolidar webhook, validar assinatura e idempotência | `server.ts`, `routes/webhooks.ts`, `routes/inbox.ts` | WA-01/02 | P1 |
| WA-04 | Validar templates, anexos, histórico e associação ao lead | inbox/sequences/companies | WA-01/03 | P2 |

### 4.7 Marketing

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| MKT-01 | Recuperar `/api/marketing` e templates | `routes/marketing.ts`, campaigns/templates | DB-05, SEC-01 | P0 |
| MKT-02 | Homologar campanhas e canais sociais | marketing/social UI/API | Credenciais externas | P2 |

### 4.8 CMS

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| CMS-01 | Preservar worktree e separar CMS de sessão/CRM/CSS | arquivos locais listados na auditoria | Branch/checkpoint | P0 |
| CMS-02 | Revisar/aplicar `block_admin_cms.sql` em homologação | SQL CMS, `routes/content.ts` | DB-01/07 | P1 |
| CMS-03 | Testar uploads, URL pública, erro e fallback | ContentAdmin, Storage, DynamicCmsPage | CMS-02 | P1 |
| CMS-04 | Homologar home, contato, soluções, preços, blog, termos, privacidade, manual e `/pagina/{slug}` | páginas Web e CMS | CMS-02/03, SEC-02 | P1 |

### 4.9 Billing

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| BILL-01 | Configurar Stripe e prices mensal/anual | config, billing service/routes, Render/Stripe | Produtos e credenciais | P1 |
| BILL-02 | Corrigir sessão em `/billing/current` | billing route/session/Web API | SEC-04/06 | P1 |
| BILL-03 | Corrigir autenticação do portal/checkout | billing route/Web | SEC-06 | P1 |
| BILL-04 | Validar assinatura, idempotência e persistência do webhook | billing service, SQL bloco 04 | BILL-01, DB-01 | P1 |
| BILL-05 | Homologar upgrade, downgrade, cancelamento e renovação | Billing UI/API/Stripe | BILL-01/04 | P2 |

### 4.10 Relatórios

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| REP-01 | Remover timeout recorrente e medir chamadas | `ReportsClient.tsx`, reports API/services | Observabilidade | P1 |
| REP-02 | Implementar/homologar filtros e escopo por plano/perfil | reports UI/API | SEC-02, DB-06 | P1 |
| REP-03 | Validar PDFs, CSVs e consistência dos indicadores | PDF helpers/reports | REP-01/02 | P2 |

### 4.11 Mobile

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| MOB-01 | Executar matriz visual autenticada 375/390/414/768 | AppShell, Header, Sidebar, páginas críticas, CSS | Preview funcional | P1 |
| MOB-02 | Garantir Sair, menu e topbar sempre acessíveis | Header/Topbar/Sidebar | MOB-01 | P2 |
| MOB-03 | Corrigir overflow e controles cortados | CRM, Reports, Admin, tabelas, editor | MOB-01 | P2 |

### 4.12 PWA

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| PWA-01 | Testar instalação e standalone em Android/iOS | manifest, Header, PwaRegister | HTTPS/Preview | P1 |
| PWA-02 | Corrigir iconografia opaca e adicionar screenshot mobile | assets/manifest | Logo aprovado | P2 |
| PWA-03 | Testar cache, offline, atualização e logout | `sw.js`, PwaRegister | SEC-04 | P2 |

### 4.13 SEO

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| SEO-01 | Criar robots e sitemap válidos | rotas/metadata Next | Rotas públicas finais | P2 |
| SEO-02 | Revisar metadata, OG, crawl e branding legado | layout, páginas, docs, scanner | CMS-04 | P3 |

### 4.14 Integrações

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| INT-01 | Configurar SMTP e validar contato/teste | config, contact, settings | Credenciais Render | P2 |
| INT-02 | Planejar Bling/RD Station conforme ROI | integrations/config | Credenciais e escopo | P3 |
| INT-03 | Configurar Preview, logs e alertas | Vercel/Render/observabilidade | Acesso às plataformas | P2 |

### 4.15 Performance

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| PERF-01 | Otimizar relatórios, índices e queries lentas | Reports Web/API/DB | INT-03, DB-06 | P1 |
| PERF-02 | Eliminar reloads/chamadas duplicadas e aplicar cache/lazy loading | Web API helpers, páginas e layouts | Métricas de navegação | P2 |

### 4.16 UI/UX

| Item | Descrição | Arquivos envolvidos | Dependências | Prioridade |
|---|---|---|---|---|
| UX-01 | Unificar chaves de tema e revisar contraste | ThemeProvider, Topbar, globals.css | MOB-01 | P1 |
| UX-02 | Consolidar shells, overrides CSS e branding legado | Headers/Sidebars/layouts/docs/assets | UX-01 | P3 |

## 5. BLOCO 01 — ESTABILIZAÇÃO CRÍTICA

**Meta:** eliminar os 12 P0 e estabelecer uma base segura para qualquer evolução.

### Escopo obrigatório

1. Segurança e permissões: SEC-01, SEC-02, SEC-03 e SEC-04.
2. Sessão: token único, refresh, cookie, logout e middleware.
3. Schema: DB-01, DB-02, DB-03 e DB-04.
4. Endpoints 404: audit/intelligence e rotas da ficha.
5. Endpoints 500: communications, contracts, files, inbox, marketing, proposals e roles.
6. Preservação: CMS-01 antes de qualquer commit/deploy.

### Entregáveis

- Inventário SQL real e migração incremental proposta.
- Matriz de autorização automatizada.
- Sessão persistente homologada.
- Todos os endpoints críticos sem 404/500.
- Branches/commits separados por escopo.
- Builds API/Web e regressão Preview aprovados.

### Critério de aceite

- Sem sessão: 401.
- Sessão sem permissão: 403.
- Owner/admin/operator: 200 apenas no escopo permitido.
- Viewer: somente leitura.
- Nenhuma tabela paralela criada ou usada.
- Nenhum P0 aberto.

## 6. BLOCO 02 — RECUPERAÇÃO OPERACIONAL

**Meta:** recuperar os fluxos comerciais completos e chegar a 84% de conclusão estimada.

### Escopo obrigatório

- CRM: ficha, Histórico, Contatos, Negociações, Kanban, DnD, CSV e campos customizados.
- Discovery: busca, detalhes, score, scanner e Adicionar ao CRM.
- Relatórios: UI, filtros, permissões, PDF e CSV.
- Propostas e contratos: CRUD, versões, associação, download e PDF real.
- Arquivos: upload, listagem, exclusão e Storage.

### Critério de aceite

- Jornada Google Places → CRM → ficha → tarefa/atividade → proposta funciona E2E.
- PDF e CSV geram arquivos válidos.
- Dados respeitam workspace, papel e plano.
- Nenhum fluxo usa memória como fonte principal.

## 7. BLOCO 03 — EXPERIÊNCIA DO USUÁRIO

**Meta:** homologar desktop, tablet, mobile e PWA, elevando a conclusão estimada para 92%.

### Escopo obrigatório

- Viewports 375, 390, 414, 768 e desktop.
- Tema claro e tema escuro em todas as rotas prioritárias.
- Responsividade de menu, topbar, Sair, cards, Kanban, relatórios, ficha e admin.
- PWA: install prompt, standalone, ícones, cache, atualização e logout.
- Performance: navegação, lazy loading, cache e chamadas duplicadas.

### Critério de aceite

- Zero overflow crítico ou controle inacessível.
- Contraste WCAG adequado nos dois temas.
- Troca de rota sem reload completo e sem timeout recorrente.
- Instalação PWA comprovada em pelo menos um Android e um iOS.

## 8. BLOCO 04 — EXPANSÃO

**Meta:** concluir CMS e integrações externas, projetando 100% do escopo auditado.

### Escopo obrigatório

- CMS: SQL, Storage, páginas, menus, blog, SEO, fallback e publicação.
- WhatsApp: Cloud API, webhook, Inbox, templates, anexos e histórico.
- Marketing: campanhas e canais sociais.
- OpenAI: diagnósticos, logs de uso, propostas, contratos e resumos.
- Integrações: SMTP, Stripe, PageSpeed, GBP, Apollo, Bling e RD Station conforme prioridade.

### Critério de aceite

- Cada integração retorna resultado real ou erro controlado documentado.
- Nenhuma credencial aparece no frontend.
- Webhooks são assinados, idempotentes e persistentes.
- CMS mantém fallback se não houver conteúdo publicado.
- Percentual de 100% depende do fornecimento e aprovação das credenciais externas.

## 9. Cronograma Mestre

| Horizonte | Objetivo | Entregas principais | Percentual projetado |
|---|---|---|---:|
| **7 dias** | Conter risco e preservar estado | Branch/checkpoint, inventário SQL, role guards iniciais, sessão definida, logs habilitados | 65% |
| **15 dias** | Concluir BLOCO 01 | Zero P0, schema único, endpoints críticos recuperados, Preview seguro | 72% |
| **30 dias** | Concluir BLOCO 02 | CRM/Discovery/relatórios/propostas/contratos/arquivos E2E | 84% |
| **60 dias** | Concluir BLOCO 03 | Mobile, temas, responsividade, PWA e performance homologados | 92% |
| **90 dias** | Concluir BLOCO 04 | CMS e integrações externas homologadas | 100%* |

\* Condicionado à disponibilidade de credenciais, aprovação Meta/Stripe/Google e ausência de bloqueios externos.

## 10. Dependências Externas

- Acesso ao Supabase SQL Editor e backup recente.
- Usuários reais owner, admin, operator e viewer.
- Acesso a logs/configuração do Render.
- Variáveis equivalentes no Vercel Preview.
- Credenciais SMTP, Stripe, Meta/WhatsApp, PageSpeed, GBP, Apollo, Bling e RD Station.
- Dispositivo Android e iOS para homologação PWA.

## 11. Governança de Execução

1. Uma branch e um commit por escopo.
2. Nenhum SQL automático; toda migração deve ser incremental, revisada e aplicada manualmente.
3. Nenhum deploy se API build, Web lint/build ou testes P0 falharem.
4. Preview obrigatório antes de produção.
5. Evidência por item: comando, status HTTP, screenshot ou consulta SQL.
6. Rollback definido antes de cada promoção.
7. Tag estável somente com checklist crítico integralmente aprovado.

## 12. Checklist Final de Execução

### BLOCO 01

- [ ] Worktree preservado e separado.
- [ ] Schema real inventariado.
- [ ] Schemas paralelos neutralizados.
- [ ] `onboardingStore.ts` usa `nodere_workspaces`.
- [ ] Matriz owner/admin/operator/viewer homologada.
- [ ] Sessão, refresh, logout e reentrada aprovados.
- [ ] Endpoints 404/500 críticos recuperados.
- [ ] Builds e Preview aprovados.

### BLOCO 02

- [ ] Ficha 360 completa.
- [ ] Histórico, Contatos e Negociações CRUD.
- [ ] Kanban e DnD persistentes.
- [ ] Discovery → CRM E2E.
- [ ] Relatórios e filtros por perfil/plano.
- [ ] PDF/CSV válidos.
- [ ] Propostas, contratos e arquivos operacionais.

### BLOCO 03

- [ ] Viewports 375/390/414/768/desktop aprovados.
- [ ] Tema claro e escuro aprovados.
- [ ] Sair/menu/topbar acessíveis no celular.
- [ ] PWA Android/iOS instalada e funcional.
- [ ] Sem overflow crítico.
- [ ] Performance de rotas e relatórios dentro da meta.

### BLOCO 04

- [ ] CMS e fallback publicados.
- [ ] Storage e uploads homologados.
- [ ] WhatsApp/Inbox/webhooks operacionais.
- [ ] Marketing e social homologados.
- [ ] OpenAI com log de tokens/custos.
- [ ] SMTP real validado.
- [ ] Stripe e ciclo de assinatura homologados.
- [ ] PageSpeed/GBP/Apollo e integrações priorizadas homologadas.
- [ ] Robots, sitemap e SEO aprovados.

## 13. Resultado Projetado

O plano parte de **58% de conclusão estimada**, elimina primeiro os riscos de segurança e dados, recupera a operação comercial, homologa a experiência do usuário e somente então ativa CMS e integrações externas. Com os quatro blocos concluídos e as credenciais externas disponíveis, a projeção é **100% do escopo identificado na auditoria**, com baseline apta a uma nova tag estável.
