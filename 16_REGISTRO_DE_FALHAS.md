# 16 — Registro de falhas

| Data | Falha | Causa | Tratamento |
|---|---|---|---|
| 2026-07-22 | MCP oficial OpenAI Docs não iniciou | ACL Windows ao executar `codex.exe` | pesquisa oficial web + resolver local de modelos |
| 2026-07-22 | AI Elements CLI ficou interativa | conflito com componentes existentes | registro shadcn em namespace `components/shadcn` |
| 2026-07-22 | Typecheck AI Elements | variantes `icon-sm`/Select e tool dinâmica | adaptação mínima validada |
| 2026-07-22 | Build paralelo excedeu 184 s | Promise aguardava Next completo | builds separados; ambos passaram |
| 2026-07-22 | Sharp vulnerável aninhado | Next 15.5.19 permitia 0.34.x | Next 15.5.21 + Sharp 0.35.3 + override; audit 0 |
| 2026-07-22 | Migração Supabase rejeitada | produção sem staging/backup comprovado | não contornada; requer aprovação explícita informada |
| 2026-07-22 | Typecheck após reconciliação | variável no primeiro bloco homônimo | reposicionada no método legado; passou |
| 2026-07-22 | Tool retry concorrente | executionId variável e conflito pending | conversa + toolCallId e claim exclusivo |
| 2026-07-22 | Registry incompleto | agente/perfil não restringiam modelo | allowed models/roles no DB, API e UI |
| 2026-07-22 | PWA abria Dashboard | manifests legados | ambos iniciam em /ai |
| 2026-07-22 | PDF só tinha teste CSV | renderer não isolado | função extraída e Buffer PDF validado |
| 2026-07-22 | Browser local não anexou | webview indisponível em duas tentativas | Playwright público; visual autenticado pendente |
