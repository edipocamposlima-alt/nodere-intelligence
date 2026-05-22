# Nodere Intelligence

SaaS de prospeccao comercial para localizar empresas com falhas digitais, enriquecer dados publicos e transformar sinais de baixa maturidade em oportunidades para Google Ads, trafego pago e consultoria digital.

## Produto

- Web app responsivo para operacao completa de busca, auditoria, CRM, automacao e relatorios.
- Mobile app como PWA instalavel na primeira fase, evoluindo para React Native/Expo quando houver APIs reais e notificacoes nativas.
- CRM inteligente com pipeline, tarefas, follow-up, diagnosticos automaticos e scores comerciais.
- Motor de enriquecimento preparado para Google Places, Google Ads, Meta, WhatsApp, Receita Federal, Hunter, Clearbit, Apollo e HubSpot.

## Arquitetura Recomendada

- Frontend: Next.js, React, TypeScript, Tailwind ou CSS Modules.
- Backend: Node.js com NestJS ou Fastify.
- Banco: PostgreSQL com Prisma.
- Autenticacao: Firebase Authentication ou Auth.js com provedores corporativos.
- Jobs: Cloud Functions, Cloud Run Jobs ou BullMQ para varreduras e enriquecimento.
- Cache e filas: Redis.
- Arquivos e exports: Cloud Storage para PDFs, CSVs, XLSX e prints de sites.
- Observabilidade: Sentry, OpenTelemetry e logs estruturados.

## Modulos

1. Auth e organizacoes
   - Usuarios, permissoes por aba, times, workspace e trilha de auditoria.
   - O Owner pode liberar ou bloquear modulos individualmente para cada usuario.
   - Convites geram token temporario, papel inicial e permissoes antes do primeiro login.

2. Discovery
   - Busca por cidade, segmento, palavra-chave, regiao e criterios de presenca digital.

3. Enrichment
   - Normalizacao de nome, telefone, site, redes sociais, CNPJ, endereco e dados publicos.

4. Digital Audit
   - Scanner de site, SEO basico, tags, pixels, velocidade, WhatsApp, GA4, GTM e eventos.

5. Scoring
   - Score de oportunidade, maturidade digital, potencial comercial e trafego pago.

6. CRM
   - Pipeline Kanban, tarefas, lembretes, anotacoes, historico, agenda e follow-up.

7. AI Copilot
   - Diagnostico automatico, abordagem comercial, emails, scripts de WhatsApp e previsao de fechamento.

8. Reporting
   - Exportacao PDF, Excel e CSV com ranking por cidade, nicho, falha digital e potencial.

9. WhatsApp
   - Fase 1: abertura de conversa via `wa.me` ou WhatsApp Web com mensagem pre-preenchida.
   - Fase 2: WhatsApp Cloud API com template aprovado, envio transacional, webhooks de status e historico no CRM.
   - Fase 3: caixa de entrada compartilhada por workspace, atribuicao de SDR, SLA e automacoes.

10. Google Intelligence
   - Business Profile: locais, verificacoes, reviews, posts, perguntas e respostas, fotos, notificacoes e performance.
   - Google Ads: conversoes, assets, recomendacoes, campanhas, palavras-chave, lead forms, chamadas e conversoes offline.
   - Tracking: Google Tag, GTM, GA4, PageSpeed e qualidade de eventos.
   - CRM loop: enviar reunioes/fechamentos offline para melhorar otimizacao de campanhas.

11. Billing e creditos
   - Planos por workspace, limites de usuarios, creditos de varredura, exportacoes e modulos premium.
   - Eventos de consumo por busca, enriquecimento, diagnostico, WhatsApp e exportacao.
   - Faturas, upgrades, creditos extras e trilha de auditoria financeira.

12. Performance comercial
   - Metas por usuario, ranking de SDR/closer, forecast de receita e produtividade por canal.
   - SLA de resposta, taxa de reuniao, propostas abertas e receita esperada por pipeline.

## Entidades Principais

- Organization
- User
- UserPermission
- ModuleAccess
- Lead
- Company
- Contact
- DigitalAudit
- Score
- PipelineStage
- Deal
- Task
- Interaction
- AutomationRule
- ReportExport
- IntegrationCredential

