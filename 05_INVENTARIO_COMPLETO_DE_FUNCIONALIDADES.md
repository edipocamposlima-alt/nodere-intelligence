# 05 — Inventário completo de funcionalidades

## Superfície AI-first

- `/ai`: chat streaming, histórico, agentes, modelos, saldo, aprovação e recibos.
- Registro: GPT-5.6 Luna/Terra/Sol e quatro agentes comerciais.
- Ferramentas iniciais: listar empresas, obter empresa, criar lead e mover etapa.
- Persistência: conversas, mensagens, execuções e recibos por workspace.
- Compatibilidade medida: diagnóstico, mensagem WhatsApp, roteiro, próxima etapa, insight comercial, teste vertical, melhoria de proposta e `/api/openai/analyze`.

## Módulos preservados

Dashboard, Discovery, Empresas, CRM/Funil, Leads, Agenda, Propostas, Catálogo, Inbox, Automações, Relatórios, Operadores, Marketing, Faturamento, Configurações, Integrações, Admin/CMS, PWA e PDFs continuam no mesmo produto e banco.

## Expansão comercial V5

- `/crm/briefings`: lista, busca, filtros, criação e importação/exportação do Briefing Comercial.
- `/crm/briefings/[id]`: editor dos 47 campos, salvamento otimista, conclusão, versões, PDF, anexos e apoio da IA.
- `/crm/communications`: templates versionados, composição, consentimento, outbox, histórico e estado das integrações.
- `/crm/lifecycle`: arquivo, lixeira, restauração e purga protegida.
- Ficha 360: aba de briefings vinculados à empresa.
- Empresas: nomenclatura de Clientes preservando a entidade canônica.

## Limites explícitos

WhatsApp por `wa.me` é assistido. Gmail está pendente sem credenciais. Anexos de comunicação são referenciados na outbox, mas ainda não transmitidos pelo adaptador SMTP/Gmail. Migração D1/R2 não foi executada sem exportação do legado. Pagamentos, computer use e web search não foram expostos como ferramentas operacionais.
