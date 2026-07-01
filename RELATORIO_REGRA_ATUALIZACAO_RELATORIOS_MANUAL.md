# Relatorio - Regra de atualizacao obrigatoria de Relatorios Executivos e Manual NODERE

## Arquivos criados

- `REGRA_ATUALIZACAO_RELATORIOS_MANUAL.md`
- `RELATORIO_REGRA_ATUALIZACAO_RELATORIOS_MANUAL.md`

## Arquivos alterados

- `apps/web/app/manual/page.tsx`
- `apps/web/app/reports/ReportsClient.tsx`
- `docs/manual-nodere.md`

## Regra implementada

Foi criada uma regra permanente no repositorio determinando que toda alteracao relevante na plataforma NODERE deve revisar obrigatoriamente:

1. Relatorios Executivos.
2. Ajuda / Manual NODERE.

Nenhuma entrega deve ser considerada concluida se uma dessas duas areas estiver desatualizada ou se o relatorio final nao registrar a revisao.

## Como a regra sera aplicada no futuro

- Toda tarefa futura deve usar o checklist de `REGRA_ATUALIZACAO_RELATORIOS_MANUAL.md`.
- O relatorio final de cada tarefa deve conter a secao `Atualizacao obrigatoria — Relatorios Executivos e Manual NODERE`.
- Se a tarefa alterar funcionalidade, campo, regra, permissao, botao, fluxo, API, PDF, CSV, integracao, tema, mobile ou navegacao, a revisao das duas abas e obrigatoria.
- Se nao houver impacto em uma das abas, isso deve ser declarado explicitamente no relatorio final.
- Entrega sem essa revisao deve ser tratada como reprovada/bloqueada.

## Relatorios Executivos revisados

Sim.

Atualizacoes aplicadas:

- Incluida uma secao de governanca na tela `Relatorios Executivos`.
- A secao informa que mudancas em CRM, Discovery, catalogo, propostas, contratos, WhatsApp, IA, permissoes, integracoes, PDFs, exportacoes, mobile e navegacao devem revisar indicadores e Manual antes de conclusao.
- Adicionado atalho direto para o Manual NODERE.

Nao foram alterados:

- Endpoints de relatorios.
- Calculos de metricas.
- Permissoes.
- Exportacao PDF/CSV.

## Manual NODERE revisado

Sim.

Atualizacoes aplicadas:

- Adicionados capitulos sobre `Relatorios executivos` e `Regra de atualizacao obrigatoria` na aba Ajuda / Manual NODERE.
- Atualizado `docs/manual-nodere.md` com a mesma regra operacional.
- Mantida a navegacao existente do Manual.

## Pendencias encontradas

- Nao foram encontradas pendencias tecnicas nesta alteracao.
- Validacao visual em producao deve ocorrer somente apos deploy autorizado.

## Testes executados

- `apps/web`: `npm run lint`
- `apps/web`: `npm run typecheck`
- `apps/web`: `npm run build`

## Atualizacao obrigatoria — Relatorios Executivos e Manual NODERE

- Relatorios Executivos foram revisados? Sim.
- Manual NODERE foi revisado? Sim.
- Alteracoes aplicadas: regra documentada, Manual atualizado e aviso de governanca adicionado em Relatorios Executivos.
- Itens que nao exigiram atualizacao: APIs, banco, permissoes, PDF/CSV e calculos dos indicadores.
- Pendencias: nenhuma pendencia tecnica local.
- Status: aprovado.

## Status final

APROVADO.
