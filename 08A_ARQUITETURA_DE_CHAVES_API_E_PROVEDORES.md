# 08A — Arquitetura de chaves API e provedores

- Chave criada: nome `Codex`, organização `org-KyYJRYvsuHdPKPzbnShHIR9g`, projeto `proj_VizjD0WKPjGdedbZLhAtZSXV`.
- Salvamento local: `.env.local` ignorado pelo Git; o valor nunca foi exibido em logs/respostas.
- Verificação local: `GET /v1/models` retornou HTTP 200.
- O backend local carrega `.env.local` antes de `.env`; produção usa exclusivamente secrets do Render.
- Uma chave de provedor atende múltiplos modelos autorizados; não existe chave por modelo.
- O frontend não contém `OPENAI_API_KEY`, não aceita `sk-*` e apenas chama o gateway autenticado.
- A configuração antiga `openai_key` de workspace foi removida da UI e da allowlist de gravação. Eventual valor legado no banco deve ser rotacionado/scrubado após autorização operacional.
- Separação DEV/STAGING/PROD ainda não está comprovada. Há chave local e secret de produção separado, mas não existe ambiente staging confirmado.
