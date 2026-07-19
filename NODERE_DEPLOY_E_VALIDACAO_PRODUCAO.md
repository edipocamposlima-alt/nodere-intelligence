# NODERE — Deploy e Validação de Produção

Data: 2026-07-18
Estado deste registro: pronto para receber a evidência pós-publicação

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
- 19 verificações PWA;
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
| Push do commit final | Pendente |
| Vercel produção READY | Pendente |
| `https://nodere.com.br` sem sessão -> `/login` | Pendente |
| token inválido não exibe área privada | Pendente |
| manifest e service worker v5 publicados | Pendente |
| Render health 200 | Pendente |
| Render commit atualizado | Pendente |
| Supabase permaneceu sem mudança de schema | Pendente |
| logs sem regressão crítica imediata | Pendente |

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

Esta seção será atualizada com horário, commit, URL de deployment, resultados e eventuais ressalvas após a execução.
