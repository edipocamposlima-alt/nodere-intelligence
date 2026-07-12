# RELATORIO_GOVERNANCA_ARQUITETURA_DEPLOY_NODERE

Data: 2026-07-10
Branch: main
Commit base: d40ea08

## Objetivo

Reduzir risco de publicacao da versao errada do NODERE, documentar a fonte oficial do projeto e organizar pendencias de governanca sem remover funcionalidades existentes.

## Alteracoes realizadas

1. Fonte oficial do projeto
- Criado `FONTE_OFICIAL_DO_PROJETO.txt`.
- Registrado frontend oficial `apps/web`.
- Registrado backend oficial `apps/api`.
- Registrado banco oficial Supabase PostgreSQL.
- Registrado Render oficial `nodere-api`.
- Registrado Vercel oficial projeto `web` com Root Directory `apps/web`.
- Registrados dominios oficiais `nodere.com.br` e `www.nodere.com.br`.

2. Risco de deploy legado
- `vercel.json` da raiz deixou de apontar para `dist/index.html`.
- O deploy pela raiz agora falha explicitamente com mensagem orientando usar `apps/web`.
- `.github/workflows/pages.yml` deixou de publicar a raiz no push da `main`.
- O workflow GitHub Pages foi mantido apenas manual e desabilitado operacionalmente.

3. Render
- `render.yaml` recebeu comentarios indicando `nodere-api` como servico oficial.
- `nodere-ts-api` foi marcado como legado/a confirmar.
- Nenhum servico Render foi removido ou desativado automaticamente.

4. Worktree e arquivos temporarios
- Relatorios soltos foram movidos para `docs/reports`:
  - `RELATORIO_FINAL_PENDENCIAS_PUBLICACAO_NODERE.md`
  - `RELATORIO_OTIMIZACAO_MENU_LATERAL.md`
  - `RELATORIO_PUBLICACAO_ULTIMAS_ALTERACOES_NODERE.md`
  - `RESUMO_TOTAL_VERSAO_ATUAL_NODERE_01_07_2026.md`
- Logs temporarios ignorados foram removidos da raiz:
  - `tmp-*.log`
  - `nodere-server.err.log`
  - `nodere-server.out.log`

5. README
- `README.md` foi reescrito para refletir a arquitetura atual `apps/web + apps/api + Supabase`.
- Instrucoes antigas de GitHub Pages/dist deixaram de ser caminho recomendado.
- Documentados comandos atuais de build, typecheck e testes por pacote.

6. Matriz de rotas
- Criado `docs/ROTAS_CANONICAS_NODERE.md`.
- Documentadas rotas canonicas e aliases historicos.
- Registrada regra de novos links usarem rotas canonicas.

7. Testes E2E
- Adicionado Playwright ao `apps/web`.
- Criado `apps/web/playwright.config.ts`.
- Criada suite `apps/web/tests/e2e/nodere-smoke.spec.ts`.
- Adicionado script `npm run test:e2e`.
- A suite nao armazena credenciais e usa `NODERE_E2E_EMAIL`, `NODERE_E2E_PASSWORD` e `NODERE_E2E_BASE_URL`.

8. Manual NODERE
- Atualizada a aba Ajuda / Manual NODERE com o topico "Arquitetura e deploy seguro".
- Atualizado `docs/manual-nodere.md`.
- Atualizado `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`.

## O que foi mantido como estava

- Codigo legado na raiz foi preservado.
- `nodere-site-premium/` nao foi alterado.
- `.env` e arquivos sensiveis nao foram lidos nem alterados.
- `.gitignore` foi mantido intacto, pois ja cobre `.env`, `.vercel`, `dist`, `node_modules`, logs e `nodere-site-premium/`.
- `nodere-ts-api` nao foi removido, pois depende de confirmacao humana no painel Render.

## Validacoes executadas

- `node scripts/validate-commercial-schema.mjs`: aprovado. O script confirmou o schema comercial esperado via Supabase REST.
- `apps/web npm run lint`: aprovado.
- `apps/web npm run typecheck`: aprovado.
- `apps/web npm run build`: aprovado.
- `apps/api npm run typecheck`: aprovado.
- `apps/api npm run build`: aprovado.
- `npm run build` na raiz: aprovado.
- `git diff --check`: aprovado, apenas avisos de normalizacao LF/CRLF.
- `apps/web npm run test:e2e -- --list`: aprovado. Suite registrada com 4 testes entre desktop e mobile.
- `apps/web npm audit --omit=dev --audit-level=high`: aprovado para nivel alto. Permanece aviso moderado em `next/node_modules/postcss`; `npm audit fix --force` sugere alteracao quebradora e nao foi aplicado automaticamente.

## Decisoes humanas pendentes

1. Confirmar no Render se `nodere-ts-api` ainda recebe trafego ou pode ser desativado.
2. Confirmar se GitHub Pages pode ser removido definitivamente do repositorio.
3. Confirmar politica de arquivamento dos relatorios historicos ja versionados na raiz.
4. Configurar variaveis `NODERE_E2E_EMAIL` e `NODERE_E2E_PASSWORD` em ambiente seguro para executar E2E autenticado.
5. Avaliar atualizacao segura do Next/PostCSS quando houver caminho sem downgrade ou breaking change.

## Status

- Arquitetura oficial documentada: SIM
- Risco de deploy legado neutralizado: SIM
- GitHub Pages automatico desativado: SIM
- Worktree organizado: SIM
- README atualizado: SIM
- Matriz de rotas criada: SIM
- Suite E2E minima criada: SIM
- Manual atualizado: SIM
- Funcionalidades existentes preservadas: SIM
