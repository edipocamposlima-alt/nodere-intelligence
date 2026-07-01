# Relatorio - Correcao de persistencia do tema Claro/Escuro

## Causa raiz identificada

O tema oscilava porque existiam varias fontes de verdade concorrentes:

- `nodere_settings`
- `nodere_user_preferences`
- `nodere-theme`
- `nodere_theme`

Além disso, componentes diferentes aplicavam tema diretamente no DOM:

- `ThemeRuntime`
- `ThemeProvider`
- `Header`
- `SettingsClient`
- `PlatformTopbar`
- script inline em `app/layout.tsx`

O problema mais critico era o `Header`, que relia preferencias proprias ao trocar de rota e podia reaplicar o tema `dark` por padrao, mesmo quando o usuario tinha escolhido `Claro`. O `ThemeRuntime` tambem podia sobrescrever a escolha local ao mesclar configuracoes remotas sem respeitar uma preferencia local explicita.

## Estrategia de persistencia utilizada

Foi criada uma fonte local canonica:

- `nodere_settings`

Chaves antigas continuam sendo escritas para compatibilidade:

- `nodere-theme`
- `nodere_theme`
- `nodere_user_preferences`

Arquitetura final:

- `apps/web/lib/theme.ts` centraliza leitura, normalizacao, persistencia e aplicacao do tema.
- `nodere_settings` guarda `theme`, `mode`, fonte, densidade, visual e `themeUpdatedAt`.
- `themeUpdatedAt` protege a escolha local explicita contra sobrescrita indevida por backend antigo ou fallback.
- O script inline do `app/layout.tsx` aplica o tema antes da primeira pintura visual para reduzir flicker.
- `ThemeRuntime`, `ThemeProvider`, `Header`, `SettingsClient` e `Topbar` passam a usar a mesma utilidade.

## Providers revisados

- `ThemeProvider`: agora usa `readThemeSettings`, `applyThemeSettings` e `persistAndApplyThemeSettings`.
- `ThemeRuntime`: agora aplica a fonte canonica e usa backend apenas como sincronizacao/fallback, preservando preferencia local explicita.
- `Header`: deixou de aplicar tema escuro por padrao ao trocar de rota.
- `SettingsClient`: passou a salvar/aplicar pelo fluxo canonico.
- `PlatformTopbar`: deixou de gravar somente em `nodere_theme` e passou a persistir no mesmo fluxo oficial.

## Arquivos alterados

- `apps/web/lib/theme.ts`
- `apps/web/app/layout.tsx`
- `apps/web/components/ThemeRuntime.tsx`
- `apps/web/components/providers/ThemeProvider.tsx`
- `apps/web/components/Header.tsx`
- `apps/web/components/layout/Topbar.tsx`
- `apps/web/app/settings/SettingsClient.tsx`
- `apps/web/app/manual/page.tsx`
- `apps/web/app/reports/ReportsClient.tsx`
- `docs/manual-nodere.md`
- `RELATORIO_CORRECAO_TEMA_CLARO_ESCURO.md`

## Correcoes implementadas

- Criada arquitetura unica de tema em `apps/web/lib/theme.ts`.
- Aplicacao do tema antes da renderizacao visual no `app/layout.tsx`.
- Persistencia uniforme em `nodere_settings`.
- Compatibilidade mantida com chaves antigas.
- Sincronizacao entre abas via evento `storage`.
- Sincronizacao interna via evento `nodere:theme-change`.
- Preservacao da escolha local apos rota, refresh, logout/login, fechamento e reabertura do navegador.
- Ajuste da tela Configuracoes para gravar tema, fonte, densidade e visual no mesmo caminho.
- Ajuste do Header para nao reverter tema ao trocar de pagina.
- Ajuste do Topbar alternativo para usar o mesmo fluxo.
- Manual atualizado com a regra de persistencia do tema.
- Relatorios Executivos revisados conforme regra obrigatoria.

## Testes executados

- `apps/web`: `npm run typecheck` - aprovado.
- `apps/web`: `npm run lint` - aprovado.
- `apps/web`: `npm run build` - aprovado.
- `apps/api`: `npm run build` - aprovado.
- `apps/api`: `npm run typecheck` - aprovado.
- raiz: `npm run build` - aprovado.
- `git diff --check` - aprovado, apenas avisos normais de LF/CRLF no Windows.

## Validacoes funcionais cobertas por codigo

- Tema Claro e Escuro usam a mesma fonte de verdade.
- Troca de rota nao reaplica fallback escuro.
- Refresh usa script inline antes da pintura visual.
- Logout/login mantem localStorage canonico.
- Reabertura do navegador usa `nodere_settings`.
- Mobile/PWA usam o mesmo `layout.tsx`, `ThemeRuntime` e localStorage.
- Abas diferentes recebem sincronizacao por `storage`.

## Pendencias encontradas

- Validacao visual manual em dispositivos reais e PWA instalado deve ser feita apos deploy/autorizacao, pois esta execucao nao abriu sessao real em navegador.
- Nao houve alteracao de backend, banco, autenticacao, permissoes ou regras de negocio.

## Atualizacao obrigatoria — Relatorios Executivos e Manual NODERE

- Relatorios Executivos foram revisados? Sim.
- Manual NODERE foi revisado? Sim.
- Alteracoes aplicadas: Manual atualizado com a nova persistencia de tema; Relatorios Executivos revisados e texto de governanca ajustado para incluir tema claro/escuro.
- Itens que nao exigiram atualizacao: indicadores, filtros, calculos, PDF/CSV e endpoints de relatorio.
- Pendencias: validacao visual em producao/PWA somente apos deploy autorizado.
- Status: aprovado.

## Status final

APROVADO.
