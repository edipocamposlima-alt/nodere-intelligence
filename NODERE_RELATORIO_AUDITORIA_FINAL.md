# NODERE — Relatório de Auditoria Final

Data de corte: 2026-07-18
Escopo canônico: `apps/web`, `apps/api`, `packages/database`, Vercel, Render e Supabase
Baseline auditado: `66db603ae9e4463e7c25e9ede83ab59f176f31d0`, branch `main`, sincronizada com `origin/main`

## Parecer executivo

O NODERE permanece operacional e recebeu correções materiais em autenticação, isolamento de dados, CRM, PWA, importação, dependências e hierarquia visual. O código canônico compila, os testes automatizados executados passaram e as auditorias `npm` do frontend e backend ficaram sem vulnerabilidades conhecidas.

A publicação da aplicação pode seguir. A migração estrutural de segurança do Supabase não integra o deploy automático: foi preparada com rollback, mas deve permanecer bloqueada até existir backup verificável e um ambiente de staging. Não foi feita alteração destrutiva no banco.

## Evidências principais

| Área | Evidência | Resultado |
|---|---|---|
| Frontend | Next.js 15.5.19, 62 páginas App Router, build de produção e typecheck | Aprovado |
| Backend | 34 arquivos de rotas, typecheck, build e 33 testes | Aprovado |
| PWA/cliente | 21 verificações de manifest, viewport, navegação, cache e sessão | Aprovado |
| Navegador | 4 cenários públicos/de segurança em Chromium desktop e Pixel 5 | Aprovado |
| Sessão | token inválido retorna 401, não cria sessão e não expõe área privada | Aprovado |
| Dependências | `npm audit` em `apps/web` e `apps/api` | 0 vulnerabilidades |
| Produção inicial | API pública saudável em Render, versão 1.0.1 e commit do baseline | Aprovado |
| Banco | projeto Supabase saudável, 49 tabelas públicas com RLS habilitado | Aprovado com pendências |

Dois cenários E2E autenticados foram ignorados porque não há conta/credenciais exclusivas de teste no ambiente local. Isso não invalida os testes de proteção sem sessão, mas impede certificar ponta a ponta os fluxos privados com um usuário real.

## Achados críticos corrigidos

1. A interface podia renderizar filhos antes de concluir a validação assíncrona da sessão. Agora nenhum workspace é exibido antes da confirmação do backend; 401/403 limpa a sessão e redireciona.
2. A rota que criava cookie aceitava token sem confirmar usuário/workspace. Agora a confirmação ocorre antes da gravação do cookie.
3. O cliente tinha fallback para chave pública, token persistente no `localStorage` e componentes consultando Supabase diretamente. As chamadas privadas agora passam por proxy same-origin autenticado por cookie httpOnly, com renovação no servidor; fallback, token local e leituras diretas foram removidos.
4. A conversão do CRM podia atingir 47.400% devido a ordenação dinâmica e divisão de contagens exclusivas. A progressão agora usa ordem canônica, contagem acumulada e limite de 100%.
5. O service worker podia guardar navegações autenticadas. O cache agora aceita apenas recursos públicos/estáticos; páginas internas usam rede e fallback offline sem dados privados.
6. A importação dependia de `xlsx`, pacote com alertas sem correção disponível. Foi substituído por ExcelJS, com limites de 4 MB, 5.000 registros e 100 colunas; XLS legado é rejeitado.
7. Teste de relatório dependia do relógio corrente. O relógio foi injetado e o teste ficou determinístico.

## Banco e identidade

- Supabase em `sa-east-1`, PostgreSQL 17.6, estado `ACTIVE_HEALTHY`.
- 49 tabelas públicas; RLS habilitado em todas.
- 827 empresas; nenhum CNPJ preenchido, portanto a regra de unicidade de CNPJ ainda não tem cobertura por dados reais.
- 162 usuários de plataforma e 2 usuários em `auth.users`: apenas 1 vínculo válido; 135 registros sem `auth_user_id` e 26 vínculos órfãos.
- 28 tabelas com RLS e sem política. A aplicação canônica não usa mais cliente Supabase direto; nesses casos, ausência de política mantém acesso de cliente negado e não deve ser “corrigida” com uma política permissiva.
- Avisos estruturais relevantes: funções com `search_path` mutável, execução ampla de funções `SECURITY DEFINER`, 19 chaves estrangeiras sem índice, 13 tabelas sem chave primária e políticas permissivas sobrepostas.
- A proteção contra senhas vazadas está desabilitada no Auth e precisa ser habilitada no painel Supabase.

Os scripts `packages/database/audit_final_security_hardening.sql` e `packages/database/audit_final_security_hardening_rollback.sql` cobrem o primeiro lote de endurecimento de funções, políticas e vínculo de autenticação. Eles não foram aplicados.

## UX e arquitetura

- Dashboard reorganizado em qualidade da base, execução, distribuição e prioridades.
- Densidade confortável adotada como padrão, conteúdo limitado a 1680px, topbar de 72px e sidebar de 15,5rem.
- Foco visível, contraste escuro reforçado, movimento reduzido respeitado.
- Kanban com personalização recolhida, colunas mais largas e encaixe horizontal.
- `/admin/blog` passa a redirecionar para o CMS canônico, removendo uma gravação legada em tabela inexistente.
- Permanecem bundles elevados em Relatórios, Empresas, Marketing, Calendário, CRM e Ficha. É uma pendência de desempenho, não um bloqueio funcional.

## Decisão de liberação

Status: **APTO PARA DEPLOY DA APLICAÇÃO COM RESSALVAS**.

Ressalvas obrigatórias:

1. não executar a migração SQL sem backup e staging;
2. não declarar integração Anthropic, PageSpeed, WhatsApp Cloud, Apollo ou Econodata como ativa sem teste de credencial/conta;
3. criar uma conta exclusiva de E2E e executar os fluxos autenticados;
4. reconciliar os vínculos de usuários antes de ampliar o acesso;
5. remover/rotacionar `NEXT_PUBLIC_API_KEY` na Vercel após confirmar que nenhum consumidor externo depende dela — o código entregue já não a utiliza.

Os detalhes estão em `NODERE_PENDENCIAS_E_BLOQUEIOS_REAIS.md` e o procedimento de liberação/rollback em `NODERE_DEPLOY_E_VALIDACAO_PRODUCAO.md`.
