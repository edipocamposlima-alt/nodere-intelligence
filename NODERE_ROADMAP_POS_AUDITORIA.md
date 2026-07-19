# NODERE — Roadmap Pós-Auditoria

Data base: 2026-07-18

O roadmap parte do que ficou comprovado. Prazos são janelas sugeridas e dependem de responsável/ambiente, não promessas automáticas.

## Fase 0 — proteção imediata (0–3 dias)

| Item | Saída | Dono sugerido | Gate |
|---|---|---|---|
| Criar backup verificável do Supabase | snapshot + restauração testada | Infra/DBA | restore em staging |
| Criar staging do banco/API | ambiente isolado | Infra | health e dados sintéticos |
| Criar conta E2E exclusiva | usuário/workspace descartável | Admin | login automatizado |
| Reconciliar usuários | lista aprovada de manter/desativar/vincular | Produto + Admin | 0 órfãos ativos |
| Ativar leaked password protection | configuração Auth | Admin Supabase | advisor limpo |

## Fase 1 — hardening e certificação (3–10 dias)

- executar migração e rollback no staging;
- revisar sete políticas e helpers com usuários de cada papel;
- aplicar o hardening em produção numa janela com backup e monitoramento;
- executar todos os fluxos E2E autenticados em desktop e mobile;
- validar PWA instalado em Android e iOS físicos;
- testar Maps, PageSpeed, WhatsApp Cloud, Apollo e Econodata em sandbox/conta teste;
- remover/rotacionar `NEXT_PUBLIC_API_KEY` da Vercel se não houver consumidor externo.

## Fase 2 — dados e desempenho (2–4 semanas)

- completar CNPJ onde houver fonte legítima e medir duplicidades;
- definir PK para as 13 tabelas sem chave, após análise de compatibilidade;
- indexar as 19 FKs conforme consultas reais e `EXPLAIN`;
- observar antes de remover 31 índices atualmente sem uso;
- dividir dependências de Ficha, Empresas, Marketing, Calendário, CRM e Relatórios;
- introduzir orçamento de bundle e Core Web Vitals no CI.

## Fase 3 — produto e governança (1–2 meses)

- instalar/validar schema oficial do CMS e eliminar estados simulados;
- persistir customização de funil por workspace, com histórico/auditoria;
- unificar catálogo de permissões entre frontend, API e políticas;
- criar painel de saúde de integrações com último teste, latência e erro;
- automatizar evidência de deploy e versão do frontend;
- adicionar axe/Lighthouse e snapshots visuais aos caminhos críticos.

## Indicadores de conclusão

- 100% dos usuários ativos vinculados a Auth e workspace;
- 0 alerta WARN de função insegura no advisor acordado;
- 100% dos cenários críticos E2E executados, sem skip;
- 0 rota crítica acima do orçamento de First Load JS definido pelo time;
- integrações rotuladas como ativa, degradada, não configurada ou não verificada;
- restore de backup testado trimestralmente;
- Manual e Relatórios revisados no mesmo ciclo de cada mudança relevante.

## Fora de escopo automático

Remover dados, fundir serviços Render, alterar planos pagos, criar contas em provedores e executar SQL em produção exigem decisão humana e, quando aplicável, credenciais administrativas próprias.
