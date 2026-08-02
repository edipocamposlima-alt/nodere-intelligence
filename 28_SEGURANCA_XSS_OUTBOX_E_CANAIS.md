# 28 — Segurança: XSS, outbox e canais

- HTML é sanitizado no backend com allowlist antes de persistir ou enviar.
- A UI renderiza conteúdo seguro e não usa editor legado baseado em `execCommand`.
- IDs de workspace e usuário vêm da sessão e não do corpo da requisição.
- RLS está forçada e acesso direto de `anon`/`authenticated` às tabelas V5 foi revogado; somente o backend usa `service_role`.
- Mensagens externas exigem consentimento e chave de idempotência.
- Quiet hours, tentativas limitadas, backoff, cancelamento e histórico imutável protegem a fila.
- WhatsApp assistido não registra entrega fictícia.
- Erros não devolvem secrets; `.env` continua fora do Git.

Riscos remanescentes: anexos sem antivírus/quarentena; Gmail sem credenciais; anexos de e-mail ainda sem transmissão; CSP e políticas globais devem continuar monitoradas em cada release.

