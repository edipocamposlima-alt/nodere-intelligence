# Relatorio - Fluxo de Proposta por Selecao Real de Produtos/Servicos

Data: 2026-07-02

## Onde estava o erro de interpretacao

A implementacao anterior colocou o bloco controlado primeiro na aba `IA / Editor`. Isso nao atendia ao fluxo correto, porque a proposta deve comecar na aba visivel `Propostas e contratos`, pela selecao de Produto/Servico, e nao por editor livre.

Outro erro era limitar a lista apenas a produtos/servicos ja vinculados previamente ao cliente. O comando correto exige que os produtos/servicos cadastrados no catalogo oficial aparecam automaticamente para selecao.

## Componente real alterado

- Rota: `/companies/[id]`
- Componente real da Ficha 360 / Ficha do Cliente: `apps/web/app/companies/[id]/LeadOperations.tsx`
- Aba principal alterada: `Propostas e contratos` (`tab === "documentos"`)
- Aba auxiliar preservada: `IA / Editor`

## Como o fluxo agora comeca por selecao

Na aba `Propostas e contratos`, o primeiro bloco exibido agora e:

- `Selecionar Produto/Serviço`
- `Tipo de documento`: Proposta ou Contrato
- lista automatica de produtos/servicos cadastrados e ativos
- checkbox por item
- resumo de itens selecionados
- total original
- economia/desconto
- total com desconto

O editor livre nao aparece nessa aba como compositor principal.

## Como os produtos sao carregados

- Catalogo oficial ativo: `GET /catalog?status=active`
- Vinculos do cliente, quando existirem: `GET /companies/:id/contracts`
- A tela prioriza itens ja vinculados ao cliente e completa com os demais itens ativos do catalogo.
- Itens duplicados nao aparecem duas vezes.
- Itens inativos/removidos/cancelados nao entram na composicao.

## Como quantidade/horas funcionam

- Produto usa `Quantidade`.
- Servico ou item com unidade `hour` usa `Horas/quantidade`.
- Quantidade/horas multiplicam valor original e preco aplicado.
- O usuario pode alterar quantidade/horas somente nos itens selecionados.

## Como valores e descontos aparecem

Cada item selecionavel exibe:

- nome;
- tipo Produto/Servico;
- descricao;
- condicao de pagamento;
- forma de pagamento;
- prazo;
- unidade;
- valor original;
- preco aplicado;
- desconto em percentual;
- desconto em valor;
- total original;
- valor com desconto;
- economia/desconto concedido.

Campos bloqueados na proposta:

- nome;
- tipo;
- descricao;
- condicao de pagamento;
- forma de pagamento;
- prazo;
- unidade.

Se esses dados estiverem incorretos, devem ser corrigidos no cadastro de Produtos/Servicos.

## Observacoes

- `Observações comerciais da proposta`: aparece no PDF.
- `Observações internas da negociação`: nao aparece no PDF e e usada para justificar desconto ou alteracao de preco.

## Como o PDF e gerado

- A tela usa `createProposal` de `apps/web/lib/api.ts`.
- Backend: `POST /api/proposals`.
- PDF de proposta: `POST /api/proposals/:id/pdf`.
- PDF de contrato: `POST /api/proposals/:id/contract-pdf`.
- Itens enviados usam `catalog_item_id`, quantidade/horas, preco aplicado e desconto controlado.
- O backend monta snapshot comercial com dados do catalogo ativo.
- Auditoria e versionamento continuam em `nodere_proposals`, `proposal_audit_logs` e `communications`.
- Observacoes internas/motivo interno do desconto ficam fora do PDF.

## Arquivos alterados

- `apps/web/app/companies/[id]/LeadOperations.tsx`
- `RELATORIO_COMPOSICAO_PROPOSTAS_CONTRATOS_PRODUTOS.md`

## Evidencia de teste visual

Validacao local autenticada no Chrome:

- URL local: `http://localhost:3005/companies/ChIJj0sXw8ZfXpMROoZMG7bU_7w`
- Aba aberta: `Propostas e contratos`
- Resultado DOM:
  - `Selecionar Produto/Serviço`: encontrado.
  - `Tipo de documento`: encontrado.
  - `Total original`: encontrado.
  - `Total com desconto`: encontrado.
  - `Observações comerciais da proposta`: encontrado.
  - `Observações internas da negociação`: encontrado.
  - `Gerar proposta PDF`: encontrado.
  - `Gerar contrato PDF`: encontrado.
  - editor livre como compositor principal na aba: nao encontrado.

Tentativa de criar produto/servico temporario `SMOKE_TEST_DELETE` no ambiente local foi bloqueada por CORS ao chamar a API Render a partir de `localhost` (`Failed to fetch`). Por isso, a validacao local comprovou a tela e o fluxo visual, mas nao conseguiu comprovar checkbox com dados reais carregados da API Render.

## Validacoes executadas

- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run typecheck` - aprovado.
- `apps/api`: `npm run typecheck` - aprovado.
- `apps/api`: `npm run build` - aprovado.
- `apps/web`: `npm run build` - aprovado.
- raiz: `npm run build` - aprovado.
- `git diff --check` - aprovado.

## Pendencias

- Validar em origem autorizada/producao/staging com pelo menos um produto e um servico ativos no catalogo para confirmar checkbox e PDF real ponta a ponta.
- Nenhuma migration nova foi criada; a estrutura existente de catalogo, propostas, snapshot e auditoria foi reutilizada.

## Status final

Aprovado tecnicamente e visualmente quanto a tela correta e fluxo por selecao. Homologacao funcional real de checkbox/PDF com item carregado depende de origem autorizada ou ambiente local com CORS liberado para a API.

Nao foi feito commit, push ou deploy nesta etapa.
