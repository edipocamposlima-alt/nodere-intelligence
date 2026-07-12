# Rotas canonicas NODERE

Atualizado em: 2026-07-10

Este documento registra as rotas preferenciais do NODERE atual e os aliases historicos mantidos por compatibilidade.

## Regras gerais

- Links novos de menu, botoes e atalhos devem usar a rota canonica.
- Aliases podem existir para compatibilidade, bookmarks ou transicao, mas nao devem orientar novas implementacoes.
- Rotas privadas sem sessao devem redirecionar para `/login`.
- Termos e privacidade permanecem publicos por exigencia legal.

## Publicas ou legais

| Funcao | Canonica | Aliases observados | Observacao |
|---|---|---|---|
| Login | `/login` | `/app/login` quando existente | Entrada operacional principal. |
| Cadastro | `/register` | `/app/register` quando existente | Deve respeitar regras atuais de cadastro. |
| Termos | `/termos` | `/terms` | Publica. |
| Privacidade | `/privacidade` | `/privacy` | Publica. |
| Manual | `/manual` | `/ajuda`, `/help` | Pode ser acessado pelo menu Ajuda; manter sincronizado com o sistema. |

## Privadas principais

| Funcao | Canonica recomendada | Aliases/historico | Observacao |
|---|---|---|---|
| Dashboard | `/app/dashboard` | `/dashboard` | `/dashboard` permanece como alias visual/operacional. |
| Busca/Discovery | `/app/discovery` | `/searches`, `/discovery` | Usar nome Discovery/Busca de empresas conforme contexto da tela. |
| Empresas/Leads | `/companies` | `/app/leads`, `/app/empresas` quando existirem | Confirmar aliases antes de criar novos links. |
| Ficha 360 | `/companies/[id]` | `/app/crm/clientes/[id]` | Ambas podem existir; preservar vinculos atuais. |
| CRM/Funil | `/crm` | `/app/crm` quando existir | Kanban/lista comercial. |
| Agenda | `/calendar` | `/calendario`, `/app/calendar` | Usar rota canonica em novos links. |
| Relatorios | `/reports` | `/relatorios`, `/app/reports` | Relatorios executivos e exportacoes. |
| Catalogo | `/catalog` | `/app/catalog` quando existir | Produtos/servicos oficiais. |
| Propostas | `/proposals` | `/app/proposals` | Propostas e contratos comerciais. |
| Inbox | `/inbox` | `/app/inbox` | Comunicacoes. |
| Automacoes | `/automations` | `/app/automations` | Sequencias e fluxos. |
| Operadores | `/operators` | `/app/operators` | Usuarios, perfis e operacao. |
| Marketing | `/marketing` | `/app/marketing` | Campanhas, posts e templates. |
| Faturamento | `/billing` | `/app/billing` | Planos e Stripe. |
| Configuracoes | `/app/settings` | `/settings` | Preferencias e workspace. |
| Admin/CMS | `/admin` e `/admin/content` | - | Uso restrito a perfis autorizados. |

## Pendencias de saneamento

- Confirmar todos os aliases existentes em App Router antes de remover qualquer rota.
- Padronizar novos links internos para as canonicas acima.
- Criar testes E2E para detectar alias quebrado, 404 ou redirecionamento indevido.
- Documentar excecoes quando um alias precisar permanecer por motivo comercial ou legal.
