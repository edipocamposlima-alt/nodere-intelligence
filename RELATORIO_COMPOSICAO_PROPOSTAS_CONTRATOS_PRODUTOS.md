# Relatorio - Composicao Controlada de Propostas e Contratos por Produtos/Servicos

Data: 2026-07-01

## O que foi implementado

- A composicao de propostas e contratos passou a usar exclusivamente produtos/servicos ativos do catalogo oficial.
- A aba `Propostas e Contratos` da Ficha Comercial agora monta documentos por checkbox a partir dos produtos/servicos vinculados ao cliente.
- A pagina global `/app/proposals` tambem passou a permitir ajuste controlado de valor aplicado, mantendo o valor base do catalogo bloqueado.
- Nome, descricao, condicoes de pagamento, forma de pagamento, prazo e valor base sao congelados no snapshot comercial salvo em `nodere_proposals.items`.
- Itens livres/manuais continuam bloqueados porque o backend exige `catalog_item_id` valido e ativo.
- PDF de proposta e contrato usa o snapshot salvo, nao o estado atual do catalogo.
- Observacoes comerciais para o cliente aparecem no PDF.
- Observacoes internas e motivo interno de desconto nao aparecem no PDF.

## Regras comerciais aplicadas

- Campos bloqueados no documento:
  - nome do produto/servico;
  - descricao;
  - condicoes de pagamento;
  - forma de pagamento;
  - prazo de execucao/entrega;
  - valor base do catalogo.
- Campos editaveis na composicao:
  - quantidade;
  - valor aplicado;
  - desconto por percentual;
  - desconto por valor;
  - observacao comercial para o cliente;
  - observacao interna da negociacao.
- Desconto por percentual e desconto por valor sao mutuamente exclusivos.
- Motivo do desconto e obrigatorio quando houver desconto.
- Mudanca de preco aplicado e/ou desconto gera log comercial interno por item.

## Versionamento e historico

- Novos documentos recebem `document_group_id`, `version_number` e `is_current_version` em `metadata`.
- Ao criar nova versao, versoes anteriores do mesmo grupo sao preservadas e marcadas como nao atuais.
- A Ficha Comercial destaca o documento atual e permite iniciar uma nova versao a partir dele.
- O backend registra auditoria em `proposal_audit_logs`.
- O backend registra atividade em `communications` para alimentar historico/timeline da conta com `Proposta gerada` ou `Contrato gerado`.

## Permissoes

- `owner` e `admin`: podem gerar propostas e contratos.
- `operator`: pode gerar propostas conforme regra atual, mas nao contrato pela Ficha Comercial.
- `viewer`: somente leitura; nao visualiza o compositor de documentos.
- O backend continua protegido por `requireWorkspaceRole("owner", "admin", "operator")` para criacao/edicao de propostas.

## Fontes de dados reutilizadas

- Catalogo oficial: `catalog_items`.
- Propostas/contratos: `nodere_proposals`.
- Auditoria: `proposal_audit_logs`.
- Timeline/historico: `communications`.
- Cliente/lead: entidade carregada pelo CRM/workspace atual.

## Endpoints reutilizados ou ajustados

- `GET /api/catalog?status=active`
- `POST /api/proposals`
- `POST /api/proposals/:id/pdf`
- `POST /api/proposals/:id/contract-pdf`
- `PATCH /api/proposals/:id`

## Arquivos alterados

- `apps/api/src/routes/proposals.ts`
- `apps/web/app/app/crm/clientes/[id]/CrmClientFullPage.tsx`
- `apps/web/app/app/proposals/page.tsx`
- `apps/web/lib/api.ts`
- `RELATORIO_COMPOSICAO_PROPOSTAS_CONTRATOS_PRODUTOS.md`

## Migrations

Nenhuma migration nova foi criada nesta etapa.

Justificativa: os campos adicionais foram salvos em estruturas ja existentes (`metadata` e `items` de `nodere_proposals`) para preservar compatibilidade e evitar alteracao desnecessaria de banco.

## Validacoes executadas

- `apps/api`: `npm run typecheck` - aprovado.
- `apps/api`: `npm run build` - aprovado.
- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run build` - aprovado.
- raiz: `npm run build` - aprovado.
- `git diff --check` - aprovado.

## Pendencias

- Homologacao funcional autenticada em ambiente real ainda nao foi executada nesta rodada.
- Persistencia de URL publica de PDF em storage permanece como decisao futura; hoje o PDF e gerado pelo backend sob demanda.

## Status final

Aprovado em validacao tecnica local.

Nao foi feito commit, push ou deploy nesta etapa.
