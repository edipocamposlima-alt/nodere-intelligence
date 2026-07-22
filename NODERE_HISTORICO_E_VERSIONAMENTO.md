# NODERE — Histórico e Versionamento

Data: 2026-07-19

## Linha de base

- `735e5fb3...`: baseline auditado antes da finalização pós-produção.
- `3a40073a...`: hardening de aplicação, integrações, convites, scanner, SQL/rollback e reconciliador.
- `e8dcf08...`: rejeição CORS explícita em 403.
- `098ef844...`: correção do campo de obrigatoriedade da matriz de integrações; commit final de produção.
- tag anotada `v1.1.0`: aponta para `098ef844...`.

## Deploys finais

- Vercel: `dpl_5uE3ZH9hGskw6FFNVaNE5rydZQLN`.
- Render: `dep-d9ecp9a8ldpc739jd3og`.

## Branches

- `main`: código executável publicado, commit `098ef844...`.
- `codex/finalizacao-pos-producao-20260719`: código final mais evidências/documentação pós-deploy.

## Política adotada

Mudanças executáveis foram testadas antes do push de produção. A documentação final foi separada para evitar um novo deploy automático sem alteração funcional. Migrations destrutivas ou de controle de acesso não foram acopladas ao deploy de aplicação.

## Compatibilidade e rollback

A versão 1.1.0 preserva as rotas públicas/privadas existentes e adiciona estados explícitos de integração e segurança fail-closed. Rollback de Web/API é feito pelos provedores. O SQL tem rollback pareado, mas ambos aguardam backup e staging.
