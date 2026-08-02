# 29 — Exclusão, arquivamento e retenção no CRM

## Ciclo de vida

`Ativo → Arquivado → Lixeira → Purga`

- Arquivar e restaurar são reversíveis e auditados.
- Leads usam exclusão lógica; empresas possuem endpoints explícitos de arquivo, lixeira e restauração.
- Purga só é permitida a owner/admin após 30 dias, frase nominal de confirmação, ausência de legal hold e validação de dependências.
- Seleções e métricas filtram registros não ativos conforme o contexto.
- Ferramentas destrutivas da IA continuam protegidas por confirmação explícita.

Não foi executada purga de dado legítimo nem criada massa fictícia em produção durante esta entrega.

