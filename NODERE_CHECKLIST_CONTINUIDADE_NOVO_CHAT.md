# NODERE - Checklist de Continuidade para Novo Chat

Data: 2026-07-17
Branch-base documentada: `main`
Commit-base documentado: `66db603ae9e4463e7c25e9ede83ab59f176f31d0`

## 1. Leitura obrigatoria inicial

Antes de qualquer alteracao, leia nesta ordem:

1. `NODERE_RELATORIO_MESTRE_CONTINUIDADE.md`
2. `NODERE_PENDENCIAS_RISCOS_E_PRIORIDADES.md`
3. `NODERE_ARQUITETURA_TECNICA.md`
4. `NODERE_INVENTARIO_FUNCIONAL.md`
5. `NODERE_BANCO_E_INTEGRACOES.md`
6. `NODERE_REGRAS_NEGOCIO_E_PERMISSOES.md`
7. `NODERE_DEPLOY_OPERACAO_E_ROLLBACK.md`

## 2. Primeiros comandos seguros

Executar:

```powershell
git status --short
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
git log --oneline -10
```

Interpretacao:
- Se houver alteracoes locais, nao sobrescrever.
- Se estiver fora de `main` ou branch esperada, confirmar objetivo.
- Se commit divergir de `66db603`, ler commits posteriores antes de agir.

## 3. Caminhos canonicos

Frontend oficial:
- `apps/web`

Backend oficial:
- `apps/api`

Banco/migrations:
- `packages/database`
- `apps/api/src/db`

Nao tratar como fonte canonica sem confirmacao:
- `app.js`
- `serve-nodere.mjs`
- `backend/`
- `nodere-site-premium/`

## 4. Ambientes e URLs

Frontend producao:
- `https://nodere.com.br`
- `https://www.nodere.com.br`

Backend producao:
- `https://nodere-api.onrender.com`

Supabase conhecido:
- `https://qhopjggnbzewuuktqntp.supabase.co`

Regra:
- Nao assumir staging separado. Confirmar antes de testes com dados.

## 5. Validacao minima antes de mexer em producao

Verificar:
- Vercel project root directory = `apps/web`.
- Render service oficial = `nodere-api`, rootDir = `apps/api`.
- Commit publicado no frontend.
- Commit publicado no backend.
- Dominios `nodere.com.br` e `www.nodere.com.br`.
- API health:
  - `/health`
  - `/api/health`
  - `/api/health/version`
  - `/api/health/supabase`

Se nao houver acesso:
- registrar BLOQUEADO POR ACESSO;
- nao inventar validacao.

## 6. Regras permanentes do projeto

1. Nao remover funcionalidade sem autorizacao explicita.
2. Nao alterar banco sem justificativa tecnica e autorizacao.
3. Nao executar SQL em producao sem autorizacao explicita.
4. Nao expor credenciais em logs, relatorios ou commits.
5. Nao publicar frontend pela raiz.
6. Nao publicar se login real falhar.
7. Nao declarar sucesso baseado apenas em build.
8. Toda alteracao deve atualizar Ajuda/Manual NODERE.
9. Toda alteracao deve atualizar `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`.
10. Validar mobile/tema quando alterar UI.

## 7. Validacoes padrao por tipo de tarefa

Frontend UI:
- `apps/web npm run lint`
- `apps/web npm run typecheck`
- `apps/web npm run build`
- validacao visual desktop/mobile;
- tema claro/escuro;
- zoom quando icones/layout forem alterados.

Backend/API:
- `apps/api npm run typecheck`
- `apps/api npm run build`
- testes especificos:
  - `test:phase1`
  - `test:calendar`
  - `test:reports`
  - `test:crm`
  - `test:whatsapp`
  - `test:ai-discovery`

Raiz:
- `npm run build`
- `git diff --check`

Banco/comercial:
- `node scripts/validate-commercial-schema.mjs`
- `node scripts/homologate-commercial-flow.mjs`
- backup logico antes de SQL;
- nunca persistir connection string em arquivo.

## 8. Mapa rapido de modulos

Dashboard:
- rotas `/dashboard`, `/app/dashboard`
- componentes `Header`, `Sidebar`, `MobileNav`
- endpoint `/api/dashboard`

Empresas/Ficha:
- rotas `/companies`, `/companies/[id]`
- componente `LeadOperations.tsx`
- endpoints `/api/companies`, `/api/leads`, `/api/communications`, `/api/contracts`, `/api/files`

CRM:
- rota `/crm`
- componente `CrmBoard`
- endpoints `/api/crm`, `/api/leads/:id/stage`

Busca/Discovery:
- rotas `/searches`, `/discovery`, `/app/discovery`
- endpoints `/api/searches`, `/api/discovery`, `/api/pagespeed`, `/api/places/search`

Catalogo:
- rota `/catalog`
- endpoint `/api/catalog`
- tabela `catalog_items`

Propostas:
- rota `/app/proposals`
- endpoints `/api/proposals`
- tabelas `nodere_proposals`, `nodere_proposal_audit`, `proposal_templates`, `proposal_versions`

Agenda:
- rotas `/calendar`, `/calendario`
- endpoint `/api/calendar`
- tabela `calendar_events`

Inbox/WhatsApp:
- rota `/inbox`
- endpoints `/api/inbox`, `/api/whatsapp/webhook`

Marketing/CMS:
- rota `/marketing`
- admin `/admin/content`, `/admin/blog`
- endpoints `/api/marketing`, `/api/content`, `/api/admin`

Settings:
- rotas `/settings`, `/app/settings`
- endpoints `/api/settings`, `/api/settings/pipeline`

## 9. Checklist de seguranca antes de commit

Executar:

```powershell
git status --short
git diff --stat
git diff --check
```

Confirmar:
- sem `.env`;
- sem `.env.local`;
- sem `.vercel`;
- sem `.next`;
- sem `node_modules`;
- sem `dist` novo acidental;
- sem logs/caches;
- sem connection strings;
- sem tokens/cookies;
- `nodere-site-premium/` nao incluido sem autorizacao.

## 10. Checklist antes de deploy

Frontend:
- build web aprovado;
- root Vercel `apps/web`;
- commit correto;
- dominios corretos;
- smoke `/login`, `/dashboard`, `/app/dashboard`, modulo alterado.

Backend:
- build API aprovado;
- Render `nodere-api`;
- envs conferidas sem valores;
- health checks;
- login real se auth/session/settings foram tocados.

Banco:
- schema validado;
- migration aplicada apenas com autorizacao;
- rollback/backup documentado.

## 11. Como classificar resultado

Use apenas:
- CONFIRMADO E FUNCIONAL
- CONFIRMADO COM FALHA
- PARCIALMENTE IMPLEMENTADO
- NAO IMPLEMENTADO
- NAO VALIDADO
- BLOQUEADO POR ACESSO
- DOCUMENTADO, MAS NAO LOCALIZADO NO CODIGO

Nunca marcar como funcional sem evidencia:
- comando executado;
- teste visual;
- resposta de endpoint;
- arquivo/codigo confirmado;
- validacao real.

## 12. Primeira pergunta util no novo chat

Se o usuario pedir para continuar sem especificar modulo, responder com:

"Vou usar os documentos NODERE_* como fonte de continuidade, conferir `git status`, confirmar branch/commit e depois atacar a pendencia de maior prioridade sem alterar banco/deploy sem autorizacao."

## 13. Estado final desta auditoria

Documentacao de continuidade criada.
Codigo funcional nao alterado.
Banco nao alterado.
Deploy nao executado.
Credenciais nao expostas.
