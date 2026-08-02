# 22 — Análise do avanço V3 e retomada

## Base preservada

- Fonte oficial: monorepo NODERE, branch `codex/nodere-ai-first-v3`.
- Checkpoint de retomada: `fb49f25`.
- Base de produção anterior: `098ef84` (`v1.1.0`).
- O trabalho V3 foi preservado e ampliado; não houve reinicialização do produto nem criação de CRM paralelo.

## Avanços validados

- NODERE AI, registro de modelos/agentes, gateway, ferramentas tipadas e ledger permaneceram na mesma aplicação.
- A migração AI-first foi aplicada no Supabase e validada com 3 modelos, 4 agentes, carteira e lançamento inicial.
- A V5 acrescentou Briefing Comercial, Comunicações Unificadas, ciclo de vida seguro do CRM, integrações com Ficha 360 e identidade visual NODERE.
- Builds, typechecks, auditorias de dependências e 61 testes da API foram aprovados antes da publicação.

## Decisões de continuidade

1. Supabase continua como fonte canônica de dados.
2. O backend continua como única camada autorizada a usar secrets e service role.
3. O frontend nunca chama provedores de IA diretamente.
4. WhatsApp por `wa.me` permanece classificado como assistido.
5. Gmail permanece pendente até existirem credenciais e teste controlado.

## Limites externos atuais

- Não foi entregue exportação do legado Cloudflare D1/R2; portanto não houve reconciliação de registros legados.
- Não há ambiente de staging isolado com credenciais próprias.
- Não foram fornecidas contas owner/admin/SDR/viewer para homologação autenticada completa.
- Geração paga de IA e envio a destinatário real não foram executados sem confirmação específica.

