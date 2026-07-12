# Relatorio de Otimizacao do Menu Lateral

Data: 2026-07-02

## Menu anterior mapeado

Menu lateral antes da correcao:

- Principal
  - `Início / Dashboard` -> `/dashboard` ou `/app/dashboard`
- Descoberta
  - `Busca de empresas / Prospecção` -> `/searches` ou `/app/discovery`
  - `Empresas` -> `/companies`
- CRM
  - `CRM / Funil` -> `/crm`
  - `Pipeline` -> `/pipeline`
  - `Leads` -> `/app/leads`
  - `Agenda / Calendário` -> `/calendario`
  - `Propostas` -> `/app/proposals`
- Comunicação
  - `Caixa de entrada` -> `/inbox`
  - `WhatsApp` -> `/inbox`
  - `E-mail` -> `/inbox`
  - `Omnichannel` -> `/inbox`
  - `Automações` -> `/automations`
- Inteligência
  - `IA NODERE / Inteligência` -> `/intelligence`
- Analytics
  - `Relatórios` -> `/reports`
- Operações
  - `Catálogo` -> `/catalog`
  - `Marketing` -> `/marketing`
  - `Projetos` -> `/app/upgrade?module=OPS-01`
  - `Operadores` -> `/operators`
- Administração
  - `Faturamento` -> `/billing`
  - `Integrações` -> `/integrations`
  - `Configurações` -> `/settings` ou `/app/settings`
  - `Ajuda / Manual NODERE` -> `/manual`
  - `Administrador` -> `/admin`

## Duplicidades encontradas

- `WhatsApp`, `E-mail` e `Omnichannel` apontavam todos para `/inbox`.
- `Início / Dashboard` tinha nomenclatura redundante.
- `Busca de empresas / Prospecção` tinha nomenclatura redundante.
- `Agenda / Calendário` tinha nomenclatura redundante.
- `Catálogo` era o mesmo modulo comercial de Produtos/Serviços.
- `Pipeline` criava redundancia visual com `CRM / Funil` no menu principal.
- `Projetos` era um atalho de upgrade, nao uma tela operacional principal.

## Itens removidos visualmente

Foram removidos apenas do menu principal, sem apagar rotas:

- `WhatsApp`
- `E-mail`
- `Omnichannel`
- `Pipeline`
- `Projetos`

## Rotas preservadas

As rotas antigas continuam existentes e/ou acessiveis internamente:

- `/dashboard`
- `/app/dashboard`
- `/searches`
- `/app/discovery`
- `/companies`
- `/crm`
- `/pipeline`
- `/app/leads`
- `/calendario`
- `/calendar`
- `/app/proposals`
- `/catalog`
- `/inbox`
- `/automations`
- `/intelligence`
- `/reports`
- `/marketing`
- `/billing`
- `/settings`
- `/app/settings`
- `/manual`
- `/integrations`
- `/admin`

## Nova estrutura do menu

Desktop:

- Principal
  - Dashboard
  - Prospecção
  - Empresas
  - CRM / Funil
- Comercial
  - Leads
  - Agenda
  - Propostas e Contratos
  - Produtos / Serviços
- Comunicação
  - Caixa de Entrada
  - Automações
- Inteligência
  - IA / Inteligência
  - Relatórios
- Gestão
  - Operadores
  - Marketing
  - Faturamento
  - Configurações
- Administração
  - Integrações
  - Administrador / CMS
  - Manual NODERE

Mobile:

- Barra inferior:
  - Dashboard
  - Prospecção
  - Empresas
  - CRM
  - Menu
- Drawer:
  - Agenda
  - Leads
  - Propostas e Contratos
  - Produtos / Serviços
  - Caixa de Entrada
  - Automações
  - IA / Inteligência
  - Relatórios
  - Operadores
  - Marketing
  - Faturamento
  - Configurações
  - Integrações
  - Administrador / CMS
  - Manual NODERE

## Arquivos alterados

- `apps/web/components/Sidebar.tsx`
- `apps/web/components/MobileNav.tsx`

## Permissoes validadas

- Perfil autenticado em producao: `owner`.
- Itens administrativos foram marcados como `adminOnly` no menu:
  - `Operadores`
  - `Integrações`
  - `Administrador / CMS`
- Para `operator` e `viewer`, esses itens nao aparecem no menu visual, preservando as permissoes de backend/rotas existentes.

## Testes realizados

Validacoes tecnicas:

- `apps/web`: `npm run lint` aprovado.
- `apps/web`: `npm run typecheck` aprovado.
- `apps/web`: `npm run build` aprovado.
- Raiz: `npm run build` aprovado.
- `git diff --check` aprovado, apenas aviso LF/CRLF do Windows.

Validacao em producao:

- URL: `https://nodere.com.br/dashboard`
- Sessao autenticada: SIM
- Desktop `1366x768`: menu lateral validado.
- Mobile `375x812`: barra inferior e drawer validados.
- Duplicidades visuais removidas: SIM.
- Rotas antigas preservadas: SIM.

Evidencia desktop:

- Grupos visiveis: `Principal`, `Comercial`, `Comunicação`, `Inteligência`, `Gestão`, `Administração`.
- Itens visiveis sem duplicidade: `Dashboard`, `Prospecção`, `Empresas`, `CRM / Funil`, `Leads`, `Agenda`, `Propostas e Contratos`, `Produtos / Serviços`, `Caixa de Entrada`, `Automações`, `IA / Inteligência`, `Relatórios`, `Operadores`, `Marketing`, `Faturamento`, `Configurações`, `Integrações`, `Administrador / CMS`, `Manual NODERE`.
- Duplicidades antigas visiveis: nenhuma.

Evidencia mobile:

- Barra inferior: `Dashboard`, `Prospecção`, `Empresas`, `CRM`, `Menu`.
- Drawer sem repeticao das antigas duplicidades.
- Duplicidades antigas visiveis: nenhuma.

## Deploy

- Commit: `c4a06b3`
- Mensagem: `fix: otimizar menu lateral e remover duplicidades`
- Push: realizado para `origin/main`
- Vercel deployment: `dpl_CMjTryoTCtZhzFsnNeRxub4BiEDw`
- URL do deployment: `https://web-e56zda8wg-edipo-lima-s-projects.vercel.app`
- Alias atualizado: `https://nodere.com.br`
- Status: `READY`
- Render: nao necessario, pois nao houve alteracao de backend/API.

## Pendencias

Nao ha pendencia critica.

## Status final

- Menu lateral otimizado: SIM
- Duplicidades removidas do menu: SIM
- Rotas antigas preservadas: SIM
- Funcionalidades preservadas: SIM
- Permissoes preservadas: SIM
- Desktop validado: SIM
- Mobile validado: SIM
- Tema claro/escuro: preservado pelos mesmos componentes e tokens existentes
- Testes aprovados: SIM
- Publicado em producao: SIM
- Ferramenta liberada: SIM
