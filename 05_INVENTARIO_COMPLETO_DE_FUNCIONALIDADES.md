# 05 — Inventário completo de funcionalidades

## Superfície AI-first

- `/ai`: chat streaming, histórico, agentes, modelos, saldo, aprovação e recibos.
- Registro: GPT-5.6 Luna/Terra/Sol e quatro agentes comerciais.
- Ferramentas iniciais: listar empresas, obter empresa, criar lead e mover etapa.
- Persistência: conversas, mensagens, execuções e recibos por workspace.
- Compatibilidade medida: diagnóstico, mensagem WhatsApp, roteiro, próxima etapa, insight comercial, teste vertical, melhoria de proposta e `/api/openai/analyze`.

## Módulos preservados

Dashboard, Discovery, Empresas, CRM/Funil, Leads, Agenda, Propostas, Catálogo, Inbox, Automações, Relatórios, Operadores, Marketing, Faturamento, Configurações, Integrações, Admin/CMS, PWA e PDFs continuam no mesmo produto e banco.

## Não implementado nesta fatia

Envio externo de WhatsApp/e-mail pela IA, deleção, pagamentos pela IA, computer use e web search não foram expostos como ferramentas. Isso é deliberado até existir política de confirmação e testes específicos.
