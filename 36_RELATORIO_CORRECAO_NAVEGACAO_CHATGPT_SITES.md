# 36 — Relatório de correção da navegação no ChatGPT Sites

Data da homologação: 19/08/2026, 15:12 (America/Sao_Paulo)

## Resultado executivo

A falha de navegação foi reproduzida na URL pública autenticada e corrigida. A versão 3 do mesmo projeto ChatGPT Sites foi publicada e homologada com a conta OWNER `edipo.lima@nodere.com.br`, dados reais do workspace canônico e backend Render preservado.

URL final: https://nodere-app.edipolima.chatgpt.site

API preservada: https://nodere-api.onrender.com

## Causa raiz e correção

- Na versão reprovada, os links tinham `href` correto e `pointer-events: auto`, mas o clique era interceptado pelo runtime cliente do `next/link`/RSC do Vinext. O console registrava `RSC prefetch setup error` e `TypeError: ee is not a function`; a URL permanecia em `/ai`.
- Foi criado `apps/web/components/NativeLink.tsx`, com âncora HTML nativa, e os 38 usos de `next/link` foram migrados. Isso eliminou a interceptação incompatível e restabeleceu navegação completa, URL direta, reload e histórico.
- A definição dos módulos foi centralizada em `apps/web/lib/platformNavigation.ts`, compartilhada por sidebar e menu móvel.
- O menu de faturamento passou a respeitar o OWNER interno e permaneceu disponível na homologação.
- O service worker foi versionado como `nodere-public-shell-v6`; APIs e páginas autenticadas não são armazenadas no cache público.
- A rota `/reports` revelou uma segunda incompatibilidade do bundle Vinext com Recharts (`TypeError: t is not a function`). Os gráficos foram reimplementados em SVG/CSS nativo, sem alterar os dados ou as regras de negócio.
- O erro OpenAI `429 insufficient_quota` permanece isolado ao provedor externo. Navegação, CRM, dados, comunicações, relatórios e administração não dependem dessa quota.

## Publicação

- Repositório principal: commit de navegação `5c0706aa8cf9869a9cfcc7f1a70d9d9e7712491e` e correção de relatórios `23509a1adf8e0da8450262531723c98fb9c536c4`.
- Fonte isolada enviada ao Sites: `c2448aac0b551531d3711cf1f9d3531435d41f2e`.
- Project ID: `appgprj_6a85c145edb481918603373e72d3a024`.
- Versão: 3 — `appgprj_6a85c145edb481918603373e72d3a024~appgver_fb00dff4b54881919e66a00e3f764e80`.
- Deployment: `appgdep_6a85e3a6621c819186e6f6cd47e2eaf2`.
- Status do deployment: `succeeded`.
- Revisão de variáveis hospedadas: 2.
- Hash do pacote publicado: `sha256:165dd3405f0bf940c17c291c70a7f25e8c51a4fa19282ddfbea2b9cc1602afa3` (482 arquivos).
- Backend Render: `/health` HTTP 200, ambiente `production`, commit `23509a1adf8e0da8450262531723c98fb9c536c4`.

## Homologação autenticada na URL real

A sessão OWNER real foi usada no Chrome público. O E2E percorreu os 17 módulos abaixo por clique da navegação, confirmou o destino, repetiu por URL direta e executou reload mantendo a sessão. Também foram validados back/forward entre `/dashboard` e `/crm`.

| Módulo | Rota | Clique | URL direta | Reload |
|---|---|---:|---:|---:|
| NODERE AI | `/ai` | SIM | SIM | SIM |
| Dashboard | `/dashboard` | SIM | SIM | SIM |
| Prospecção e pesquisa | `/searches` | SIM | SIM | SIM |
| Funil comercial | `/crm` | SIM | SIM | SIM |
| Empresas e clientes | `/companies` | SIM | SIM | SIM |
| Comunicações | `/crm/communications` | SIM | SIM | SIM |
| Agenda | `/calendario` | SIM | SIM | SIM |
| Briefings | `/crm/briefings` | SIM | SIM | SIM |
| Propostas e contratos | `/app/proposals` | SIM | SIM | SIM |
| Produtos e serviços | `/catalog` | SIM | SIM | SIM |
| Relatórios | `/reports` | SIM | SIM | SIM |
| Usuários e permissões | `/operators` | SIM | SIM | SIM |
| Configurações | `/settings` | SIM | SIM | SIM |
| Integrações | `/integrations` | SIM | SIM | SIM |
| Administração técnica | `/admin` | SIM | SIM | SIM |
| Plano e faturamento | `/billing` | SIM | SIM | SIM |
| Manual NODERE | `/manual` | SIM | SIM | SIM |

O teste reproduzível foi registrado em `apps/web/tests/e2e/chatgpt-sites-navigation.production.spec.ts`. A antiga conta descartável V6 não autentica mais após a limpeza obrigatória da massa de teste; por isso a homologação final foi executada na sessão OWNER já autenticada, sem redefinir senha e sem recriar dados artificiais. Os logs do Sites registraram as requisições reais da execução `e2e=v82`.

## Sessão, proxy, CORS, cache e variáveis

