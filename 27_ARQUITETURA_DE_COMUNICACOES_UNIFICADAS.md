# 27 — Arquitetura de Comunicações Unificadas

## Fluxo

`Briefing/Ficha 360/CRM → modelo/versionamento → composição → consentimento → outbox → provedor/wa.me → evento imutável → timeline`

## Componentes

- UI: `/crm/communications`, com acesso contextual pelo Briefing.
- API: `/api/communications-center`.
- Dados: templates/versionamento, threads, eventos imutáveis, outbox e conexões.
- E-mail: SMTP quando configurado; Gmail permanece explicitamente desconectado sem OAuth válido.
- WhatsApp: modo assistido que abre `wa.me`; não simula envio, entrega ou leitura.

## Estados e garantias

- Estados da fila: pending, processing, sent, failed e cancelled.
- Idempotência por workspace + chave fornecida pelo cliente.
- Retry com backoff e limite de tentativas.
- Consentimento obrigatório e quiet hours antes de envio automático.
- Timeline por empresa/contato e auditoria de mutações.

## Limite aberto

`attachmentRefs` é persistido na outbox, mas o adaptador SMTP/Gmail ainda não resolve e transmite os bytes referenciados. Anexo de comunicação não deve ser considerado operacional até esse adaptador e um teste sandbox serem concluídos.

