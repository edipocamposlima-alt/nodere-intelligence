# NODERE — Backup, Staging e Rollback

Data: 2026-07-19  
Status: **BLOQUEADO PARA MUTAÇÕES DE BANCO**

## Evidência encontrada

O painel do projeto Supabase informa plano Free e ausência de backups do projeto. Não há snapshot, PITR ou dump restaurável disponibilizado. Também não foi localizado projeto staging, branch de banco, `DATABASE_URL` remoto protegido, Supabase CLI, Docker ou binários `pg_dump`/`pg_restore`/`psql` utilizáveis neste workspace.

Por isso, não foi possível cumprir a prova indispensável de restauração. Copiar dados por consultas não equivale a backup transacional restaurável e não foi apresentado como tal.

## Decisão aplicada

- nenhuma função, política RLS, vínculo Auth ou dado produtivo foi alterado;
- a migração e o rollback foram preparados, revisados e versionados;
- o reconciliador permaneceu em dry-run e recusou execução local sem ambiente protegido;
- o baseline dos advisors foi preservado para comparação futura.

## Plano mínimo de desbloqueio

1. elevar o plano ou produzir dump consistente com ferramentas oficiais;
2. armazenar o backup criptografado e registrar checksum, horário e responsável;
3. restaurar em projeto staging isolado;
4. validar contagens, constraints, funções, grants e políticas;
5. executar a migração em staging dentro de transação;
6. testar owner/admin/operator/viewer, isolamento entre workspaces e service role;
7. executar rollback em staging e comparar o baseline;
8. aprovar janela, responsável e critérios de abortar produção;
9. gerar novo backup imediatamente antes da janela;
10. aplicar em produção e acompanhar advisors/logs.

## Rollback por camada

| Camada | Procedimento |
|---|---|
| Web | promover deployment Vercel anterior aprovado e validar domínio/health |
| API | promover deployment Render anterior e validar versão/health/CORS |
| Banco | executar o rollback SQL pareado somente após a migração correspondente |
| Identidade | usar o log/checkpoint do reconciliador; não excluir contas em massa |

O rollback SQL restaura o estado observado, inclusive helpers e políticas legadas. Ele não substitui restore e não deve ser executado isoladamente.
