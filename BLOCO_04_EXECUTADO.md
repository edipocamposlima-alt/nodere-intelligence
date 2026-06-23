# BLOCO 04 EXECUTADO - WHATSAPP E HISTORICO

## Branch

- Branch ativa: `fase-02-desenvolvimento`
- Deploy: nao executado
- SQL em producao: nao executado

## Itens implementados

- Historico de conversas por lead/empresa via `GET /api/inbox/company/:companyId`.
- Armazenamento estruturado de mensagens em `inbox_messages`.
- Timeline cronologica por empresa no backend e na ficha comercial.
- Registro de mensagens enviadas, recebidas e manuais.
- Anexos vinculados ao lead/empresa via metadados estruturados.
- Templates padrao WhatsApp:
  - Primeira abordagem
  - Follow-up
  - Agendamento
  - Apresentacao
  - Proposta
  - Recuperacao de oportunidade
  - Pos-venda
- Integracao do historico WhatsApp na aba Historico da ficha comercial.
- Webhook WhatsApp preservado como rota publica e com persistencia quando Supabase/workspace puder ser inferido.
- Permissoes:
  - Owner/Admin/Operator leem e gravam.
  - Viewer le, mas nao grava nem altera status.

## Arquivos alterados

- `apps/api/package.json`
- `apps/api/src/routes/inbox.ts`
- `apps/api/src/routes/webhooks.ts`
- `apps/api/src/services/inbox.ts`
- `apps/api/src/tests/whatsapp-history.test.ts`
- `apps/web/app/inbox/InboxClient.tsx`
- `apps/web/components/crm/LeadDrawer.tsx`
- `apps/web/lib/api.ts`
- `apps/web/lib/types.ts`
- `RELATORIO_PRE_EXECUCAO_BLOCO_04.md`

## APIs alteradas ou adicionadas

- `GET /api/inbox`
- `POST /api/inbox`
- `PATCH /api/inbox/:id`
- `GET /api/inbox/templates`
- `GET /api/inbox/company/:companyId`
- `POST /api/inbox/:phone/reply`
- `POST /api/webhooks/whatsapp`

## Tabelas impactadas

- `inbox_messages`
- `communications`
- `nodere_companies`

Nao foram criadas tabelas novas. Nao foram criadas estruturas paralelas de users, workspaces, leads ou companies.

## Testes executados

- `apps/api`: `npm run lint` - OK
- `apps/api`: `npm run build` - OK
- `apps/api`: `npm run test:whatsapp` - OK
- `apps/api`: `npm run test:phase1` - OK
- `apps/api`: `npm run test:calendar` - OK
- `apps/api`: `npm run test:reports` - OK
- `apps/api`: `npm run test:crm` - OK
- `apps/web`: `npm run build` - OK
- `apps/web`: `npm run lint` - OK

## Riscos encontrados

- Envio real via WhatsApp Cloud continua dependente de credenciais externas `WHATSAPP_CLOUD_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`.
- Webhook publico pode receber mensagem sem conseguir inferir workspace/empresa pelo telefone; nesses casos o fallback em memoria permanece controlado.
- Anexos foram implementados como URLs/metadados. Upload binario direto exige bucket/Storage validado em etapa propria.

## Pendencias restantes

- Configurar credenciais reais WhatsApp Cloud no ambiente de producao quando for autorizado.
- Validar webhook real com payload Meta/WhatsApp em ambiente conectado.
- Opcional: criar fluxo de upload de anexo para Supabase Storage em bloco futuro.

## Resultado

Bloco 4 implementado localmente, sem deploy e sem SQL em producao.
