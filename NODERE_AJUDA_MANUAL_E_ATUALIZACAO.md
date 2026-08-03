# NODERE — Ajuda, Manual e Atualização

Data: 2026-07-22

## Itens atualizados

O manual embutido em `apps/web/app/manual/page.tsx`, o manual técnico `docs/manual-nodere.md` e `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md` foram revisados nesta auditoria.

| Tópico | Mudança documentada |
|---|---|
| CRM | ordem canônica, conversão acumulada até 100%, personalização recolhida e scroll horizontal |
| Tema/layout | densidade confortável, topbar, largura e hierarquia |
| PWA | cache apenas público; dados privados exigem rede |
| Login | validação antes de renderizar, cookie após confirmação e estados 401/503 |
| Importação | CSV/XLSX, bloqueio de XLS, 4 MB, 5.000 registros e 100 colunas |
| CMS | `/admin/blog` redireciona ao conteúdo canônico e depende do schema oficial |
| Erros | sessão expirada, serviço indisponível e formato de planilha |
| Banco | migração depende de backup e staging |
| NODERE AI | /ai é a entrada autenticada; Dashboard permanece módulo |
| Agentes/modelos | seleção limitada por agente e perfil; frontier indisponível para viewer |
| Ferramentas | leitura automática; escrita exige aprovação e recibo idempotente |
| Créditos | reserva, captura, liberação e ledger; sem saldo não há chamada |
| Chaves | uma chave por provedor no backend; nenhuma entrada de chave no frontend |
| PWA | app instalado inicia em /ai; conteúdo autenticado continua fora do cache |

## Relatórios Executivos

Foram revisados porque o problema de conversão estava no indicador do CRM. A lógica visual agora usa etapas canônicas, alcance acumulado e teto de 100%. Os endpoints de relatório passaram na suíte dedicada com período determinístico.

Não houve mudança de significado para os totais de empresas, propostas ou atividades; por isso não foi criada uma segunda fórmula paralela nesses relatórios.

## Orientação ao suporte

- **Sessão expirada:** peça novo login; a interface não deve manter Dashboard/CRM visível.
- **Serviço indisponível:** use Nova tentativa; não recomende limpar todo o navegador como primeira ação.
- **Planilha XLS:** converter para XLSX ou CSV; não renomear apenas a extensão.
- **PWA offline:** dados internos exigem conexão; a tela offline não é cópia do CRM.
- **Conversão acima de 100%:** indica versão antiga/cache; atualizar o app e confirmar a implantação mais recente.
- **Usuário sem acesso:** verificar vínculo em Auth + `nodere_platform_users` + workspace; não ampliar política RLS genericamente.

## Regra de manutenção

Toda mudança em sessão, dados, etapa de CRM, relatório, importação, permissão, integração ou PWA deve atualizar, no mesmo pull/commit:

1. Ajuda embutida quando o usuário percebe a mudança;
2. `docs/manual-nodere.md` quando há procedimento técnico/operacional;
3. matriz e resultado de testes;
4. registro de atualização do manual;
5. status de integração ou bloqueio real quando aplicável.

## Status

- Manual embutido: atualizado.
- Manual técnico: atualizado.
- Registro do manual: atualizado.
- Relatórios Executivos: revisados.
- Pendência documental: acrescentar evidência do deploy final após a publicação.

## NODERE AI-first V3

Após autenticar, o usuário entra em /ai. O chat permite escolher agente e somente os modelos autorizados para aquele agente e perfil. Visualizador consulta dados; Operador, Admin e Owner podem aprovar mutações disponibilizadas pelo agente. Toda mutação deve mostrar o pedido de confirmação, aceitar rejeição sem efeito e retornar recibo quando executada.

O saldo exibido vem da carteira transacional. Antes de gerar, o backend reserva o teto estimado; ao terminar, captura o custo pelos tokens medidos e devolve a diferença. Falha anterior ao uso libera a reserva. Falha de captura após uso mantém a reserva para reconciliação. Não existe crédito infinito nem resposta simulada.

A chave OpenAI é central do ambiente e fica somente no backend. Configurações do workspace não aceitam mais openai_key. O usuário nunca precisa de chave por modelo.

Estado operacional em 2026-07-22: código, testes, migration e rollback estão preparados no branch codex/nodere-ai-first-v3; a migration e o deploy V3 não foram aplicados à produção. Não use o novo chat em produção até a aplicação controlada do schema, validação do ledger e smoke autenticado.

## Retomada V6 — atualização de 2026-08-01

- Login: contas do Supabase Auth e contas protegidas da plataforma convergem para a mesma sessão; nenhuma senha ou token é persistido no código.
- Permissões: menu desktop, menu mobile e API usam a mesma matriz por módulo e nível de leitura/escrita.
- Perfis: Owner/Admin têm acesso integral; Operador respeita os módulos liberados; Viewer é somente leitura; Restricted é bloqueado.
- Comunicações: anexos de briefing e arquivos da empresa são resolvidos no backend, limitados a 10 itens/20 MB e enviados pelo SMTP. Arquivo local é salvo primeiro na área protegida da empresa.
- Segurança: anexos externos, tipos não permitidos, caminhos de outro workspace e referências inexistentes bloqueiam todo o envio.
- Banco: a migração e o rollback V6 estão versionados; a aplicação em produção depende da liberação do conector Supabase.
- Qualidade local: 71 testes da API, builds de API/web e 25 verificações mobile/PWA aprovados nesta retomada.
