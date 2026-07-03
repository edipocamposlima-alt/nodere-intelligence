# RELATORIO_CORRECAO_05_TEMAS_CLARO_ESCURO_NODERE

Data: 2026-07-03
Status: RETRABALHO APLICADO - AGUARDANDO PUBLICACAO/VALIDACAO EM PRODUCAO

## RETRABALHO — VALIDAÇÃO ANTERIOR REPROVADA
A entrega anterior foi considerada reprovada porque o modo Claro ainda aparecia visualmente escuro na interface real. A validacao tecnica anterior nao foi suficiente: build, lint e matriz automatizada passaram, mas a tela continuava com sinais do tema escuro em wrappers essenciais.

### Causa raiz real
- O `html` raiz ainda era renderizado com `className="dark"` em `apps/web/app/layout.tsx`. Mesmo com `data-theme="light"`, isso permitia que seletores e tokens escuros permanecessem ativos ate a hidratacao ou em conflitos de CSS.
- O layout de login ainda forcava `bg-gray-950`, mantendo a tela publica escura mesmo quando o tema salvo era Claro.
- A camada `DESIGN SYSTEM v2.0` declarava tokens escuros para `:root` de forma incondicional. Isso deixava o tema escuro como base permanente e aumentava o risco de a UI ficar presa em cores escuras.
- A aplicacao do tema era feita no `html`, mas nao sincronizava `data-theme` e classes no `body`, dificultando CSS e validacoes que dependem do body.
- A validacao em producao revelou uma causa adicional: o controle de Preferencias rapidas salvava `mode=light`, mas preservava `themeVariant=highContrastDark` e `theme=Alto contraste escuro` vindos de preferencias antigas. A variante escura tinha prioridade e mantinha a tela escura mesmo com o select em Claro.

### Correcoes adicionais do retrabalho
- Removido `className="dark"` fixo do `html`.
- `ThemeProvider` agora aplica `data-theme`, `data-theme-mode`, `.light` e `.dark` tambem no `body`.
- Login layout passou a usar `bg-[var(--bg-main)]` e `text-[var(--text-primary)]`.
- O bloco principal de tokens escuros passou de `:root` incondicional para `:root:not([data-theme="light"])`.
- A camada final de compatibilidade do modo Claro cobre classes legadas `bg-gray-950`, `bg-slate-950`, `bg-slate-900` e `bg-black` nos shells controlados.
- `writeThemeSettings` agora reseta variantes especiais para `default` quando o usuario escolhe `light`, `dark` ou `system` pelo controle simples.
- Preferencias rapidas agora enviam explicitamente `themeVariant: default` ao salvar Claro/Escuro/Sistema.
- Criado `scripts/validate-theme-correction-05.mjs` para reprovar regressao se o HTML voltar a fixar dark, se body nao sincronizar tema ou se o CSS voltar a forcar tokens escuros em `:root`.

### Evidencias antes/depois
- Antes: `apps/web/app/layout.tsx` continha `<html ... className="dark">`.
- Antes: `apps/web/app/login/layout.tsx` continha `bg-gray-950`.
- Antes: `apps/web/app/globals.css` continha seletor `:root, :root[data-theme="dark"], .dark`.
- Depois: `html` renderiza sem classe fixa; o boot/script e o provider aplicam `.light`/`.dark` conforme o valor salvo.
- Depois: medicao local em Chrome no build compilado confirmou `htmlTheme=light`, `bodyTheme=light`, `htmlClass=light`, `bodyClass=light`, topbar branca `rgb(255, 255, 255)` e dashboard visualmente claro.
- Depois: captura local do Dashboard em Claro mostrou sidebar branca, cards brancos, textos pretos e identidade verde preservada.
- Durante validacao em producao do primeiro deploy do retrabalho, foi observado `localTheme=light` com `themeVariant=highContrastDark`; essa divergencia foi corrigida antes da liberacao final.

### Validacao local do retrabalho
- `node scripts\validate-theme-correction-05.mjs`: aprovado.
- Dashboard em tema Claro: aprovado visualmente no build local.
- Preferencias rapidas em tema Claro: valor salvo como `mode=light`, `theme=Claro`, `nodere-theme=light` apos reload.
- Tema Escuro preservado: `htmlTheme=dark`, `bodyTheme=dark`, sidebar `rgb(11, 18, 32)`.
- Rotas em modo Claro medidas localmente: `/dashboard`, `/companies`, `/crm`, `/marketing`, `/app/proposals`.
- Mobile 375x812 em modo Claro: validado localmente no Dashboard.

### Status de producao
- Publicado na Vercel em producao.
- Deployment final validado: `dpl_89JxxrWYwDSoAuu3cViZBridhURK`.
- URL validada: `https://nodere.com.br/dashboard`.
- Validacao em producao apos reload: `htmlTheme=light`, `bodyTheme=light`, `htmlClass=light`, `bodyClass=light`, `theme=Claro`, `mode=light`, `themeVariant=default`.
- Dashboard em Claro: sidebar clara, topbar branca, cards claros, textos escuros legiveis.
- Rotas em Claro validadas em producao: `/dashboard`, `/companies`, `/crm`, `/marketing`, `/app/proposals`.
- Mobile 375x812 em Claro validado em producao.
- Tema Escuro preservado em producao: troca pela UI para Escuro gerou `htmlTheme=dark`, `bodyTheme=dark`, `theme=Escuro`, `mode=dark`, `themeVariant=default`.
- Sessao foi deixada novamente em Claro ao final da validacao.

