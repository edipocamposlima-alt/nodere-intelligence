# RELATORIO_ABA_PRODUTOS_SERVICOS_CRM

## Status final

Aprovado tecnicamente em validacao local. A aba Produtos/Servicos da Ficha Comercial passou a centralizar negociacoes e contratacoes vinculadas ao cliente CRM, sem criar tabela duplicada e sem alterar regras de negocio do fluxo comercial principal.

## O que foi implementado

- Substituida a listagem de catalogo global na aba Produtos/Servicos por uma area propria de produtos/servicos contratados ou em negociacao do cliente.
- Criado formulario estruturado para:
  - produto ou servico;
  - descricao;
  - tipo;
  - status da negociacao;
  - tipo de venda;
  - valor negociado;
  - desconto;
  - valor final;
  - prazo e forma de pagamento;
  - prazo de execucao/entrega;
  - datas previstas;
  - responsavel;
  - observacoes comerciais;
  - motivo de perda;
  - proxima acao e data;
  - proposta vinculada;
  - data e canal de envio da proposta;
  - contratacao anterior para upgrade.
- Incluidos indicadores da aba:
  - total em negociacao;
  - total fechado;
  - quantidade de produtos/servicos ativos;
  - proxima acao.
- Incluida lista inferior com multiplos produtos/servicos por cliente.
- Incluidas acoes:
  - adicionar;
  - salvar;
  - editar;
  - excluir logicamente;
  - marcar como fechado;
  - marcar como perdido;
  - ver proposta vinculada;
  - baixar PDF da proposta vinculada.
- Implementada validacao de motivo obrigatorio quando o status for "Nao fechou".

## Arquivos alterados

- `apps/web/app/app/crm/clientes/[id]/CrmClientFullPage.tsx`
- `RELATORIO_ABA_PRODUTOS_SERVICOS_CRM.md`

## Rotas/endpoints criados ou usados

Nenhum endpoint novo foi criado.

Endpoints reutilizados:

- `GET /api/leads/:id/deals`
- `POST /api/leads/:id/deals`
- `PUT /api/leads/:id/deals/:dealId`
- `GET /api/proposals`
- `GET /api/proposals/:id/pdf`

## Tabelas/migrations criadas

Nenhuma migration nova foi criada.

Estrutura reutilizada:

- `company_contracts`, via endpoints de deals/negociacoes do CRM.

Os campos especificos da aba ficam serializados de forma estruturada no campo `description` do registro de negociacao/contratacao existente. O campo `notes` preserva observacoes comerciais. A exclusao foi implementada como exclusao logica, registrando `deletedAt` no payload estruturado e ocultando o item da lista ativa.

## Vinculo com o cliente CRM

Todo registro e salvo pelos endpoints `/api/leads/:id/deals`, portanto sempre recebe o `company_id` do cliente/lead aberto na Ficha Comercial. A UI bloqueia salvamento quando nao existe `companyId`.

## Vinculo com propostas

A aba carrega as propostas existentes filtradas pelo `lead_id` do cliente e permite vincular uma delas ao produto/servico. A proposta vinculada pode ser aberta pela area de propostas e o PDF pode ser baixado usando a geracao real ja existente.

## Regras de permissao aplicadas

- Viewer: somente leitura, sem formulario e sem acoes de edicao.
- Owner/admin/operator: podem adicionar, editar e atualizar status.
- Owner/admin: podem excluir logicamente.
- Operator/viewer: nao recebem botao de exclusao.
- O backend continua aplicando `canEditCrm` nos endpoints de deals.

## Testes executados

- `apps/api`: `npm run build` - aprovado.
- `apps/api`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run build` - aprovado.
- raiz: `npm run build` - aprovado.
- `git diff --check` - aprovado, com avisos existentes de conversao LF/CRLF em arquivos ja modificados no worktree.
- Busca por credenciais nos arquivos alterados desta etapa - nenhuma credencial encontrada.

## Pendencias encontradas

- O endpoint antigo `DELETE /api/leads/:id/deals/:dealId` ainda existe e executa exclusao fisica, mas a nova aba nao o utiliza. A exclusao da aba Produtos/Servicos foi feita por `PUT` com `deletedAt`, preservando historico logico.
- Anexo manual de PDF nao foi implementado porque nao foi encontrado suporte generico de upload/anexo para esta ficha nesta etapa. O PDF gerado pela proposta vinculada ja fica acessivel.

## Status final

Aprovado tecnicamente para a aba Produtos/Servicos.
