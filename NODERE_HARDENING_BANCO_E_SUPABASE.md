# NODERE — Hardening de Banco e Supabase

Data: 2026-07-19  
Aplicação em produção: **NÃO EXECUTADA**

## Baseline real

- 49 tabelas com RLS habilitado;
- advisor de segurança: 42 apontamentos;
- advisor de performance: 82 apontamentos;
- 28 tabelas RLS sem política, 7 funções com `search_path` mutável;
- 3 funções Security Definer executáveis por `anon` e 3 por `authenticated`;
- proteção contra senhas vazadas desabilitada;
- 19 FKs sem índice, 13 tabelas sem PK, 31 índices não usados;
- 1 auth initplan e 18 grupos de políticas permissivas sobrepostas.

## Risco crítico identificado

`nodere_current_workspace_id` confia em `user_metadata`, atributo alterável pelo usuário em fluxos comuns do Supabase Auth. Helpers Security Definer também tinham grants amplos. Isso pode fragilizar o isolamento por workspace se combinado com acesso direto autenticado.

## Hardening preparado

`packages/database/audit_final_security_hardening.sql`:

- usa transação, advisory lock e precondições;
- resolve workspace e papel pelo perfil ativo no banco;
- torna helpers privados e restringe grants;
- fixa `search_path` das funções apontadas;
- converte políticas sobrepostas em políticas por comando;
- remove política redundante de `service_role` e sobreposições legadas de propostas;
- inclui índice necessário ao caminho de identidade.

O rollback pareado está em `packages/database/audit_final_security_hardening_rollback.sql` e recompõe o baseline observado.

## Por que não foi aplicado

Não há backup restaurável nem staging fiel. Aplicar hardening de RLS diretamente em produção poderia bloquear o único usuário ativo, afetar 827 empresas e eliminar a possibilidade comprovada de restore. A instrução de segurança prevalece: preparação completa, execução adiada.

## Validação obrigatória futura

- teste de restore antes da migração;
- matriz de acesso por papel e por workspace;
- acesso do backend via service role;
- denial tests para `anon` e usuário de outro workspace;
- comparação dos advisors antes/depois;
- EXPLAIN nas consultas afetadas;
- rollback ensaiado e comparação de contagens.

Os 28 casos de RLS sem política não devem receber políticas permissivas genéricas: ausência de caso de uso direto pode significar negação intencional.
