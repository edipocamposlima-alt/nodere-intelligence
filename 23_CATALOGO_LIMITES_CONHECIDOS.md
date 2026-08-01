# 23 — Catálogo de limites conhecidos

| Limite | Impacto | Tratamento |
|---|---|---|
| Migração AI-first não aplicada | /ai não opera em produção | aplicar somente com autorização, backup e smoke |
| Sem staging comprovado | risco de validar direto em produção | criar staging antes da promoção recomendada |
| Carteira atual com saldo zero | geração bloqueada corretamente | grant/plano real; sem bypass |
| Teste pago não executado | fluxo real do provedor não homologado ponta a ponta | confirmar custo mínimo após ledger ativo |
| Browser interno não anexou webview local | inspeção visual manual sem evidência | Playwright público passou; repetir autenticado |
| Credenciais E2E autenticadas ausentes | 2 cenários smoke foram pulados | usar usuário fictício dedicado após schema |
| Abort durante passo parcial | usage parcial pode não chegar do provedor | registrar execução cancelada; reconciliar logs |
| Fallback após início do stream | troca automática não é segura | falhar explicitamente e permitir retry |
| openai_key legado pode existir no banco | segredo antigo fora da arquitetura | rotacionar e limpar mediante janela autorizada |
| Sem alertas externos configurados | capture_failed fica em log | integrar observabilidade antes do go-live |
| Rollback SQL remove dados V3 | conversas/ledger V3 seriam perdidos | exportar/auditar antes de rollback |
