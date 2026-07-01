# RELATORIO_PROPOSTAS_CONTRATOS_VERSIONAMENTO

## Status final

Aprovado tecnicamente em validacao local.

## Causa da duplicidade atual

A aba da Ficha Comercial listava cada registro de `nodere_proposals` como um card independente. Como o fluxo comercial novo cria snapshots de propostas/contratos a cada geracao, documentos com os mesmos itens, valores e condicoes comerciais apareciam como cards soltos, sem agrupamento visual por versao.

## Regra implementada para propostas

- Toda proposta exibida na aba continua vinculada ao cliente pelo `lead_id`.
- A aba agora agrupa propostas com a mesma assinatura comercial:
  - tipo de documento;
  - service_type;
  - subtotal;
  - desconto;
  - total;
  - moeda;
  - validade;
  - itens com snapshot comercial, descontos e condicoes.
- Registros iguais deixam de aparecer como cards soltos e passam a compor o historico de versoes do mesmo grupo.
- Propostas com produtos, valores, prazos ou condicoes diferentes permanecem como documentos separados.
- A versao mais recente do grupo fica destacada como versao atual.

## Regra implementada para contratos

- Contratos sao identificados por `metadata.document_type = "contract"`.
- Contratos usam a mesma regra de agrupamento por assinatura comercial.
- Contratos alterados passam a aparecer como historico de versoes do grupo equivalente.
- A edicao visual de contratos na Ficha fica restrita a owner/admin. Operator pode criar novo contrato pela tela de propostas, mas nao recebe exclusao.

## Arquivos alterados

- `apps/api/src/routes/proposals.ts`
- `apps/web/lib/api.ts`
- `apps/web/app/app/crm/clientes/[id]/CrmClientFullPage.tsx`
- `RELATORIO_PROPOSTAS_CONTRATOS_VERSIONAMENTO.md`

## Endpoints ajustados/criados

Criado:

- `DELETE /api/proposals/:id`

Comportamento:

- aplica exclusao logica;
- permite apenas owner/admin;
- registra `metadata.deleted_at`;
- registra `metadata.deleted_by`;
- registra `metadata.delete_reason`;
- atualiza `updated_at`;
- registra auditoria `proposal_deleted`.

Reutilizados:

- `GET /api/proposals`
- `POST /api/proposals/:id/pdf`
- `POST /api/proposals/:id/contract-pdf`

## Migrations criadas

Nenhuma migration foi criada nesta etapa.

Justificativa: o schema real ja possui `metadata jsonb` em `nodere_proposals`, usado para extensoes compativeis sem alterar estrutura fisica. A exclusao logica foi aplicada nesse campo para evitar SQL novo e preservar compatibilidade.

## Permissoes aplicadas

- Owner/admin:
  - visualizam;
  - baixam PDF;
  - acessam edicao;
  - excluem logicamente propostas e contratos.
- Operator:
  - visualiza;
  - cria nova proposta/contrato pela tela existente;
  - edita propostas pela tela existente;
  - nao exclui.
- Viewer:
  - somente visualizacao quando autorizado pela rota/sessao.

As acoes sensiveis de exclusao tambem sao validadas no backend com `requireWorkspaceRole("owner", "admin")`.

## Testes executados

- `apps/web`: `npm run typecheck` - aprovado.
- `apps/api`: `npm run build` - aprovado.
- `apps/api`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run build` - aprovado.
- raiz: `npm run build` - aprovado.

Observacao: uma execucao paralela de `apps/web npm run lint` falhou enquanto o `next build` regenerava `.next/types`. O comando foi repetido isoladamente apos o build e passou.

## Pendencias encontradas

- O versionamento fisico completo ainda nao possui colunas dedicadas como `document_group_id`, `is_current_version`, `document_hash`, `commercial_terms_hash`, `updated_by`, `deleted_at` e `change_reason`. A solucao atual faz agrupamento deterministico na UI e exclusao logica via `metadata`.
- Nao foi executado saneamento de documentos duplicados existentes. Recomendacao: criar rotina futura de consolidacao segura, com relatorio previo, antes de qualquer alteracao em massa.
- A tela `/app/proposals` ainda e o ponto oficial para criacao/edicao. A Ficha Comercial direciona para essa tela, mantendo compatibilidade.

## Status final

Aprovado tecnicamente, condicionado a homologacao funcional real com usuario autenticado e dados existentes.
