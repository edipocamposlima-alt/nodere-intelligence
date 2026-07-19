# NODERE — Melhorias Implementadas

Data: 2026-07-18

## Segurança e sessão

- validação de usuário/workspace antes de renderizar qualquer conteúdo privado;
- limpeza de sessão e redirecionamento em 401/403;
- tela de nova tentativa para falha transitória da API;
- validação do token antes de criar cookie httpOnly;
- remoção do fallback de chave pública nas chamadas do cliente;
- remoção das leituras diretas do Supabase no frontend;
- módulos do workspace retornados pela API autenticada.

## CRM e negócio

- ordem canônica de etapas e aliases conhecidos;
- progressão acumulada entre etapas, limitada a 100%;
- cabeçalho com quatro KPIs e chips de progressão;
- personalização de etapas recolhida;
- colunas mais legíveis, com rolagem interna e encaixe horizontal.

## Dashboard e UI

- seções de qualidade da base, execução, distribuição e prioridades;
- título e chamadas com hierarquia visual maior;
- conteúdo com largura máxima de 1680px;
- topbar de 72px e sidebar de 15,5rem;
- densidade confortável como padrão;
- contraste escuro, foco visível e movimento reduzido;
- comportamento do Kanban aprimorado para notebook/mobile/zoom.

## PWA

- cache atualizado para v5;
- Dashboard removido do precache;
- navegações tratadas por rede, com fallback offline público;
- runtime cache restrito a ativos públicos/estáticos;
- limpeza de caches anteriores;
- manifest com identidade estável e orientação flexível;
- validador ampliado para impedir regressão de cache privado.

## Dados, importação e dependências

- `xlsx` removido e ExcelJS adotado;
- XLS legado rejeitado com status de formato não suportado;
- limites de 8 MB, 5.000 registros e 100 colunas;
- teste dedicado para CSV/XLSX/XLS;
- Nodemailer atualizado;
- PostCSS e UUID transitivos corrigidos por override;
- `npm audit` final com zero alertas nos dois workspaces.

## Correções técnicas

- teste de período de relatórios tornado determinístico;
- caminhos de configurações corrigidos de `/api/settings` para `/settings` na base URL já versionada;
- `/admin/blog` transformado em alias do editor canônico de conteúdo;
- pacote Supabase removido do frontend após eliminação do uso direto;
- migração SQL de hardening e rollback correspondente preparados, sem execução insegura.

## Documentação e testes

- manuais técnico e embutido atualizados;
- 15 documentos finais de auditoria criados;
- 33 testes de API, 4 E2E públicos/de segurança e 19 checks PWA aprovados;
- builds e typechecks aprovados;
- bloqueios de banco, integrações e credenciais de teste explicitados.

## Compatibilidade

As mudanças preservam rotas canônicas e fluxos centrais. O único comportamento removido intencionalmente é a leitura/gravação direta do Supabase pelo cliente e o suporte a XLS legado, ambos por segurança. O alias `/admin/blog` permanece acessível por redirecionamento.
