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

## Atualizacao - Interface publica oculta e login como entrada

Data da atualizacao: 2026-07-09
Versao da plataforma: NODERE/Noderi Sprint atual

### Funcionalidades alteradas
- Middleware de acesso publico.
- Rota raiz do dominio.
- Páginas institucionais, blog, cadastro e manual para usuarios sem sessao.
- Fluxo de login e redirecionamento.

### Paginas do manual atualizadas
- Aba Ajuda / Manual NODERE: topico "16. Login, sessao e usuarios".
- Documento `docs/manual-nodere.md`: secao "Acesso e interface publica oculta".

### Topicos revisados
- Raiz do dominio redireciona para `/login` quando nao ha sessao.
- Interface publica/institucional fica preservada no codigo, mas oculta do acesso publico direto.
- Rotas internas sem sessao redirecionam para login.
- Termos e privacidade continuam acessiveis por suporte legal.

### Status
- DOCUMENTACAO ATUALIZADA: SIM
- MANUAL SINCRONIZADO: SIM
- NOVAS FUNCIONALIDADES DOCUMENTADAS: NAO SE APLICA
- FUNCIONALIDADES ALTERADAS DOCUMENTADAS: SIM
- FAQ ATUALIZADO: SIM
- PASSO A PASSO ATUALIZADO: SIM
- RELATORIO ATUALIZADO: SIM

---

## Atualizacao - Padronizacao global de icones, botoes e acoes visuais

Data da atualizacao: 2026-07-09
Versao da plataforma: NODERE Sprint atual

### Funcionalidades alteradas
- Icones globais da interface.
- Botoes de acao com e sem texto.
- Navegacao lateral e menu mobile.
- Inputs com icones.
- Toolbars, editores, tabelas, listas, cards e areas administrativas.

### Paginas do manual atualizadas
- Aba Ajuda / Manual NODERE: topico "38. Icones, botoes e acoes visuais".
- Documento `docs/manual-nodere.md`: secao "Icones, botoes e acoes visuais".

### Topicos revisados
- Escala global de icones.
- Centralizacao e area clicavel minima.
- Responsividade e zoom 100%.
- Proibicao de ajustes inline arbitrarios em width, height, strokeWidth, fontSize e transform.
- Acessibilidade para botoes somente com icone.

### Status
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
- PRODUCAO VALIDADA COM MANUAL ATUALIZADO: SIM
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

---

## RETRABALHO — CORRECAO 04 EDITORES DE TEXTO

Data da atualizacao: 2026-07-03
Versao da plataforma: NODERE Sprint atual

### Motivo
A validacao anterior dos editores foi reprovada porque Observacoes e Marketing ainda podiam exibir toolbar quebrada, botoes desalinhados e controles cortados.

### Funcionalidades alteradas documentadas
- Editor rico global.
- Observacoes e historico.
- Marketing, criar post, campanhas e templates.
- Propostas e contratos.
- WhatsApp/templates.
- Admin/CMS, blog e paginas institucionais.

### Paginas do manual atualizadas
- Aba Ajuda / Manual NODERE: topico "33. Editor de texto".
- Documento `docs/manual-nodere.md`: secao "Editor de texto padronizado".

### Novos esclarecimentos adicionados
- A toolbar agora e organizada em grupos.
- Botoes e selects do editor nao devem herdar padding global da plataforma.
- No mobile, os grupos quebram em linhas para evitar corte ou sobreposicao.
- O usuario deve atualizar a pagina caso veja uma toolbar desalinhada apos publicacao.
- Viewer continua em modo somente leitura quando a regra da tela exigir.

### Status
- DOCUMENTACAO ATUALIZADA: SIM
- MANUAL SINCRONIZADO: SIM
- NOVAS FUNCIONALIDADES DOCUMENTADAS: NAO SE APLICA
- FUNCIONALIDADES ALTERADAS DOCUMENTADAS: SIM
- FAQ ATUALIZADO: SIM
- PASSO A PASSO ATUALIZADO: SIM
- RELATORIO ATUALIZADO: SIM

---

## Atualizacao - Padronizacao visual tema claro e PDF Ficha Cliente

Data da atualizacao: 2026-07-03
Versao da plataforma: NODERE Sprint atual

### Funcionalidades alteradas
- Tema claro.
- Identidade visual global de cards, bordas, sidebar, topbar, badges, inputs, tabelas, barras e indicadores.
- PDF da Ficha Comercial / Ficha Cliente.

### Paginas do manual atualizadas
- Aba Ajuda / Manual NODERE: topico "14. Tema, fonte e layout".
- Aba Ajuda / Manual NODERE: topico "30. PDFs e documentos".
- Documento `docs/manual-nodere.md`: secoes "Tema, fonte e layout" e "PDF da Ficha Comercial / Ficha Cliente".

### Topicos revisados
- Uso do tema claro sem perder identidade NODERE.
- Padrao visual de PDFs comerciais.
- Limpeza de textos formatados antes de PDF.
- Organizacao das secoes da ficha no PDF.

### Status
- DOCUMENTACAO ATUALIZADA: SIM
- MANUAL SINCRONIZADO: SIM
- NOVAS FUNCIONALIDADES DOCUMENTADAS: NAO SE APLICA
- FUNCIONALIDADES ALTERADAS DOCUMENTADAS: SIM
- FAQ ATUALIZADO: SIM
- PASSO A PASSO ATUALIZADO: SIM
- RELATORIO ATUALIZADO: SIM
