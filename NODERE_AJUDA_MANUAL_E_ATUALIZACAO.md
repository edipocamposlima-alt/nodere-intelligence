# NODERE — Ajuda, Manual e Atualização

Data: 2026-07-18

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
