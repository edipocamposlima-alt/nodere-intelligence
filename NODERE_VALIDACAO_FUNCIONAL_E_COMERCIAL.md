# NODERE — Validação Funcional e Comercial

Data: 2026-07-19  
Versão: 1.1.0

## Fluxo comercial validado

| Etapa | Evidência | Resultado |
|---|---|---|
| Login e sessão | gate privado, renovação e smoke autenticado | aprovado |
| Prospecção | página de buscas e backend Google configurado | navegação aprovada; busca real específica pendente |
| Salvar empresa | suíte de API e fluxo canônico de ID | aprovado em testes |
| CRM/Funil | pipeline/lista, etapas, métricas e smoke | aprovado |
| Ficha 360 | resolução de ID persistido, páginas e APIs | aprovado em testes/smoke |
| Agenda/follow-up | suíte de calendário | 5/5 |
| Propostas/contratos | regras, documentos e smoke | aprovado; envio real externo não aplicável |
| Relatórios | suíte e navegação | 4/4 e smoke aprovado |
| WhatsApp | suíte manual/webhook | 5/5; Cloud não configurado |
| Importação | validação/limites/deduplicação | 4/4 |
| Admin/convites | convite sem senha conhecida | implementação aprovada; convite real não disparado |

## Regras comerciais corrigidas

- onboarding reflete registros reais do workspace;
- conversão do funil respeita progressão acumulada e limite de 100%;
- status de integração não promete operação sem probe;
- providers opcionais não são marcados como mandatórios pelo plano;
- criação de operador ocorre por convite oficial, sem compartilhar senha temporária;
- páginas de análise não retornam score inventado quando o provedor está ausente.

## Limites da certificação

Não foram enviados e-mails, convites, mensagens WhatsApp, cobranças Stripe ou publicações em redes sociais reais. Essas ações teriam efeito externo e dependem de credenciais, contas de teste e aprovação operacional. Google Places, Maps e Apollo estão configurados, mas ainda precisam de um caso de ida e volta controlado para certificação comercial.

## Aceite recomendado

Aceitar a versão 1.1.0 para operação nas funções comprovadas. Manter integrações não certificadas com rótulo pendente e impedir promessa comercial até que cada provedor passe pelo roteiro de `NODERE_MATRIZ_INTEGRACOES_EXTERNAS.md`.
