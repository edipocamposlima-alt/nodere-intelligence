# RELATORIO_ATUALIZACAO_MANUAL_NODERE

Data da atualizacao: 2026-07-03
Versao da plataforma: NODERE Sprint atual

## Funcionalidades adicionadas
- Nenhuma funcionalidade nova foi adicionada nesta atualizacao do manual.

## Funcionalidades alteradas
- Campos de criacao, edicao, exibicao e exportacao de texto.
- Editor rico reutilizavel em observacoes, historico, propostas, contratos, marketing, templates, Admin/CMS e documentos.
- Geracao de PDFs com limpeza de HTML bruto em propostas e contratos.

## Paginas do manual atualizadas
- Aba Ajuda / Manual NODERE: topico "33. Editor de texto".
- Documento tecnico `docs/manual-nodere.md`: novo topico "Editor de texto padronizado" e ajuste em "Propostas, contratos e PDFs".

## Novos topicos criados
- Editor de texto padronizado.

## Topicos revisados
- Propostas, contratos e PDFs.
- Regra de uso de observacoes internas em PDFs.
- Permissoes de edicao por perfil.
- Boas praticas de uso do editor.
- Problemas comuns relacionados a salvamento, permissoes e PDF.

## FAQ atualizado
- Incluidas orientacoes sobre texto sem formatacao apos salvar, botoes indisponiveis e PDF com conteudo diferente do esperado.

## Passo a passo atualizado
- Incluido fluxo de uso do editor: abrir tela, editar, formatar, revisar e salvar/gerar documento.

## Observacoes
- A documentacao foi atualizada apos a Correcao 04 dos editores de texto.
- A regra permanente passa a exigir revisao da aba Ajuda / Manual NODERE em toda alteracao futura da plataforma.

## Status
- DOCUMENTACAO ATUALIZADA: SIM
- MANUAL SINCRONIZADO: SIM
- NOVAS FUNCIONALIDADES DOCUMENTADAS: NAO SE APLICA
- FUNCIONALIDADES ALTERADAS DOCUMENTADAS: SIM
- FAQ ATUALIZADO: SIM
- PASSO A PASSO ATUALIZADO: SIM
- RELATORIO ATUALIZADO: SIM

---

## Atualizacao adicional - Correcao 05 Temas Claro/Escuro

Data da atualizacao: 2026-07-03
Versao da plataforma: NODERE Sprint atual

### Funcionalidades adicionadas
- Nenhuma funcionalidade nova foi adicionada.

### Funcionalidades alteradas
- Tema Claro.
- Tema Escuro.
- Preferencias rapidas.
- Persistencia visual de tema/fonte/densidade.
- Tokens globais de cores, fundos, textos, bordas, cards, modais, campos e editor rico.

### Paginas do manual atualizadas
- Aba Ajuda / Manual NODERE: topico "14. Tema, fonte e layout".
- Documento `docs/manual-nodere.md`: topico "Tema, fonte e layout".

### Novos topicos criados
- Preferencias rapidas.
- Boas praticas de tema.

### Topicos revisados
- Tema Claro/Escuro.
- Persistencia de preferencias.
- Configuracoes.
- Preferencias rapidas.
- Mobile/PWA.

### FAQ atualizado
- Incluida orientacao para casos em que a interface pareca misturar claro e escuro.

### Passo a passo atualizado
- Incluido uso do botao do usuario para abrir Preferencias rapidas e alterar tema, fonte, densidade, foto e nome exibido.

### Status
- DOCUMENTACAO ATUALIZADA: SIM
- MANUAL SINCRONIZADO: SIM
- NOVAS FUNCIONALIDADES DOCUMENTADAS: NAO SE APLICA
- FUNCIONALIDADES ALTERADAS DOCUMENTADAS: SIM
- FAQ ATUALIZADO: SIM
- PASSO A PASSO ATUALIZADO: SIM
- RELATORIO ATUALIZADO: SIM

---

## RETRABALHO — VALIDAÇÃO ANTERIOR REPROVADA

Data da atualizacao: 2026-07-03
Versao da plataforma: NODERE Sprint atual

### Motivo
A validacao anterior da Correcao 05 foi reprovada porque a interface ainda podia permanecer visualmente escura mesmo com a opcao **Claro** selecionada.

### Funcionalidades alteradas documentadas
- Preferencias rapidas.
- Tema Claro/Escuro.
- Persistencia visual de tema.
- Restauracao de tema em `html` e `body`.

### Paginas do manual atualizadas
- Aba Ajuda / Manual NODERE: topico "14. Tema, fonte e layout".
- Documento `docs/manual-nodere.md`: secao "Tema, fonte e layout".

### Novos esclarecimentos adicionados
- O usuario ve **Claro/Escuro**, mas a plataforma usa internamente `light/dark`.
- A preferencia fica em `nodere_settings` e chaves legadas compativeis.
- Preferencias rapidas resetam variantes especiais antigas ao escolher Claro, Escuro ou Sistema.
- A classe do tema e aplicada no `html` e no `body`.
- Como validar ou restaurar o tema apos salvar.
- Quando fazer logout/login caso a API informe sessao expirada.

### Status
- DOCUMENTACAO ATUALIZADA: SIM
- MANUAL SINCRONIZADO: SIM
- NOVAS FUNCIONALIDADES DOCUMENTADAS: NAO SE APLICA
- FUNCIONALIDADES ALTERADAS DOCUMENTADAS: SIM
- FAQ ATUALIZADO: SIM
- PASSO A PASSO ATUALIZADO: SIM
- RELATORIO ATUALIZADO: SIM
