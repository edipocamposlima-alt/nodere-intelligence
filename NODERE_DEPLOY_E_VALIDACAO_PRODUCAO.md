# NODERE — Deploy e Validação de Produção

Data: 2026-07-18
Estado deste registro: publicação e validação concluídas

## Topologia oficial

- Frontend: Vercel, projeto `web`, Root Directory `apps/web`.
- Backend: Render, serviço público identificado por `/api/health/version`.
- Banco/Auth: Supabase em `sa-east-1`.
- Domínios: `nodere.com.br` e `www.nodere.com.br`.

## Baseline anterior ao deploy

- Git: `66db603ae9e4463e7c25e9ede83ab59f176f31d0`, `main`, 0/0 contra `origin/main`.
- Vercel: deployment de produção em estado READY; SHA exato do frontend não exposto pelo metadata disponível.
- Render: health 200, versão 1.0.1 e commit igual ao baseline.
- Supabase: `ACTIVE_HEALTHY`; nenhuma migração desta auditoria aplicada.

## Gates concluídos antes da publicação

- web typecheck e build;
- API typecheck e build;
- 33 testes API;
- 4 E2E públicos/de segurança;
- 21 verificações PWA/cliente;
- `npm audit` 0 em frontend e backend;
- documentação/manual atualizados;
- scripts SQL separados do deploy automático.

## Sequência autorizada

1. revisar diff e ausência de secrets;
2. versionar código e documentação;
3. enviar `main` ao repositório remoto;
4. acompanhar o auto-deploy do backend e conferir commit/health;
5. publicar `apps/web` na Vercel em produção;
6. validar domínio, login sem sessão, token inválido, ativos, PWA e console;
7. registrar deployment/commit final nesta página;
8. não executar SQL.

## Validação pós-deploy

| Checagem | Resultado |
|---|---|
| Push do commit de código | Aprovado: `ff6cee5201f9447369e771d580335859b31d6271` em `main` |
| Vercel produção READY | Aprovado: `dpl_ERWSnVGRUD43CCVk8AsMxyWkTHa2` |
| URL imutável do deployment | `https://web-n46tm5rf5-edipo-lima-s-projects.vercel.app` |
| Aliases oficiais | Aprovado: `nodere.com.br` e `www.nodere.com.br` |
| `https://nodere.com.br` sem sessão -> `/login` | Aprovado: 307 para `/login`, que responde 200 |
| proxy sem cookie | Aprovado: `/api/backend/workspace/me` responde 401 |
| token/cookie inválido não exibe área privada | Aprovado em Chromium desktop e mobile |
| sessão real existente no Dashboard/CRM | Aprovado no Chrome: sem aviso de sessão expirada |
| CRM | Aprovado: sem 47.400%, progressão máxima 100%, personalização recolhida |
| manifest e service worker v5 publicados | Aprovado: `id=/`, orientação `any`, cache `nodere-public-shell-v5`, sem Dashboard |
| Render health | Aprovado: três endpoints 200, versão 1.0.1 |
| Render commit atualizado | Aprovado: `ff6cee5201f9447369e771d580335859b31d6271` |
| Supabase permaneceu sem mudança de schema | Aprovado: nenhum SQL/migration foi executado nesta publicação |
| logs sem regressão crítica imediata | Aprovado: nenhum erro novo de aplicação após o reload final |

## Rollback da aplicação

### Frontend

Promover novamente o último deployment Vercel READY anterior ou executar novo deploy do commit anterior. Não reutilizar build da raiz legada.

### Backend

No Render, selecionar o deploy saudável anterior ou reverter o commit do backend por novo commit rastreável. Confirmar `/api/health/version` depois do rollback.

### Banco

Não há rollback necessário nesta publicação porque a migração SQL não faz parte do deploy. Se o hardening for aplicado futuramente, usar apenas o rollback correspondente depois de restaurar/validar backup e confirmar o estado das políticas.

## Condições de interrupção

- login em loop ou conteúdo privado antes da autenticação;
- health/backend fora do ar;
- erro 5xx sustentado nas rotas workspace/companies;
- service worker servindo Dashboard/CRM do cache;
- build de produção diferente do commit revisado;
- qualquer pedido de aplicar SQL sem backup/staging.

## Registro pós-publicação

Publicação finalizada em 2026-07-18 às 23:02 (UTC-03). O frontend foi construído remotamente pela Vercel com Next.js 15.5.19 e 53 páginas estáticas/dinâmicas geradas no build. O Render concluiu o auto-deploy sem indisponibilidade observada e passou a reportar o commit de código acima.

Foram executados novamente os smokes de produção em Chromium desktop e mobile: quatro cenários públicos/de segurança passaram e dois cenários autenticados automatizados permaneceram ignorados por ausência de credenciais exclusivas de E2E. A sessão real já existente foi usada somente para inspeção visual read-only do Dashboard e CRM; não houve criação, edição ou remoção de dado comercial.

Ressalvas mantidas: SQL de hardening não aplicado; conta E2E dedicada ainda necessária; integrações externas não certificadas continuam com o estado descrito em `NODERE_INTEGRACOES_STATUS_FINAL.md`.