## API Inicial

- `POST /auth/session`
- `GET /users`
- `POST /users/invite`
- `POST /users/accept-invite`
- `PATCH /users/:id/permissions`
- `GET /leads`
- `POST /leads/search`
- `GET /leads/:id`
- `POST /leads/:id/enrich`
- `POST /leads/:id/audit`
- `POST /leads/:id/diagnosis`
- `PATCH /deals/:id/stage`
- `POST /tasks`
- `POST /automations/rules`
- `POST /reports/export`
- `POST /whatsapp/templates`
- `POST /whatsapp/messages`
- `POST /webhooks/whatsapp`
- `POST /google/connect`
- `GET /google/business-profile/:leadId/audit`
- `GET /google/ads/:leadId/readiness`
- `POST /google/ads/:leadId/conversion-plan`
- `POST /google/ads/offline-conversions`
- `POST /webhooks/google-business-profile`
- `GET /billing/subscription`
- `GET /billing/usage`
- `POST /billing/checkout`
- `POST /billing/credits`
- `GET /billing/invoices`
- `GET /performance/forecast`
- `GET /performance/operators`
- `GET /performance/goals`
- `GET /performance/activity`

## Google Ads e Perfil da Empresa

Possibilidades de absorcao e integracao:

- Descobrir empresas locais com Maps/Places e enriquecer dados basicos.
- Auditar Perfil da Empresa: completude, categoria, telefone, site, horarios, fotos, posts, reviews e Q&A.
- Medir performance local: chamadas, rotas, cliques no site e buscas no Perfil da Empresa.
- Criar alertas de novas avaliacoes, alteracoes de perfil e oportunidades de reputacao.
- Auditar Google Ads: campanhas, conversoes, chamadas, assets, lead forms, palavras-chave e recomendacoes.
- Gerar plano de conversao: chamada, formulario, WhatsApp, compra, agendamento e evento offline.
- Verificar lacunas de assets: sitelinks, callouts, call assets, lead form assets, imagens e responsive search ads.
- Criar sugestoes de Performance Max/Search por nicho e cidade.
- Importar conversoes offline do CRM para fechar o ciclo entre prospeccao, venda e ROI.

## WhatsApp Cloud API

Para envio automatico sem abrir uma nova aba, o backend precisa armazenar credenciais da Meta com seguranca:

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `META_ACCESS_TOKEN`
- `META_VERIFY_TOKEN`

Fluxo recomendado:

1. Usuario seleciona lead e template aprovado.
2. Backend valida permissao, opt-in e limite do plano.
3. Backend chama a WhatsApp Cloud API.
4. Webhook recebe status de envio, entrega, leitura e resposta.
5. CRM registra a interacao no historico do lead.

## Controle de Acesso

No prototipo, as permissoes por aba ficam no navegador para demonstracao. Em producao, esse controle precisa ser aplicado em tres camadas:

1. Frontend: esconder abas e bloquear rotas sem permissao.
2. Backend: validar permissao em cada endpoint, independentemente do frontend.
3. Banco: registrar mudancas de permissao em trilha de auditoria.

Exemplo de permissoes por usuario:

- `dashboard`
- `search`
- `scanner`
- `company`
- `crm`
- `automation`
- `copilot`
- `reports`
- `admin`

Fluxo de convite recomendado:

1. Owner cria convite informando nome, email, papel e abas liberadas.
2. Backend gera token com expiracao e envia email/WhatsApp.
3. Usuario aceita convite e cria autenticacao no Firebase/Auth.js.
4. Backend vincula o usuario ao workspace e salva permissoes.
5. Toda rota do frontend e endpoint do backend valida o acesso ativo.

## Cuidados Legais e Tecnicos

- Usar APIs oficiais sempre que possivel e respeitar termos de uso de Google, Meta e demais provedores.
- Evitar scraping agressivo, coleta excessiva e dados sensiveis sem base legal.
- Registrar fonte, data e confianca de cada dado coletado.
- Implementar consentimento, controle de acesso, criptografia e politicas de retencao.
- Separar dados por organizacao para isolamento multi-tenant.
