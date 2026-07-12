# RELATORIO_ATUALIZACAO_MANUAL_NODERE

## Atualizacao 2026-07-12 - Icones por tema e Ficha 360 v4

### Funcionalidades adicionadas
- Nenhuma nova funcionalidade de produto foi adicionada.
- Foi documentado o padrao semantico de cores dos icones independente do tema.

### Funcionalidades alteradas
- Icones do Dashboard, sidebar, menu mobile e CRM/Kanban passam a manter cor semantica em tema claro e escuro.
- Ficha 360: documentado reforco para IDs externos Google Places/Discovery e redirecionamento para ID interno canonico quando o registro persistido existe.

### Paginas do manual atualizadas
- Aba Ajuda / Manual NODERE: topicos "6. Ficha do cliente" e "38. Icones, botoes e acoes visuais".
- Documento `docs/manual-nodere.md`: secoes "Ficha do cliente", "Ficha 360° do cliente" e "Icones, botoes e acoes visuais".

### Novos topicos criados
- Nenhum topico novo; os topicos existentes foram sincronizados com a correcao atual.

### Topicos revisados
- Abertura da Ficha 360 por resultados de busca.
- Resolucao de identificadores externos Google Places/Discovery.
- Paleta visual de icones por significado.
- Icones de acao compactos no CRM/Kanban.

### FAQ atualizado
- Orientacao de Ficha 360 com URL antiga/ID externo atualizada.

### Passo a passo atualizado
- Abrir ficha pela busca: clicar em Ficha, aguardar salvar/resolver duplicidade e navegar para o registro persistido/canonico.
- Validar tema: alternar claro/escuro e confirmar que os icones preservam as cores semanticas.

### Data da atualizacao
- 2026-07-12.

### Versao da plataforma
- Branch `main`, commit base antes da correcao `3821310`.

### Status
- DOCUMENTACAO ATUALIZADA: SIM
- MANUAL SINCRONIZADO: SIM
- NOVAS FUNCIONALIDADES DOCUMENTADAS: NAO APLICAVEL
- FUNCIONALIDADES ALTERADAS DOCUMENTADAS: SIM
- FAQ ATUALIZADO: SIM
- PASSO A PASSO ATUALIZADO: SIM
- RELATORIO ATUALIZADO: SIM

---

## Atualizacao 2026-07-12 - Ficha 360 e resolucao de leads da busca

### Funcionalidades adicionadas
- Nenhuma nova funcionalidade de produto foi adicionada.
- Foi documentado o fluxo correto de abertura da Ficha 360 a partir da Busca de empresas.

### Funcionalidades alteradas
- Ficha 360: abertura a partir da busca agora precisa resolver/salvar o lead persistido antes da navegacao.
- Fallback de erro da Ficha 360 documentado para cenarios de dados parciais, sessao e permissao.

### Paginas do manual atualizadas
- Aba Ajuda / Manual NODERE: topico "6. Ficha do cliente".
- Documento `docs/manual-nodere.md`: secao "Ficha 360° do cliente".

### Novos topicos criados
- Secao "Ficha 360° do cliente" em `docs/manual-nodere.md`.

### Topicos revisados
- Busca de empresas para CRM.
- Abertura da ficha do cliente.
- Resolucao de identificadores externos Google Places/Apollo/Econodata.

### FAQ atualizado
- Incluida orientacao para ficha que nao abre por lead ainda nao salvo, sessao expirada ou permissao.

### Passo a passo atualizado
- Abrir ficha a partir da busca: clicar em Ficha, aguardar salvar/resolver duplicidade e navegar para o registro persistido.

### Data da atualizacao
- 2026-07-12.

### Versao da plataforma
- Branch `main`, commit base antes da correcao `d40ea08`.

### Status
- DOCUMENTACAO ATUALIZADA: SIM
- MANUAL SINCRONIZADO: SIM
- NOVAS FUNCIONALIDADES DOCUMENTADAS: NAO APLICAVEL
- FUNCIONALIDADES ALTERADAS DOCUMENTADAS: SIM
- FAQ ATUALIZADO: SIM
- PASSO A PASSO ATUALIZADO: SIM
- RELATORIO ATUALIZADO: SIM

---

## Atualizacao 2026-07-10 - Governanca de arquitetura, deploy e rotas

### Funcionalidades adicionadas
- Nenhuma funcionalidade de produto foi adicionada.
- Foi adicionada documentacao operacional sobre fonte oficial do projeto, deploy seguro e matriz de rotas canonicas.

### Funcionalidades alteradas
- Governanca de deploy: deploy pela raiz documentado como bloqueado.
- GitHub Pages documentado como canal legado, nao oficial.
- Render `nodere-api` documentado como backend canonico; `nodere-ts-api` ficou como servico a confirmar.
- Rotas canonicas e aliases historicos passaram a ter documento dedicado.

### Paginas do manual atualizadas
- Aba Ajuda / Manual NODERE: topico "39. Arquitetura e deploy seguro".
- Documento `docs/manual-nodere.md`: secao "Arquitetura e deploy seguro".

### Novos topicos criados
- `FONTE_OFICIAL_DO_PROJETO.txt`.
- `docs/ROTAS_CANONICAS_NODERE.md`.

### Topicos revisados
- Deploy seguro.
- Rotas canonicas.
- Uso de GitHub Pages.
- Uso de Vercel com Root Directory `apps/web`.
- Uso de Render `nodere-api`.

### FAQ atualizado
- Nao aplicavel; a alteracao foi de governanca tecnica e nao criou novo fluxo de uso final.

### Passo a passo atualizado
- Incluida orientacao para publicar sempre pelo projeto Vercel `web` com Root Directory `apps/web`.
- Incluida orientacao para tratar `nodere-api` como servico Render oficial.

### Data da atualizacao
- 2026-07-10.

### Versao da plataforma
- Branch `main`, commit base `d40ea08`.

### Status
- DOCUMENTACAO ATUALIZADA: SIM
- MANUAL SINCRONIZADO: SIM
- NOVAS FUNCIONALIDADES DOCUMENTADAS: NAO APLICAVEL
- FUNCIONALIDADES ALTERADAS DOCUMENTADAS: SIM
- FAQ ATUALIZADO: NAO APLICAVEL
- PASSO A PASSO ATUALIZADO: SIM
- RELATORIO ATUALIZADO: SIM

---

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

## Atualizacao - Varredura visual de icones, Kanban e zoom

Data da atualizacao: 2026-07-09
Versao da plataforma: NODERE/Noderi Sprint atual

### Funcionalidades alteradas
- Escala global de icones.
- Botoes de acao compactos.
- Cabecalhos das etapas do CRM/Kanban.
- Icones de lapis, lixeira, salvar e cancelar no Kanban.
- Manual de boas praticas para icones em zoom e responsividade.

### Paginas do manual atualizadas
- Aba Ajuda / Manual NODERE: topico "38. Icones, botoes e acoes visuais".
- Documento `docs/manual-nodere.md`: secao "Icones, botoes e acoes visuais".

### Topicos revisados
- Escala oficial de icones em pixels.
- Regra compacta para acoes no cabecalho do Kanban.
- Validacao recomendada em zoom 33%, 50%, 67%, 75%, 80%, 90%, 100%, 110%, 125% e 150%.
- Uso obrigatorio de `aria-label` ou `title` em botoes sem texto.

### Status
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
