# NODERE Nexus - Release v0.2

Data do checkpoint: 2026-06-11
Tag oficial: `v0.2-stable`
Commit baseline: `e01331e1e276f5769edadbec5d63582c8901b4ec`
Branch base: `main`

## Status homologado

- BLOCO 01: concluido.
- BLOCO 02: concluido.
- Producao validada.
- Supabase validado.
- Integracoes validadas.
- Controle de permissoes validado.

## Objetivos concluidos

- Preservacao da base funcional recuperada como base oficial da `main`.
- Publicacao e validacao do site publico NODERE Nexus.
- Integracao definitiva com Supabase Auth.
- Compatibilizacao do fluxo autenticado da plataforma.
- Implementacao da interface de Configuracoes do BLOCO 02 em `/app/settings`.
- Persistencia real das configuracoes de workspace.
- Persistencia segura das integracoes por workspace.
- Mascaramento de chaves sensiveis no retorno ao frontend.
- Bloqueio de acesso de usuarios viewer as integracoes.
- Criacao e push da tag estavel `v0.2-stable`.

## Funcionalidades homologadas

- Login autenticado.
- Cadastro e acesso via Supabase Auth.
- Workspace vinculado ao usuario autenticado.
- Tela `/app/settings`.
- Salvamento de nome do workspace.
- Salvamento de timezone.
- Persistencia apos reload.
- Aba Integracoes para admin/owner.
- Salvamento de OpenAI API Key.
- Retorno mascarado de credenciais via `masked_value`.
- Garantia de que `GET /api/settings/integrations` nao retorna `value`.
- Teste de conexao OpenAI chegando ate a validacao real da chave.
- Bloqueio de viewer nas integracoes.
- Retorno `403` para viewer em endpoints protegidos.

## Commits relevantes

- `e01331e` - `feat: bloco 02 interface settings`
- `5b6946e` - `feat: home completa estilo RD Station com pessoas, logos reais e blog admin`
- `f84ac7a` - `fix: remover conflito da rota home para html estatico`
- `6bbf133` - `feat: home substituida por HTML estatico com vida visual completa`
- `ff46eec` - `feat: home completa com animacoes integracoes blog e login corrigido`
- `9162305` - `feat: fase1 - correcao visual logo animacoes e login`
- `eb43b0c` - `feat: redesenhar site publico NODERE Nexus`
- `05bee66` - `chore: preservar source funcional restaurado`
- `cf6a3d5` - `fix: restaurar admin owner e google maps`

## Baseline de producao

- Estado tratado como baseline estavel para futuras implementacoes.
- Nenhuma alteracao de codigo de producao deve ser feita sobre este checkpoint sem nova tarefa aprovada.
- A tag `v0.2-stable` deve ser usada como ponto de retorno seguro da release v0.2.

## Pendencias para BLOCO 03

- Definir escopo funcional do BLOCO 03 antes de qualquer implementacao.
- Preservar a compatibilidade com Supabase Auth e permissoes por perfil.
- Manter isolamento por workspace em novas tabelas, rotas e telas.
- Validar migrations SQL em ambiente correto antes de aplicar em producao.
- Garantir que qualquer nova integracao nao exponha credenciais reais no frontend.
- Rodar build local e validacao autenticada antes de novo deploy.
- Criar tag nova somente apos homologacao completa da proxima etapa.
