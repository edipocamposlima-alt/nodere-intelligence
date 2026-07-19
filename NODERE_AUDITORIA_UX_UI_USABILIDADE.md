# NODERE — Auditoria de UX, UI e Usabilidade

Data: 2026-07-18
Superfícies prioritárias: Dashboard, CRM/Kanban, login, navegação global, mobile/PWA e estados de sessão.

## Diagnóstico

As telas tinham boa cobertura funcional, mas densidade excessiva: muitos cartões com a mesma importância, tipografia pequena, controles administrativos sempre expostos e largura útil sem limite. No CRM, um percentual impossível de 47.400% reduzia a confiança no indicador. A sessão expirada permanecia visível ao lado de dados antigos, confundindo estado de segurança e estado operacional.

## Correções aplicadas

### Hierarquia

- Dashboard organizado por propósito: qualidade da base, execução comercial, distribuição e prioridades.
- Título principal com escala maior e ações concentradas no cabeçalho.
- Conteúdo central limitado a 1680px para leitura em monitores amplos.
- Topbar de 72px e sidebar de 15,5rem, reduzindo compressão horizontal sem desperdiçar área.
- Densidade confortável como padrão; modo compacto permanece uma escolha explícita.

### CRM

- Ordem canônica das nove etapas principais.
- Progressão calculada por alcance acumulado, nunca acima de 100%.
- Quatro KPIs principais no topo e progressão resumida em chips.
- Customização do funil movida para um painel recolhível.
- Colunas mais largas, altura previsível, rolagem interna e encaixe horizontal.

### Estados e feedback

- carregamento de autenticação bloqueia a área privada;
- 401/403 encerra a sessão e leva ao login;
- indisponibilidade temporária mostra estado dedicado e botão Nova tentativa;
- foco por teclado tem contorno visível;
- preferência de movimento reduzido é respeitada.

## Responsive e zoom

O CSS adota largura fluida e limites para desktop. No Kanban, as colunas usam largura mínima e `scroll-snap`, o que evita esmagamento em notebook e mobile. A barra superior e áreas de conteúdo usam dimensões coerentes com zoom aumentado; botões com ícone mantêm rótulo acessível quando já implementado pelo componente.

Validações automatizadas foram executadas em Chromium desktop e em viewport Pixel 5. A matriz manual completa de zoom 33%–150% permanece recomendada para telas autenticadas quando a conta E2E estiver disponível.

## Acessibilidade

Atendido nesta rodada:

- contraste de textos secundários no tema escuro reforçado;
- foco visível consistente;
- redução de movimento;
- login e estados de erro com texto acionável;
- navegação mobile sem depender de hover.

Ainda precisa de varredura autenticada com axe/Lighthouse para confirmar nomes acessíveis, ordem de foco, landmarks e contraste em todas as 62 páginas.

## Heurísticas e resultado

| Heurística | Antes | Depois | Pendência |
|---|---|---|---|
| Estado do sistema | sessão expirada coexistia com dados | estados de validar, falhar e entrar são exclusivos | testar conta real |
| Correspondência com negócio | conversão impossível | etapas e progressão canônicas | configurar aliases futuros |
| Controle do usuário | customização sempre aberta | painel explícito e recolhível | persistência central das etapas |
| Prevenção de erro | XLS antigo passava ao parser | formato e limites explícitos | pré-validação no cliente |
| Consistência | densidade desigual | camada global e componentes preservados | reduzir estilos locais legados |
| Recuperação | mensagem genérica | novo login ou nova tentativa conforme causa | observabilidade de erro |

## Parecer

O redesign melhora legibilidade e confiança sem alterar a identidade escura NODERE. A plataforma está utilizável em desktop e mobile nas superfícies públicas e de segurança verificadas. A certificação integral de acessibilidade e fluxos privados depende da conta automatizada descrita em `NODERE_PENDENCIAS_E_BLOQUEIOS_REAIS.md`.
