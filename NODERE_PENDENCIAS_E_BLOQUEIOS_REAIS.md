# NODERE — Pendências e Bloqueios Reais

Data: 2026-07-18

Este documento separa risco técnico, falta de ambiente e decisão de negócio. Nenhum item é escondido por um “status verde” genérico.

## P0 — antes de qualquer mudança estrutural de banco

### DB-01 — backup e staging inexistentes/não comprovados

- Evidência: projeto Supabase de produção auditado diretamente; não foi apresentado snapshot restaurável nem projeto staging.
- Impacto: qualquer alteração de função/política pode bloquear acesso ou dificultar rollback.
- Bloqueio: não aplicar `audit_final_security_hardening.sql`.
- Desbloqueio: backup, restauração testada, staging e aprovação da janela.

### ID-01 — identidade inconsistente

- Evidência: 162 usuários de plataforma, 2 contas Auth, apenas 1 vínculo válido; 135 sem ID Auth e 26 órfãos.
- Impacto: login, auditoria e isolamento por workspace podem não corresponder ao cadastro administrativo.
- Ação: exportar lista sem dados sensíveis, decidir manter/desativar, criar contas legítimas e vincular por fluxo administrativo.
- Proibição: não preencher IDs por aproximação de nome/email sem confirmação.

### AUTH-01 — proteção contra senhas vazadas

- Evidência: advisor Supabase indica recurso desativado.
- Ação: habilitar no painel Auth e testar recuperação/login.

## P1 — certificação operacional

### E2E-01 — conta automatizada ausente

- Dois cenários autenticados estão implementados, mas ignorados sem `NODERE_E2E_EMAIL`/`NODERE_E2E_PASSWORD`.
- Precisa de usuário descartável, workspace próprio e política de rotação.

### INT-01 — integrações não certificadas

- Anthropic: health indisponível.
- PageSpeed: não configurado.
- WhatsApp Cloud, Apollo, Econodata, calendários e redes sociais: código/preparação não comprovam operação real.
- Render: painel administrativo exige login; saúde pública está disponível, mas variáveis/logs internos não foram inspecionados.

### CMS-01 — schema de conteúdo

- O fluxo canônico está em `/admin/content`; o alias antigo foi corrigido.
- A persistência dinâmica depende de tabelas oficiais do CMS não certificadas no schema observado.

### DEPLOY-01 — versão exata do frontend

- A Vercel mostra deployment READY e domínios verificados, porém o metadata disponível no baseline não forneceu SHA Git exato.
- A implantação final deve registrar URL/horário/commit local revisado e, futuramente, usar integração Git/metadata de versão no app.

## P2 — qualidade, dados e desempenho

- 827 empresas sem CNPJ: deduplicação e enriquecimento limitados.
- 19 chaves estrangeiras sem índice: analisar com consultas reais antes de criar.
- 13 tabelas sem chave primária: definir estratégia por tabela.
- 31 índices não usados: não remover sem janela de observação representativa.
- 18 grupos de políticas permissivas sobrepostas e 1 auth initplan: otimizar após staging.
- bundles altos em Ficha, Empresas, Marketing, Calendário, CRM, Busca e Relatórios.
- falta varredura axe/Lighthouse autenticada e matriz visual completa de zoom.

## Itens que não são falha por si só

- 28 tabelas com RLS e sem política: como não há cliente Supabase direto no web auditado, isso mantém acesso de cliente negado. Criar política `true` seria pior. Cada tabela só precisa de política quando existir caso de uso autenticado definido.
- índices “unused” podem ser novos ou necessários a picos raros; exigem observabilidade.
- integração “preparada” pode permanecer assim se a empresa decidir não contratar o provedor, desde que a UI não a apresente como ativa.

## Decisões humanas necessárias

1. responsável e janela do backup/staging/migração;
2. lista oficial de usuários ativos e papéis;
3. provedores pagos que realmente fazem parte do produto;
4. destino do serviço Render legado/paralelo citado na documentação anterior;
5. orçamento de performance por rota;
6. aprovação para remover/rotacionar a variável pública antiga na Vercel.

## Critério de encerramento

Um bloqueio só fecha com evidência: restore executado, usuário autenticado, transação testada, chamada externa de ida e volta, deployment versionado ou métrica capturada. Declaração verbal de configuração não substitui o teste.
