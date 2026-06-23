# RELATORIO PRE EXECUCAO - FASE 2 BLOCO 4

## Escopo

Implementar exclusivamente WhatsApp e historico de conversas na branch `fase-02-desenvolvimento`, sem iniciar Bloco 5 ou Bloco 6 e sem alterar funcionalidades homologadas dos Blocos 1, 2 e 3.

## Arquivos impactados

### API

- `apps/api/src/routes/inbox.ts`
  - Ajustar permissoes de leitura/escrita.
  - Persistir mensagens de WhatsApp no Supabase.
  - Expor historico cronologico por lead/empresa.
  - Expor templates padrao de WhatsApp.
  - Registrar anexos como metadados estruturados.

- `apps/api/src/routes/webhooks.ts`
  - Persistir eventos recebidos do WhatsApp em `inbox_messages` quando Supabase estiver configurado.
  - Manter fallback em memoria para ambientes locais sem Supabase.

- `apps/api/src/services/inbox.ts`
  - Centralizar templates padrao.
  - Normalizar payloads de mensagem/anexos.
  - Manter fallback em memoria apenas como fallback, nao como fonte principal quando Supabase existir.

- `apps/api/src/tests/whatsapp-history.test.ts`
  - Testes de templates, ordenacao cronologica e montagem de payload.

- `apps/api/package.json`
  - Adicionar script de teste especifico do Bloco 4.

### Web

- `apps/web/lib/api.ts`
  - Tipar mensagens persistentes, anexos e templates.
  - Adicionar helpers de templates e conversas por empresa.

- `apps/web/lib/types.ts`
  - Atualizar tipos do Inbox persistente.

- `apps/web/app/inbox/InboxClient.tsx`
  - Exibir templates de WhatsApp.
  - Registrar mensagens enviadas/recebidas com anexos vinculados.
  - Timeline cronologica por mensagem.

- `apps/web/components/crm/LeadDrawer.tsx`
  - Integrar o historico de WhatsApp/communications ao historico comercial existente sem alterar o funil avancado.

## APIs impactadas

- `GET /api/inbox`
- `POST /api/inbox`
- `PATCH /api/inbox/:id`
- `GET /api/inbox/templates`
- `GET /api/inbox/company/:companyId`
- `POST /api/inbox/:phone/reply`
- `POST /api/webhooks/whatsapp`
- `GET /api/leads/:id/activities`
- `POST /api/leads/:id/activities`

## Tabelas impactadas

Nao sera criada tabela paralela.

- `public.inbox_messages`
  - Fonte principal para mensagens estruturadas do Inbox/WhatsApp.
  - Metadados usados para `attachments`, `templateKey`, `providerMessageId`, `companyName` e `conversationPhone`.

- `public.communications`
  - Historico comercial integrado ao CRM/lead.
  - Mensagens WhatsApp relevantes tambem ficam visiveis na timeline da ficha.

- `public.nodere_companies`
  - Usada somente para vinculo de empresa/lead e enriquecimento visual.

## Componentes impactados

- `InboxClient`
- `LeadDrawer`
- Helpers de API do frontend.

## Permissoes planejadas

- Owner/Admin/Operator:
  - Leem conversas.
  - Criam mensagens.
  - Atualizam status.
  - Usam templates.

- Viewer:
  - Le somente mensagens e historico.
  - Nao cria, edita, responde ou resolve conversas.

## Riscos antes da execucao

- Webhook publico nao possui sessao; por isso mensagens recebidas sem workspace autenticado so podem ser persistidas quando houver workspace inferido pelo telefone ou metadado. Caso contrario, mantem fallback controlado em memoria.
- `inbox_messages` ja existe no schema local, mas se a producao nao tiver todas as colunas, o sistema deve retornar erro controlado ou fallback vazio em leitura.
- Envio real via WhatsApp Cloud depende de `WHATSAPP_CLOUD_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`; sem credenciais, o sistema deve registrar historico e retornar link `wa.me` controlado.

## Validacoes planejadas

- `npm run lint`
- `npm run build`
- `npm run test:whatsapp`
- `npm run test:phase1`
- `npm run test:calendar`
- `npm run test:reports`
- `npm run test:crm`
- Build web com `npm run build`
