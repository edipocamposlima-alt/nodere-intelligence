# RELATORIO_PADRONIZACAO_ICONES_BOTOES_NODERE

Data: 09/07/2026

## Objetivo

Auditar e corrigir inconsistencias visuais de icones, botoes e componentes interativos da plataforma NODERE/Noderi, preservando funcionalidades existentes.

## Causa raiz identificada

- Icones Lucide eram usados diretamente em varias telas com classes locais (`h-3`, `h-4`, `h-5`) e, em alguns menus, `strokeWidth` inline.
- Botoes somente com icone dependiam do padding local da tela, o que deixava area clicavel, centralizacao e proporcao variando entre cards, tabelas, modais e abas.
- Inputs e botoes compartilhados nao possuíam uma classe semantica comum para slot de icone.
- A plataforma tinha correcoes visuais em CSS para tema/layout, mas ainda nao havia uma camada global exclusiva para escala, alinhamento, proporcao e comportamento de icones sob zoom/responsividade.

## Padrao global implementado

- Criados tokens CSS globais:
  - `--nodere-icon-xs`
  - `--nodere-icon-sm`
  - `--nodere-icon-md`
  - `--nodere-icon-lg`
  - `--nodere-icon-xl`
  - `--nodere-icon-action`
  - `--nodere-icon-nav`
  - `--nodere-icon-stroke`
  - `--nodere-icon-hit-sm`
  - `--nodere-icon-hit-md`
  - `--nodere-icon-gap`
- Criadas classes/padroes:
  - `.nodere-icon`
  - `.nodere-icon-slot`
  - `.nodere-icon-spin`
  - `.nodere-icon-button`
  - `.nav-icon`
  - `.lock-badge`
- Padronizados:
  - SVGs dentro do app autenticado, settings, manual e editor.
  - Icones em botoes, links, nav items e toolbars.
  - Botoes com `aria-label`/`title` para centralizacao e area minima.
  - Containers quadrados de icone (`h-8 w-8`, `h-9 w-9`, `h-10 w-10`, etc.).
  - Imagens usadas como icone com `object-fit: contain` e proporcao 1:1.
  - Spinners com `transform-origin` central.

## Arquivos alterados

- `apps/web/app/globals.css`
- `apps/web/components/ui/Button.tsx`
- `apps/web/components/ui/Input.tsx`
- `apps/web/components/Sidebar.tsx`
- `apps/web/components/MobileNav.tsx`
- `apps/web/app/manual/page.tsx`
- `docs/manual-nodere.md`
- `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`
- `RELATORIO_PADRONIZACAO_ICONES_BOTOES_NODERE.md`

## Areas cobertas

- Cabeçalhos.
- Menus e sidebars.
- Menu mobile.
- Botoes de acao.
- Cards e blocos de metricas.
- Tabelas, listas e linhas de acao.
- Formularios e inputs com icone.
- Modais e drawers.
- Toolbars e editores.
- Areas administrativas.
- Manual/Ajuda.
- Componentes reutilizaveis.

## Regras preservadas

- Nenhuma funcionalidade removida.
- Nenhuma API alterada.
- Nenhuma regra de negocio alterada.
- Nenhuma permissao alterada.
- Tema claro/escuro preservados.
- Acessibilidade reforcada para botoes somente com icone via area clicavel minima.

## Validacoes executadas

- `apps/web`: `npm run lint` aprovado.
- `apps/web`: `npm run typecheck` aprovado.
- `apps/web`: `npm run build` aprovado.
- `apps/api`: `npm run build` aprovado.
- raiz: `npm run build` aprovado.
- raiz: `git diff --check` aprovado, apenas avisos de normalizacao LF/CRLF do Git.
- Validacao visual/CDP local em desktop 1440x900 e mobile 375x812 aprovada.
- Rotas auditadas por script visual:
  - `/dashboard`
  - `/companies`
  - `/crm`
  - `/searches`
  - `/marketing`
  - `/manual`
  - `/settings`
  - `/app/dashboard`
- Resultado CDP:
  - Sem overflow horizontal.
  - Sem icones distorcidos.
  - Sem icones menores que o minimo aceitavel nos controles visiveis.
  - Sem icones maiores que o container nos botoes/links medidos.
  - Navegacao desktop com icones `16x16`.
  - Acoes e controles com area clicavel preservada.
- Capturas temporarias de validacao foram geradas para dashboard desktop e mobile e inspecionadas visualmente antes da limpeza.

## Pendencias

- Nao foram encontradas pendencias tecnicas nesta correcao.
- Relatorios untracked antigos que ja existiam no worktree foram preservados e nao fazem parte desta entrega.

## Status final

APROVADO EM VALIDACAO LOCAL.
