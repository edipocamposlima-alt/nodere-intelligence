# Relatorio - Padronizacao visual dos status de score e oportunidade

## Status final

Aprovado tecnicamente para a padronizacao visual implementada no frontend.

Nao houve alteracao de regra de negocio, API, banco, autenticacao ou integracoes. A mudanca concentrou-se em tokens visuais, componentes compartilhados e chips de status/prioridade.

## O que foi implementado

- Criada uma paleta semantica central para status e score comercial.
- Padronizados badges/chips com altura, padding, raio, tipografia, ponto indicador, contraste para tema claro/escuro e tooltip.
- Corrigida a classificacao visual de oportunidade: `Alta` deixou de usar vermelho e passou a usar verde.
- Corrigida a classificacao de temperatura comercial:
  - `Quente` usa alta oportunidade/verde.
  - `Morno` usa oportunidade moderada/ambar.
  - `Frio` usa baixa oportunidade/cinza.
- Atualizado `ScoreBadge` para as faixas oficiais de 0 a 1000.
- Mantida compatibilidade com score digital de 0 a 100 por normalizacao interna.
- Atualizados chips de status nas areas principais onde havia cor manual para prioridade/status.

## Nova tabela de cores implementada

| Nivel | Tom visual | Variavel |
| --- | --- | --- |
| Critico | Vermelho | `--status-critical` |
| Oportunidade excelente | Verde intenso | `--status-excellent` |
| Alta oportunidade | Verde | `--status-high` |
| Boa oportunidade | Azul | `--status-good` |
| Oportunidade moderada | Ambar | `--status-moderate` |
| Baixa oportunidade / pouca oportunidade | Cinza | `--status-low` |
| Descartado / ignorado / perdido | Cinza escuro | `--status-discarded` |
| Concluido / finalizado | Verde escuro | `--status-done` |
| Em andamento | Azul claro | `--status-progress` |
| Aguardando | Laranja | `--status-waiting` |
| Neutro | Cinza claro | `--status-neutral` |

## Score comercial

| Faixa | Texto | Tom |
| --- | --- | --- |
| 1000-850 | Oportunidade Excelente | Verde intenso |
| 849-700 | Alta oportunidade | Verde |
| 699-550 | Boa oportunidade | Azul |
| 549-400 | Oportunidade moderada | Ambar |
| 399-250 | Baixa oportunidade | Laranja |
| 249-0 | Pouca oportunidade | Cinza |

## Componentes atualizados

- `ScoreBadge`: score comercial e digital.
- `StatusBadge`: status, oportunidade, temperatura e classificacoes comerciais.
- `Badge`: variantes comuns passam a usar o padrao visual oficial.
- Dashboard executivo: cards, barras e chips passam a usar variaveis de status oficiais.
- CRM LeadCard: temperatura comercial padronizada.
- CRM LeadDrawer: temperatura de lead e negociacao padronizadas.
- CompanyTable: classificacao, status e falhas detectadas padronizadas.
- IntelligencePanel: intencao de palavra-chave, Google Ads e Google Business Profile padronizados.
- Settings: status ativo/inativo padronizado.
- Marketing: status de integracao conectavel/pendente padronizado.
- Catalogo: status ativo/inativo de produtos/servicos padronizado.
- Calendario/Agenda: status pendente, confirmado, realizado, cancelado e reagendado padronizados.
- Inbox/WhatsApp: filtros e status de mensagens nao lida, marcada, lida e resolvida padronizados.
- Integracoes: status conectado, erro, nao configurado e configuracao obrigatoria padronizados.
- Admin: status ativo/inativo de usuarios padronizado.

## Arquivos modificados nesta tarefa

- `apps/web/lib/statusPalette.ts`
- `apps/web/app/globals.css`
- `apps/web/components/ui/ScoreBadge.tsx`
- `apps/web/components/StatusBadge.tsx`
- `apps/web/components/ui/Badge.tsx`
- `apps/web/app/dashboard/DashboardHome.tsx`
- `apps/web/components/crm/LeadCard.tsx`
- `apps/web/components/crm/LeadDrawer.tsx`
- `apps/web/components/CompanyTable.tsx`
- `apps/web/app/companies/[id]/IntelligencePanel.tsx`
- `apps/web/app/settings/SettingsClient.tsx`
- `apps/web/app/marketing/MarketingClient.tsx`
- `apps/web/app/catalog/CatalogClient.tsx`
- `apps/web/app/calendar/CalendarClient.tsx`
- `apps/web/app/inbox/InboxClient.tsx`
- `apps/web/app/integrations/page.tsx`
- `apps/web/app/admin/AdminClient.tsx`

## Evidencias visuais

- Badges agora renderizam com a classe global `nodere-status-badge`.
- Cada badge recebe `data-tone`, por exemplo `high`, `good`, `moderate`, `waiting`, `critical`, `done`, `discarded`.
- Cada badge exibe ponto indicador `.nodere-status-dot`, reforcando significado para usuarios com dificuldade de diferenciar cores.
- Tooltips foram aplicados nos componentes de status e nos chips manuais convertidos.
- Tema claro possui override especifico para manter contraste com fundo branco.
- Tema escuro usa os tokens oficiais com fundo transluzido e borda do mesmo tom.

## Testes executados

- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run build` - aprovado.
- `apps/api`: `npm run build` - aprovado.
- `apps/api`: `npm run typecheck` - aprovado.
- Raiz: `npm run build` - aprovado.
- `git diff --check` - aprovado, apenas avisos de CRLF esperados no Windows.

Nao existe script generico `test` no `apps/web/package.json` nem no `package.json` da raiz. Os scripts de teste disponiveis na API sao especificos por modulo e nao foram executados porque a tarefa nao alterou backend.

## Pendencias

- Nao ha pendencia critica para esta padronizacao.
- Existem arquivos modificados/untracked de tarefas anteriores no worktree. Eles nao foram revertidos nem alterados fora do escopo desta tarefa.
- O build da raiz gerou `dist` pelo fluxo existente; o diretorio nao apareceu como untracked no `git status`, indicando que segue ignorado/coberto pelo fluxo atual.
