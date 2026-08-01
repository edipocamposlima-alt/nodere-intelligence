# ADR-003 — Chaves e registry de modelos

Data: 2026-07-22
Status: aceito

## Decisão

Cada ambiente mantém uma chave por provedor somente no backend. Modelos não recebem chaves próprias. O registry guarda identificador do provedor, preço, tier, reasoning effort, perfis autorizados e estado. Agentes guardam modelos e ferramentas permitidos.

## Controles

O frontend recebe apenas metadados públicos do registry. Modelo sem provedor configurado, desabilitado, fora da lista do agente ou proibido ao perfil falha antes da reserva. O modelo frontier não é oferecido a viewer.

## Estado

A chave local Codex foi criada, salva em .env.local ignorado e validada por GET /v1/models HTTP 200. Produção não foi alterada. Não há staging comprovado e a rotação do possível openai_key legado de workspace está pendente.
