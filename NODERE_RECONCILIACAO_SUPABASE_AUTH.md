# NODERE — Reconciliação Supabase Auth

Data: 2026-07-19  
Modo executado: leitura agregada / dry-run  
Mutações: **zero**

## Resultado

| Métrica | Contagem |
|---|---:|
| Perfis de plataforma | 162 |
| Ativos / inativos | 1 / 161 |
| E-mails inválidos | 0 |
| Grupos de e-mail normalizado duplicado | 0 |
| Perfis sem UID Auth | 135 |
| Vínculos UID válidos | 1 |
| Vínculos UID órfãos | 26 |
| Contas Auth | 2 |
| Auth confirmado | 2 |
| Auth sem perfil vinculado por UID | 1 |
| Candidatos determinísticos por e-mail | 0 |
| Correspondências ambíguas | 0 |

Não há qualquer candidato determinístico seguro para auto-vinculação. Associar por semelhança de nome, domínio ou suposição organizacional seria incorreto e não foi feito.

## Automação entregue

`scripts/reconcile-auth-users.mjs`:

- dry-run por padrão;
- só considera e-mail exato, normalizado, único e conta confirmada;
- mascara e-mail/logs e usa fingerprint;
- opera em lotes com checkpoint;
- exige confirmação explícita para `--apply` e gate extra em produção;
- produz informação suficiente para rollback lógico.

O script recusou corretamente a execução local por ausência das variáveis Supabase protegidas. O arquivo `NODERE_RECONCILIACAO_AUTH_RESULTADO.csv` contém somente métricas agregadas, sem PII.

## Próxima decisão humana

O responsável de negócio deve classificar os 161 perfis inativos: manter histórico, reativar/convidar, mesclar mediante evidência ou arquivar. Cada conta a criar precisa de convite oficial e papel/workspace aprovados. Os 26 vínculos órfãos exigem investigação individual; o UID não deve ser sobrescrito em massa.

## Pré-condições para aplicar

Backup restaurável, staging, lista de usuários aprovada, conta administrativa protegida, janela de mudança, execução inicial em dry-run e plano de rollback. Até lá, o estado produtivo permanece inalterado.
