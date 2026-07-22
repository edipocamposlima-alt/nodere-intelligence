# NODERE — Deploy Final e Evidências

Data: 2026-07-19  
Tag: `v1.1.0`  
Commit de produção: `098ef8442f39f01213f0c1bb55200080d079bdfb`

## Frontend — Vercel

- projeto: `web` (`prj_3xkck9dJBFgYSJWFlaleK2zuWNUL`);
- deployment final: `dpl_5uE3ZH9hGskw6FFNVaNE5rydZQLN`;
- URL imutável: `https://web-e0im135r2-edipo-lima-s-projects.vercel.app`;
- alias oficial: `https://nodere.com.br`;
- estado: `READY`;
- runtime errors na janela final de 1h: nenhum;
- logs warning/error/fatal do deployment na janela: nenhum.

## Backend — Render

- serviço: `srv-d8ap45el51nc73f580a0` / `nodere-api`;
- deployment final: `dep-d9ecp9a8ldpc739jd3og`;
- URL: `https://nodere-api.onrender.com`;
- estado: `live`;
- logs: `@nodere/api@1.1.0`, servidor na porta atribuída e serviço live;
- health: versão 1.1.0, commit `098ef844...`, ambiente production.

## Verificações pós-deploy

- domínio/login Web 200;
- health API e versão 200;
- Supabase e OpenAI reais 200;
- CORS host não permitido 403;
- PWA assets/offline 200;
- smoke autenticado de oito áreas aprovado.

## Rollback operacional

Frontend: promover um deployment Vercel anterior aprovado.  
API: promover o deployment Render anterior `dep-d9ecot741pts73emmao0` e revalidar health/CORS.  
Banco: nenhuma migração desta entrega foi aplicada; portanto não há rollback produtivo de banco a executar.

## Versionamento da documentação

O código implantado está em `main` e na tag `v1.1.0`. A consolidação Markdown pós-deploy fica na branch `codex/finalizacao-pos-producao-20260719` para não disparar novo deploy de aplicação sem mudança executável.
