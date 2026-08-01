# 20 — Plano e evidência de deploy

Ordem segura: (1) aprovação explícita; (2) aplicar migração aditiva; (3) validar tabelas/RPCs/advisors; (4) preview backend; (5) preview web; (6) smoke autenticado sem geração paga; (7) teste pago mínimo com confirmação; (8) promover backend; (9) promover web; (10) monitorar erros/ledger; (11) rollback se necessário.

Rollback DB: `apps/api/src/db/migrations/20260722_nodere_ai_first.rollback.sql` — destrói somente entidades AI-first, por isso exige export prévio se já houver conversas/ledger. Rollback app: retornar aos deployments anteriores Vercel `dpl_5uE3ZH9hGskw6FFNVaNE5rydZQLN`/Render commit `098ef844...` conforme saúde.

Estado atual: builds locais passaram; produção e preview V3 não foram publicados; migração foi rejeitada pelo controle de segurança e aguarda aprovação explícita informada.

O código permanece somente no branch `codex/nodere-ai-first-v3`; produção permanece no baseline `098ef844`. Antes da migration: confirmar backup, registrar contagens comerciais e o saldo legado. Depois: validar 8 tabelas, 5 RPCs, trigger de carteira, seeds de 3 modelos/4 agentes, saldo de abertura, grants e advisors. A migration não altera empresas, notas, propostas ou usuários; ela cria entidades AI-first/carteira e sincroniza apenas operações futuras.
