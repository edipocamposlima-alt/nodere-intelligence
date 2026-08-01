# 13 — Auditoria de segurança de IA e aplicação

Controles implementados: autenticação obrigatória, RBAC, workspace derivado da sessão, allowlist de ferramentas, schemas strict, aprovação de mutações, idempotência, recibos, secrets backend-only, safety identifier hash, redaction de `sk-*` em erros, limites de mensagens/saída/steps/retries, RLS e least privilege nas novas tabelas.

O registry aplica interseção modelo habilitado + provedor configurado + perfil + agente tanto na resposta da UI quanto novamente no gateway. Recibos de ferramenta usam conversa + toolCallId e o insert pendente é o claim exclusivo; retry concorrente não executa a operação uma segunda vez.

Prompt injection: dados externos são explicitamente classificados como não confiáveis; o modelo não escolhe workspace, role, SQL, URL arbitrária ou credenciais.

Supply chain: `npm audit --omit=dev` chegou a 0 vulnerabilidades em API e Web; Next foi atualizado de 15.5.19 para 15.5.21 e Sharp para 0.35.3.

Pendências: scrub/rotação de eventual `openai_key` legado do banco; advisors históricos do Supabase; teste adversarial E2E após migração; separação formal de ambientes e política de retenção de conversas.