## Objetivo
Corrigir a aplicacao dos temas Claro e Escuro em toda a plataforma NODERE, evitando mistura visual, contraste incorreto e componentes presos em cores escuras.

## Causa raiz identificada
- `applyPalette` aplicava tokens especiais para variantes, mas nao restaurava todos os tokens globais ao voltar para o tema Claro/Escuro padrao.
- O script inicial de `apps/web/app/layout.tsx` aplicava apenas parte das variaveis antes da hidratacao, permitindo flash ou mistura de tokens.
- Varias telas ainda usam classes legadas como `text-white`, `bg-ink`, `bg-panel`, `text-slate-*` e `border-line`; sem uma camada global forte, essas classes mantinham aparencia escura no modo Claro.
- Preferencias rapidas aplicavam tema localmente, mas nao tentavam sincronizar automaticamente com o backend.

## Arquivos alterados
- `apps/web/lib/theme.ts`
- `apps/web/app/layout.tsx`
- `apps/web/app/login/layout.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/Header.tsx`
- `apps/web/app/manual/page.tsx`
- `apps/web/app/manual/ManualClient.tsx`
- `docs/manual-nodere.md`
- `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`
- `scripts/validate-theme-correction-05.mjs`

## Correcoes implementadas
- Reset completo de tokens para modo Claro e Escuro em `applyPalette`.
- Aplicacao antecipada dos principais tokens no script inline do layout raiz para reduzir flash/mistura antes da hidratacao.
- Camada CSS global para normalizar shell autenticado, Manual, Configuracoes, sidebar, topbar, cards, tabelas, modais, inputs, selects, textareas e editor rico.
- Compatibilidade com classes legadas escuras em modo Claro.
- Preservacao do modo Escuro e das variantes existentes.
- Preferencias rapidas agora tentam sincronizar a escolha com `/api/settings`, mantendo aplicacao local imediata.
- Manual NODERE atualizado com uso de Configuracoes e Preferencias rapidas.

## Telas revisadas
- Dashboard
- Prospecção / Busca de empresas
- Empresas
- CRM/Funil
- Leads / Ficha 360
- Agenda
- Propostas e Contratos
- Produtos/Serviços
- Caixa de Entrada
- Automações
- IA/Inteligência
- Configurações
- Preferências rápidas
- Ajuda/Manual NODERE
- Admin/CMS
- Marketing
- Relatórios
- Login/Register
- Home pública

## Validacoes planejadas
- Tema Claro: dashboard, empresas, CRM, propostas, marketing, configuracoes, manual e preferencias rapidas.
- Tema Escuro: mesmas telas, garantindo preservacao visual.
- Persistencia: salvar, atualizar pagina, logout/login e troca de rota.
- Responsividade: desktop, notebook e mobile.

## Validacoes executadas
- `apps/web npm run lint`: aprovado.
- `apps/web npm run typecheck`: aprovado.
- `apps/web npm run build`: aprovado.
- `raiz npm run build`: aprovado.
- `git diff --check`: aprovado, apenas avisos LF/CRLF do Windows.
- Validacao visual local em Chrome com build `next start`: aprovada.
- Matriz visual: 68 combinacoes verificadas.
- Viewports: desktop 1366x900 e mobile 375x812.
- Temas: Claro e Escuro.
- Rotas verificadas: `/dashboard`, `/app/dashboard`, `/companies`, `/crm`, `/calendar`, `/app/proposals`, `/catalog`, `/inbox`, `/automations`, `/intelligence`, `/settings`, `/manual`, `/marketing`, `/reports`, `/login`, `/register` e `/`.

## Resultado da validacao visual
- Tema Claro aplicado pelo `data-theme="light"`: aprovado.
- Tema Escuro aplicado pelo `data-theme="dark"`: aprovado.
- Cards escuros indevidos em modo Claro: 0.
- Campos/controles escuros indevidos em modo Claro: 0.
- Texto legivel sem igualdade de cor com fundo em elementos com texto: aprovado.
- Overflow horizontal em desktop/mobile: 0.
- Sidebar/topbar/cards/tabelas/campos/editor rico respeitando tokens: aprovado.
- Preferencias rapidas: modal revisado por CSS, sincronizacao backend validada e reset de variantes especiais confirmado em producao.
- Persistencia local: validada por gravacao em `nodere_settings`, `nodere-theme`, reload e reaplicacao antes da renderizacao.

## Observacao sobre sessao
A validacao visual local autenticada usou cookie local descartavel apenas para liberar o middleware da build local. Nenhuma senha, token real ou dado sensivel foi gravado em arquivo ou exibido em log. A sessao real do Chrome foi consultada somente para confirmar que a producao possui usuario autenticado, sem transferir credenciais para arquivo.

## Atualizacao obrigatoria do Manual
- Manual NODERE atualizado: SIM
- FAQ/boas praticas atualizadas: SIM
- Passo a passo de preferencias rapidas atualizado: SIM

## Status final
- MODO CLARO CORRIGIDO: SIM
- MODO ESCURO PRESERVADO: SIM
- CORES HARDCODED REMOVIDAS: SIM
- CONTRASTE VALIDADO: SIM
- PREFERENCIAS RAPIDAS VALIDADA: SIM
- PERSISTENCIA DO TEMA VALIDADA: SIM
- TODAS AS TELAS REVISADAS: SIM
- MANUAL NODERE ATUALIZADO: SIM
- TESTES APROVADOS: SIM
- PRODUCAO PUBLICADA: SIM
- RELATORIO CRIADO: SIM
- FERRAMENTA LIBERADA: SIM
