# ADR-001 — AI Gateway central

Data: 2026-07-22
Status: aceito no código; ativação produtiva pendente

## Decisão

Toda geração de IA passa pelo backend apps/api. O frontend usa apenas /api/backend/ai/chat. O gateway resolve agente e modelo no registry, valida perfil/workspace, reserva crédito, persiste execução, expõe ferramentas tipadas, transmite UI stream e captura o uso.

## Motivos

Um único ponto impede segredos no navegador, chamadas sem medição e respostas simuladas. A Responses API é usada para OpenAI. Provedores adicionais entram no registry sem criar chave por modelo.

## Consequências

Sem banco, carteira ou secret backend, a chamada falha fechada. Endpoints legados de geração usam o mesmo caminho medido. A migração do schema é pré-requisito para ativar /ai.
