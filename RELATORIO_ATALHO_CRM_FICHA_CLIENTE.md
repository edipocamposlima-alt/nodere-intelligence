# RELATORIO_ATALHO_CRM_FICHA_CLIENTE

## Status final

Aprovado tecnicamente em validacao local.

## Arquivos alterados

- `apps/web/app/companies/[id]/page.tsx`
- `RELATORIO_ATALHO_CRM_FICHA_CLIENTE.md`

## Rota utilizada

O botao "Abrir CRM" aponta para:

- `/app/crm/clientes/{id_do_cliente}?tab=overview&return=/companies/{id_do_cliente}`

Essa e a rota especifica ja existente para a Ficha Comercial completa do cliente no CRM. O retorno preserva a Ficha 360o de origem.

## Metodo de vinculacao

A Ficha do Cliente usa a propria entidade carregada por `getCompany(id)`. Para localizar automaticamente o registro CRM vinculado, o atalho prioriza os campos abaixo quando existirem no payload:

- `crmId`
- `crm_id`
- `leadId`
- `lead_id`
- `company_id`
- `company.id`

Na estrutura atual do projeto, `company.id` e o identificador compartilhado entre empresa, lead e ficha CRM. Portanto o botao abre diretamente o registro especifico sem passar pela lista do CRM.

## Duplicidade

Se o payload da empresa trouxer `duplicateCount` ou `duplicateIds` com mais de um registro, a ficha exibe aviso informando que existe mais de um registro relacionado e que o atalho abre o principal vinculado a ficha atual.

## Fallback

Caso nenhum identificador CRM esteja disponivel, a interface exibe o botao "Criar cadastro CRM" apontando para `/crm?create={id}`. No fluxo atual esse fallback tende a nao aparecer, porque a Ficha 360o so carrega quando existe uma entidade persistida.

## Permissoes aplicadas

Nenhuma regra nova de permissao foi criada. O botao apenas navega para a rota especifica do CRM:

- owner/admin/operator/viewer seguem as permissoes ja aplicadas na Ficha Comercial e nos endpoints.
- viewer continua sujeito ao modo somente leitura da ficha CRM.

## Testes realizados

- `apps/api`: `npm run build` - aprovado.
- `apps/api`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run build` - aprovado.
- raiz: `npm run build` - aprovado.

Observacao: uma execucao paralela de `apps/web npm run typecheck` falhou enquanto o `next build` regenerava `.next/types`. O comando foi repetido isoladamente apos o build e passou.

## Problemas encontrados

- Nao foi encontrado endpoint dedicado para resolver duplicidades CRM em tempo real. A deteccao ficou defensiva, baseada em campos de duplicidade quando vierem no payload da empresa.

## Pendencias

- Validar visualmente em sessao autenticada real:
  - cliente com cadastro CRM;
  - cliente com negociacoes;
  - cliente com propostas;
  - viewer em somente leitura.

## Status final

Aprovado tecnicamente. Sem alteracao de API, banco, autenticacao ou regras comerciais.
