# Relatorio - Navegacao Ajuda / Manual NODERE

## Objetivo

Corrigir a experiencia da tela Ajuda / Manual NODERE para que ela funcione como area integrada da plataforma, sem prender o usuario em uma pagina isolada.

## Arquivos alterados

- `apps/web/components/AppShell.tsx`
- `apps/web/app/manual/ManualClient.tsx`

## Melhorias implementadas

- `/manual` deixou de ser tratado como layout publico pelo `AppShell`.
- O Manual agora herda o layout privado da plataforma, mantendo Sidebar, Header, MobileNav, busca global, notificacoes, perfil, creditos e tema.
- Adicionado botao `Voltar` no topo, usando historico do navegador para preservar estado, filtros, scroll e dados da tela anterior.
- Adicionado breadcrumb `Dashboard / Ajuda / Manual NODERE`.
- Adicionado sumario com rolagem suave e destaque do capitulo ativo.
- Adicionada navegacao de rodape entre capitulos: capitulo anterior, proximo capitulo e voltar ao sumario.
- Adicionado modo tela cheia opcional com botao para abrir/fechar e suporte a tecla ESC.
- Pesquisa do Manual permanece local ao conteudo do manual.
- Topicos do manual que citam modulos existentes exibem atalho `Abrir modulo` para a rota correspondente.
- Estado local do Manual preserva busca, capitulo ativo e posicao de scroll em `sessionStorage`.
- Layout mantem responsividade para desktop, tablet e mobile.
- Impressao/PDF do manual permanece disponivel via `window.print()`.

## Validacoes executadas

- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run build` - aprovado.

## Evidencias visuais/funcionais

- O build reconheceu `/manual` como rota do app e compilou com sucesso.
- Como `/manual` saiu da lista publica do `AppShell`, a rota passa a renderizar dentro do shell privado em runtime.
- Sidebar e MobileNav continuam apontando para `/manual`.
- `/ajuda` e `/help` continuam redirecionando para `/manual`.

## Pendencias

- Sem pendencias tecnicas encontradas nesta alteracao.
- Validacao visual em producao deve ser feita somente apos deploy autorizado.

## Status final

APROVADO.
