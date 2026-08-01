# 00 — Fonte oficial e baseline da NODERE

Data do baseline: 2026-07-22
Branch de trabalho: `codex/nodere-ai-first-v3`
Commit-base: `098ef8442f39f01213f0c1bb55200080d079bdfb`
Tag-base: `v1.1.0`

## Fonte oficial

- Repositório: `https://github.com/edipocamposlima-alt/nodere-intelligence.git`.
- Frontend oficial: `apps/web`, Next.js App Router.
- Backend oficial: `apps/api`, Express + TypeScript.
- Banco/Auth oficial: Supabase `qhopjggnbzewuuktqntp`, região `sa-east-1`.
- Frontend produtivo: Vercel, projeto `web`, domínio `nodere.com.br`.
- Backend produtivo: Render, serviço `nodere-api`, URL `nodere-api.onrender.com`.
- Os arquivos da raiz `app.js`, `serve-nodere.mjs`, `backend/` e `dist/` são legado e não são a fonte da plataforma atual.

## Estado Git preservado

A entrega pós-produção anterior foi preservada no commit `521a096` da branch `codex/finalizacao-pos-producao-20260719`. A branch AI-first foi criada a partir da mesma revisão executável que está em `main`, sem carregar os documentos não publicados na aplicação.

O segredo OpenAI novo está somente em `.env.local`, que é ignorado pelo Git. A chave foi criada com o nome `Codex` no projeto selecionado da OpenAI Platform e validada por chamada autenticada a `/v1/models` com HTTP 200. O valor nunca foi impresso.

## Produção no início da execução

| Camada | Evidência em 2026-07-22 | Estado |
|---|---|---|
| Vercel | `dpl_EV7mjn2Wx2ZGNMFQob8qRFW7TUtz`, commit `098ef844...` | READY |
| Web oficial | `https://nodere.com.br/login` | HTTP 200 |
| Render/API | versão `1.1.0`, commit `098ef844...` | saudável |
| OpenAI produtiva | `/api/health/providers` | `ok` |
| Anthropic produtiva | `/api/health/providers` | `down` |
| Vercel runtime | janela anterior de 24h | nenhum cluster de erro |

Rollback Web: promover `dpl_5uE3ZH9hGskw6FFNVaNE5rydZQLN` ou outro deployment aprovado do commit-base.
Rollback API: promover o deployment Render 1.1.0 anterior aprovado.
Rollback banco: não executar SQL sem script reverso, inventário de objetos e validação de transação.

## Supabase

- projeto `ACTIVE_HEALTHY`, PostgreSQL 17.6;
- migrations registradas pelo provedor: zero;
- tentativa de listar branches retornou erro de validação do provedor; nenhum staging foi comprovado;
- 49 tabelas públicas observadas, todas com RLS habilitado;
- 862 empresas, 520 notas, 162 perfis de plataforma, 1 workspace;
- 14 propostas, 8 versões de proposta, 11 itens de catálogo e 9 eventos de calendário;
- advisors anteriores continuam apontando RLS sem política em múltiplas tabelas, funções com `search_path` mutável e riscos/performance já documentados.

O número de empresas aumentou de 827 para 862 desde a auditoria de 19/07, confirmando uso real da produção. Dados produtivos não serão usados como massa de teste.

## IA e créditos no baseline

- `config.openai.model` usa fallback obsoleto `gpt-4o-mini`;
- chamadas principais usam Chat Completions diretamente;
- existem dois serviços de IA paralelos (`services/ai.ts` e `services/openai.ts`);
- não há conversa canônica, registry administrável, roteador por plano/capacidade, recibo ou ledger de IA;
- `nodere_ai_usage_log` é tratado como opcional e registra tokens zero;
- existem saldos `999999` em rotas, serviços e SQL para contas privilegiadas/planos;
- consumo atual decrementa colunas de workspace sem reserva, idempotência, estorno ou ledger imutável.

Esses itens são falhas de produto e serão removidos da nova arquitetura, não apenas ocultados na interface.

## Credenciais e ambientes

Situação inicial:

- uma chave local nova em `.env.local`, criada no projeto OpenAI selecionado;
- uma chave produtiva já configurada no Render, sem valor exposto;
- não há comprovação de projetos OpenAI separados `NODERE-DEV`, `NODERE-STAGING` e `NODERE-PROD`;
- nenhuma chave OpenAI foi encontrada em arquivos rastreados pelo padrão `sk-*`;
- arquivos `.env` reais não são rastreados;
- o histórico contém referências textuais a `OPENAI_API_KEY=`, mas a varredura por prefixos de chave não encontrou segredo OpenAI versionado.

## Inventário de variáveis de IA, sem valores

Atuais: `OPENAI_API_KEY`, `OPENAI_MODEL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `AI_PROVIDER_PRIMARY`.

Necessárias na arquitetura-alvo: `OPENAI_PROJECT_ID`, `OPENAI_ORG_ID`, `OPENAI_MODEL_DEFAULT`, `OPENAI_MODEL_FALLBACK`, `AI_MAX_TOOL_STEPS`, `AI_REQUEST_TIMEOUT_MS`, `AI_MAX_COST_USD`, `AI_CREDITS_PER_USD`, `AI_ENVIRONMENT`, além das credenciais separadas por provedor.

## Referência atual de modelos

O resolver oficial consultado em 22/07/2026 indicou `gpt-5.6-sol` como modelo frontier, com `gpt-5.6-terra` para equilíbrio e `gpt-5.6-luna` para alto volume/custo sensível. A arquitetura usará o Responses API para raciocínio, ferramentas e conversas, com registry no backend/banco e seleção automática baseada em política. Nenhum slug ficará hardcoded na interface.

## Gates antes de produção AI-first

1. migração aditiva, reversível e validada;
2. remoção dos créditos artificiais;
3. ledger idempotente com reserva, captura e estorno;
4. autorização por ferramenta e workspace;
5. testes de prompt/tool injection e isolamento;
6. chat com persistência, recibos e links reais;
7. preview aprovado antes de promover o mesmo artefato;
8. smoke, logs, advisors e rollback registrados.
