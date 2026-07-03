# Regra obrigatoria de atualizacao - Relatorios Executivos e Manual NODERE

## Regra absoluta

Toda alteracao relevante na plataforma NODERE deve revisar e, quando necessario, atualizar obrigatoriamente:

1. Relatorios Executivos.
2. Ajuda / Manual NODERE.

Nenhuma tarefa de desenvolvimento, correcao, remocao ou melhoria deve ser considerada concluida sem registrar essa revisao no relatorio final da tarefa.

## Quando atualizar

A revisao e obrigatoria sempre que houver alteracao em:

- CRM, ficha comercial, funil, contatos, historico, negociacoes ou agenda.
- Dashboard, Discovery, busca de empresas, score, badges, filtros ou indicadores.
- Produtos/Servicos, catalogo, propostas, contratos, descontos, snapshot, auditoria ou PDF.
- WhatsApp, e-mail, inbox, automacoes, IA/editor, CMS, Admin ou configuracoes.
- Permissoes, planos, roles, autenticacao, integracoes, uploads, downloads ou exportacoes.
- Tema claro/escuro, mobile, PWA, navegacao, menus, rotas publicas ou rotas autenticadas.
- Qualquer campo, botao, acao, status, regra, endpoint, tabela ou fluxo criado, removido ou alterado.

## Como atualizar Relatorios Executivos

Ao alterar uma funcionalidade, validar se a tela `Relatorios Executivos` precisa refletir a mudanca em:

- Indicadores, cards e graficos.
- Filtros, periodos, agrupamentos, operadores, empresas, status e origens.
- Nomenclaturas exibidas ao usuario.
- Regras por perfil, workspace, plano ou permissao.
- Exportacao PDF e CSV.
- Avisos tecnicos e estados vazios.
- Coerencia dos dados com CRM, propostas, contratos, catalogo, WhatsApp, IA, Discovery e demais modulos.

Se a alteracao nao impactar relatórios, registrar explicitamente no relatorio final: `Relatorios Executivos revisados; sem alteracao necessaria`.

## Como atualizar Ajuda / Manual NODERE

Ao alterar uma funcionalidade, a aba `Ajuda / Manual NODERE` deve ser tratada como documentacao oficial da plataforma e precisa refletir a mudanca em:

- Instrucoes e passo a passo.
- Nome de botoes, telas, abas, filtros e acoes.
- Permissoes e perfis.
- Fluxos comerciais, PDFs, exportacoes, propostas, contratos e catalogo.
- Integracoes, credenciais, mensagens de erro e limites.
- Mobile/PWA, tema claro/escuro e navegacao.
- Perguntas frequentes e erros comuns.

Cada funcionalidade documentada deve conter, quando aplicavel:

- Nome da funcionalidade.
- Objetivo.
- Onde localizar.
- Quem pode utilizar.
- Perfis autorizados.
- Pre-requisitos.
- Passo a passo completo.
- Exemplos praticos.
- Boas praticas.
- Observacoes.
- Limitacoes.
- Dicas.
- Problemas comuns.
- Solucoes.
- Historico de alteracoes.
- Data da ultima atualizacao.
- Versao da plataforma.

Sempre que uma funcionalidade for criada ou alterada, revisar tambem capturas de tela, regras de funcionamento, permissoes por perfil, limitacoes, boas praticas, fluxos de trabalho e FAQ. Se a alteracao nao impactar o manual, registrar explicitamente no relatorio final: `Manual NODERE revisado; sem alteracao necessaria`.

Tambem deve ser atualizado o arquivo `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`, informando funcionalidades adicionadas, funcionalidades alteradas, paginas do manual atualizadas, novos topicos criados, topicos revisados, data da atualizacao e versao da plataforma.

## Quem pode atualizar

- Owner/Admin do projeto podem aprovar alteracoes funcionais e conteudo de manual/relatorios.
- Desenvolvedores e agentes Codex devem atualizar os arquivos e componentes quando a tarefa alterar comportamento.
- Viewer nao deve alterar conteudo, regras ou configuracoes.

## Checklist obrigatorio antes de concluir qualquer tarefa

- [ ] A funcionalidade foi alterada?
- [ ] Algum campo foi adicionado, removido ou renomeado?
- [ ] Alguma regra de permissao mudou?
- [ ] Algum botao, acao, status, rota ou fluxo foi criado/removido?
- [ ] Algum endpoint, tabela, migration, PDF, CSV ou integracao mudou?
- [ ] Relatorios Executivos foram revisados?
- [ ] Relatorios Executivos precisaram de ajuste? Se sim, quais?
- [ ] Manual NODERE foi revisado?
- [ ] A navegacao do manual foi revisada?
- [ ] Pesquisa da documentacao continua funcionando?
- [ ] FAQ, passo a passo, permissoes e limitacoes foram atualizados quando aplicavel?
- [ ] `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md` foi atualizado?
- [ ] Prints, instrucoes e nomes de botoes continuam corretos?
- [ ] Relatorios continuam exibindo dados coerentes?
- [ ] O relatorio final contem a secao obrigatoria abaixo?

## Secao obrigatoria em relatorios finais

Todo relatorio final gerado para tarefas do NODERE deve conter a secao:

```text
Atualizacao obrigatoria — Relatorios Executivos e Manual NODERE
- Relatorios Executivos foram revisados? Sim/Não
- Manual NODERE foi revisado? Sim/Não
- Alteracoes aplicadas:
- Itens que nao exigiram atualizacao:
- Pendencias:
- Status:
```

## Criterio de reprovacao

A entrega deve ser classificada como reprovada ou bloqueada quando:

- Relatorios Executivos estiverem desatualizados em relacao ao comportamento real.
- Manual NODERE estiver desatualizado em relacao ao comportamento real.
- O relatorio final nao declarar a revisao das duas abas.
- A alteracao quebrar permissao, responsividade, tema claro/escuro, mobile ou navegacao existente.
- `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md` nao for atualizado em tarefas que alterem funcionalidades documentaveis.

## Modulos afetados

Esta regra vale para toda a plataforma NODERE: CRM, Ficha Comercial, Dashboard, Discovery, Relatorios, Propostas, Contratos, Produtos/Servicos, WhatsApp, E-mail, Agenda, IA, Admin, CMS, Configuracoes, Permissoes, Planos, Integracoes, PDFs, Exportacoes, Mobile/PWA e Navegacao.