- Cookie de sessão: HttpOnly, `Secure` em produção, `SameSite=Lax`, `Path=/` e sem atributo `Domain`; portanto é host-only para `nodere-app.edipolima.chatgpt.site` e não depende de `nodere.com.br`.
- Proxy same-origin: chamadas privadas continuam em `/api/backend/*`; tokens não são persistidos em `localStorage`.
- CORS do Render: preflight da origem Sites retornou HTTP 204, `Access-Control-Allow-Origin` exato para a nova URL e credenciais habilitadas.
- Variáveis: URLs públicas apontam para o Sites, API pública aponta para o Render e Supabase aponta para `qhopjggnbzewuuktqntp.supabase.co`; segredos permaneceram protegidos.
- Supabase: projeto `ACTIVE_HEALTHY`, migrations V8/V8.1 presentes, OWNER e workspace canônico preservados.
- Worker Sites: consulta final de erros dos últimos 30 minutos retornou zero eventos de erro/exceção.
- PWA: manifest HTTP 200, `start_url=/ai?source=pwa`, escopo `/`, display `standalone`, três ícones e seis atalhos. O service worker público contém o cache `nodere-public-shell-v6`.

## Responsividade e temas

- Mobile real: viewport 390 × 844, botão `Abrir menu` visível, item `Comunicações` acionado por toque e rota `/crm/communications` carregada com dados reais.
- Tema escuro: `data-theme=dark`, classe `dark`, fundo `rgb(8, 24, 20)` e texto `rgb(246, 250, 248)`.
- Tema claro: `data-theme=light`, classe `light` e texto `rgb(45, 54, 50)`.
- `npm run test:mobile-pwa`: aprovado em todas as 25 verificações de manifest, offline, cache, breakpoints, safe-area, proxy e proteção de tokens.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado antes da publicação da versão 3.
- Suíte API previamente executada: 101 testes aprovados; o V8.2 acrescentou a validação real de navegação que faltava.

## Liberação do domínio antigo

A liberação só foi executada depois da homologação funcional do Sites.

- O endpoint autoritativo da Vercel para o projeto `prj_3xkck9dJBFgYSJWFlaleK2zuWNUL` confirma apenas `web-two-xi-54.vercel.app`; `nodere.com.br` e `www.nodere.com.br` não estão mais associados ao projeto `web`.
- Foram removidos exclusivamente os dois registros de hospedagem web: ALIAS raiz e ALIAS curinga.
- A zona permanece na conta, pronta para ser vinculada a outro projeto; repositório, projeto Vercel de rollback, banco, backend Render e Supabase não foram excluídos.
- A consulta autoritativa da zona mostra somente três registros CAA. Não existiam MX, SPF, DKIM ou DMARC na zona Vercel antes da remoção e nenhum registro de e-mail foi alterado ou excluído.
- Não foi criado redirecionamento do domínio antigo.

## Quadro obrigatório V8.2

```text
FALHA DE NAVEGAÇÃO REPRODUZIDA: SIM
CAUSA RAIZ IDENTIFICADA: SIM
OVERLAY/POINTER EVENTS VALIDADOS: SIM
ROTEAMENTO CENTRALIZADO: SIM
TODOS OS LINKS LATERAIS FUNCIONAM: SIM
URL DIRETA DE TODAS AS ROTAS FUNCIONA: SIM
RELOAD DE TODAS AS ROTAS FUNCIONA: SIM
BACK/FORWARD FUNCIONA: SIM
SESSÃO SUPABASE FUNCIONA NO NOVO HOST: SIM
COOKIES DESVINCULADOS DO DOMÍNIO ANTIGO: SIM
CORS DA NOVA ORIGEM VALIDADO: SIM
VARIÁVEIS DO CHATGPT SITES VALIDADAS: SIM
SERVICE WORKER E CACHE VALIDADOS: SIM
NAVEGAÇÃO INDEPENDENTE DA QUOTA OPENAI: SIM
DASHBOARD ABRE: SIM
PROSPECÇÃO ABRE: SIM
FUNIL ABRE: SIM
EMPRESAS ABRE: SIM
COMUNICAÇÕES ABRE: SIM
AGENDA ABRE: SIM
BRIEFINGS ABRE: SIM
PROPOSTAS E CONTRATOS ABREM: SIM
PRODUTOS ABRE: SIM
RELATÓRIOS ABRE: SIM
USUÁRIOS E PERMISSÕES ABREM: SIM
CONFIGURAÇÕES ABREM: SIM
INTEGRAÇÕES ABREM: SIM
ADMINISTRAÇÃO ABRE: SIM
FATURAMENTO ABRE: SIM
MANUAL ABRE: SIM
TEMA CLARO VALIDADO: SIM
TEMA ESCURO VALIDADO: SIM
MOBILE VALIDADO: SIM
PWA VALIDADA: SIM
E2E AUTENTICADO NA URL REAL: SIM
NOVA VERSÃO CHATGPT SITES PUBLICADA: SIM
RELATÓRIO CRIADO: SIM
DOMÍNIO ANTIGO LIBERADO SOMENTE APÓS APROVAÇÃO: SIM
NODERE FUNCIONAL NO CHATGPT SITES: SIM
LIBERADA PARA USO REAL: SIM

COMMIT FINAL: 23509a1adf8e0da8450262531723c98fb9c536c4
CHATGPT SITES PROJECT_ID: appgprj_6a85c145edb481918603373e72d3a024
CHATGPT SITES DEPLOYMENT/VERSÃO: appgdep_6a85e3a6621c819186e6f6cd47e2eaf2 / versão 3
URL FINAL: https://nodere-app.edipolima.chatgpt.site
DEPLOY RENDER: commit 23509a1adf8e0da8450262531723c98fb9c536c4 — production — HTTP 200
URL API: https://nodere-api.onrender.com
DATA/HORA: 19/08/2026, 15:12 (America/Sao_Paulo)
```
