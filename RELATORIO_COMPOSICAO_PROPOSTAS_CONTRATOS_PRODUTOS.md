# Relatorio - Composicao de Propostas e Contratos por Produtos/Servicos

Data: 2026-06-30

## O que foi implementado

- A composicao em `apps/web/app/app/proposals/page.tsx` foi ajustada para remover o editor livre de conteudo comercial.
- A tela passou a ter selecao de tipo de documento: proposta ou contrato.
- O documento e montado obrigatoriamente pela lista de produtos/servicos ativos do catalogo.
- Ao salvar, o frontend chama a API de propostas e aciona automaticamente o PDF correto:
  - proposta: `POST /api/proposals/:id/pdf`
  - contrato: `POST /api/proposals/:id/contract-pdf`
- O backend passou a aceitar `document_type`, `customer_notes` e `internal_notes`.
- `customer_notes` e salvo em `content` e aparece no PDF.
- `internal_notes` e salvo em `metadata` e auditoria, sem aparecer no PDF.
- O smoke tecnico foi reforcado para validar PDF de contrato e nao exposicao de observacao interna global.

## Como produtos/servicos sao selecionados

- A tela lista somente itens ativos vindos de `GET /api/catalog`.
- Cada item e selecionado por checkbox.
- O payload enviado para propostas usa obrigatoriamente `catalog_item_id`.
- O backend rejeita item livre/manual porque cada item precisa apontar para um item ativo do catalogo.

## Campos bloqueados

Estes campos nao sao editaveis na composicao da proposta/contrato:

- nome do produto/servico;
- descricao;
- condicoes de pagamento;
- forma de pagamento;
- prazo de execucao/entrega;
- orientacao comercial cadastrada.

Esses dados sao congelados no snapshot salvo em `nodere_proposals.items`.

## Campos que podem ser alterados

Durante a composicao, o usuario pode ajustar:

- quantidade;
- desconto por percentual;
- desconto por valor;
- motivo do desconto;
- observacao comercial do item para o cliente;
- observacao interna do item;
- observacao comercial global para o cliente;
- observacao interna global da negociacao.

## Como descontos sao registrados

- O backend aceita desconto por percentual OU por valor.
- Se percentual e valor forem enviados juntos, a API retorna erro de validacao.
- Se houver desconto, o motivo e obrigatorio.
- O item salvo registra:
  - valor unitario original do catalogo;
  - total bruto;
  - tipo de desconto;
  - percentual ou valor aplicado;
  - total final;
  - observacao interna com o motivo do desconto.

## Como observacoes internas sao tratadas

- Observacoes internas por item ficam em `internal_item_note`.
- Observacao interna global fica em `metadata.internal_notes`.
- Observacoes internas entram na auditoria.
- Observacoes internas nao sao renderizadas no PDF do cliente.

## Como PDF e gerado

- O PDF de proposta usa o endpoint `POST /api/proposals/:id/pdf`.
- O PDF de contrato usa o endpoint `POST /api/proposals/:id/contract-pdf`.
- Ambos usam exclusivamente o snapshot salvo em `nodere_proposals.items`.
- O PDF exibe observacoes comerciais para o cliente quando preenchidas.
- O PDF nao exibe motivo interno de desconto nem observacoes internas.

## Como o documento se vincula ao cliente

- Cada documento e criado com `lead_id`.
- A API valida se o lead existe no workspace antes de salvar.
- O registro fica persistido em `nodere_proposals` e relacionado ao cliente/lead.

## Arquivos alterados

- `apps/api/src/routes/proposals.ts`
- `apps/web/app/app/proposals/page.tsx`
- `apps/web/app/manual/page.tsx`
- `apps/web/lib/api.ts`
- `scripts/homologate-commercial-flow.mjs`
- `RELATORIO_COMPOSICAO_PROPOSTAS_CONTRATOS_PRODUTOS.md`

## Endpoints criados/ajustados

- Ajustado `POST /api/proposals`
  - aceita `document_type`;
  - aceita `customer_notes`;
  - aceita `internal_notes`;
  - mantem obrigatoriedade de `catalog_item_id`.
- Reutilizado `POST /api/proposals/:id/pdf`.
- Reutilizado `POST /api/proposals/:id/contract-pdf`.

## Migrations criadas

Nenhuma migration nova foi criada nesta etapa.

Motivo: a estrutura existente ja possui `content`, `metadata` e `items` em `nodere_proposals`, alem do snapshot comercial por item. A alteracao foi feita preservando compatibilidade e evitando mudanca desnecessaria de banco.

## Testes executados

Executados localmente:

- `apps/api`: `npm run build` - aprovado.
- `apps/api`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run build` - aprovado.
- `apps/web`: `npm run typecheck` - aprovado apos o build regenerar `.next/types`.
- raiz: `npm run build` - aprovado.

Observacao: o primeiro `apps/web npm run typecheck` falhou porque `.next/types` ainda nao estava regenerado. Depois de `apps/web npm run build`, o typecheck foi repetido e aprovado.

## Pendencias

- Persistir URL do PDF gerado em storage ainda depende de estrutura/decisao de storage definitiva. Hoje o PDF e gerado pelo backend sob demanda e baixado pelo navegador.
- Versionamento avancado com destaque automatico de ultima versao permanece seguindo a estrutura atual de `version`/historico existente; nao foi criada regra nova de versionamento nesta etapa.
- Evento explicito na Visao Geral depende do consumo do audit log/metricas ja existentes.

## Status final

Aprovado em validacao tecnica local.

Nao foi feito deploy, push ou commit nesta etapa.
