# NODERE - Regras de Negocio e Permissoes

Data: 2026-07-17
Branch: `main`
Commit: `66db603ae9e4463e7c25e9ede83ab59f176f31d0`

## 1. Perfis de acesso

Perfis localizados no codigo:
- `owner`
- `admin`
- `operator`
- `viewer`

Implementacao:
- Backend usa `requireWorkspaceRole("owner", "admin", "operator", "viewer")` conforme rota.
- `isBuiltInOwnerEmail` pode elevar email proprietario interno para owner.
- Frontend usa `useAuth()` para esconder itens admin no menu.

Estado: CONFIRMADO NO CODIGO.
Validacao real por usuario/perfil: NAO VALIDADO nesta etapa.

## 2. Regras gerais de permissao

Owner:
- Acesso total esperado.
- Pode administrar usuarios, roles, integracoes, settings, catalogo e auditoria.

Admin:
- Acesso administrativo amplo.
- Pode gerenciar catalogo, settings e a maioria dos modulos operacionais.

Operator:
- Acesso operacional.
- Pode operar CRM, leads, agenda, propostas conforme regras atuais.
- Pode alterar pipeline em `PATCH /api/settings/pipeline`.

Viewer:
- Leitura esperada.
- Nao deve criar/editar/inativar itens comerciais.

Estado: PARCIALMENTE IMPLEMENTADO. Regras existem em backend/UI, mas exigem testes reais owner/admin/operator/viewer.

## 3. Workspaces e isolamento

Regras:
- Dados devem ser isolados por `workspace_id`.
- Middleware backend anexa workspace na sessao.
- Muitas queries filtram por `getRequestWorkspaceId(req)`.
- Fallback padrao quando ausente: `default`.

Estado: PARCIALMENTE IMPLEMENTADO.
Risco: qualquer rota sem filtro workspace deve ser revisada antes de liberar dados sensiveis.

## 4. Busca de empresas versus lead salvo

Regra:
- Resultado de busca nao e lead salvo.
- Lead entra no CRM apenas ao salvar explicitamente.
- Deduplicacao deve evitar duplicar empresa ja existente.

Implementacao localizada:
- `saveSearchResultAsLead`.
- `POST /api/companies/save-from-search`.
- mensagens de duplicidade em busca.
- caches locais de IDs salvos em `CompanyTable` para experiencia.

Estado: PARCIALMENTE IMPLEMENTADO.
Risco: confirmar deduplicacao real no banco, principalmente por CNPJ, place_id, nome/cidade/estado e workspace.

## 5. CRM e funil

Regras:
- Leads possuem status/etapa/temperatura/score.
- Movimentacoes devem registrar historico.
- Pipeline tem etapas configuraveis.
- Alteracoes de etapa podem gerar proxima acao, motivo, probabilidade, valor e previsao.

Implementacao localizada:
- `updateLeadStage`.
- `getLeadActivities`.
- `CrmBoard`.
- `savePipelineSettings`.

Estado: PARCIALMENTE IMPLEMENTADO.
Risco: etapas ainda usam localStorage em pontos do frontend para preferencia/cores; backend tambem salva pipeline.

## 6. Catalogo Produtos/Servicos

Regras esperadas/documentadas:
- Produtos/servicos sao a fonte comercial oficial.
- Apenas owner/admin criam, editam e inativam.
- Operator/viewer visualizam.
- Itens podem ser ativos/inativos.
- Propostas devem usar apenas itens ativos.

Implementacao localizada:
- `catalog_items`.
- `/api/catalog`.
- `CatalogItem` em `apps/web/lib/api.ts`.
- migration `block_produtos_servicos_composicao_comercial.sql`.

Estado: PARCIALMENTE IMPLEMENTADO.
Validacao real de role e RLS: NAO VALIDADO.

## 7. Propostas e contratos

Regras esperadas/documentadas:
- Propostas vinculadas a itens do catalogo.
- Itens manuais/livres bloqueados no fluxo principal.
- Snapshot comercial gravado no momento da proposta.
- PDF usa snapshot, nao o catalogo vivo.
- Alteracao futura no catalogo nao muda proposta emitida.
- Observacao comercial pode ir ao PDF.
- Observacao interna nao deve ir ao PDF.
- Versionamento e auditoria registram alteracoes.

Implementacao localizada:
- `NodereProposal`, `ProposalItemPayload`, `ProposalSnapshotItem` em `apps/web/lib/api.ts`.
- `/api/proposals`.
- `apps/web/app/companies/[id]/LeadOperations.tsx`.
- `block_produtos_servicos_composicao_comercial.sql`.

Estado: PARCIALMENTE IMPLEMENTADO.
Validacao real de PDF/snapshot/auditoria: NAO VALIDADO nesta etapa.

## 8. Descontos

Regras:
- Desconto por percentual OU valor.
- Percentual e valor simultaneos devem ser bloqueados.
- Motivo obrigatorio quando houver desconto.
- Calculo automatico: subtotal, desconto, total/final.

Implementacao localizada:
- Tipos no frontend.
- SQL comercial com constraints.
- API proposals.

Estado: PARCIALMENTE IMPLEMENTADO.
Risco: verificar constraints no Supabase real.

## 9. Auditoria

Regras:
- Alteracoes importantes em propostas, PDF e movimentacoes devem registrar auditoria/historico.
- `/api/audit` deve ser acessivel apenas por owner/admin.

Implementacao:
- `/api/audit` protegido por `requireWorkspaceRole("owner", "admin")`.
- `nodere_proposal_audit`.
- `activity_logs`.

Estado: PARCIALMENTE IMPLEMENTADO.
Pendente: validar registros reais em fluxo autenticado.

## 10. PDFs e exportacoes

Regras:
- PDF deve exigir usuario autenticado quando conteudo for interno.
- PDF deve usar dados reais do registro.
- PDF de proposta/contrato deve usar snapshot.
- Dados internos nao devem vazar no PDF.
- CSV deve usar encoding/campos corretos.

Implementacao:
- `fetchAuthenticatedFile`.
- `pdfkit` no backend.
- endpoints `/api/proposals/:id/pdf`, `/api/reports/pdf`, `/api/reports/export.csv`, endpoints PDF de companies.

Estado: PARCIALMENTE IMPLEMENTADO.
Historico indica correcoes recentes; esta etapa nao gerou PDF real.

## 11. Configuracoes e preferencias

Regras:
- Tema/fonte/layout/densidade/cor primaria devem persistir no backend e reaplicar no boot.
- Owner/admin podem salvar preferencias globais.
- Pipeline pode ser alterado por owner/admin/operator.

Implementacao:
- `/api/settings` GET/PATCH.
- `settingsStore`.
- `apps/web/lib/theme.ts`.
- script inline em `apps/web/app/layout.tsx`.

Estado: PARCIALMENTE IMPLEMENTADO.
Validacao real refresh/logout/login: NAO VALIDADO nesta etapa.

## 12. Manual/Ajuda como regra permanente

Regra definida pelo projeto:
- Toda alteracao futura deve atualizar a aba Ajuda/Manual NODERE e `RELATORIO_ATUALIZACAO_MANUAL_NODERE.md`.

Estado: DOCUMENTADO NO HISTORICO DO PROJETO.
Obrigacao para continuidade: qualquer novo chat deve manter esta regra antes de concluir tarefas.

## 13. Admin/CMS

Regras:
- CMS gerencia paginas publicas e conteudo.
- Public read para conteudo publicado.
- Mutacoes admin devem ser protegidas.

Implementacao:
- `block_admin_cms.sql`.
- `/api/content`.
- `/api/admin`.
- paginas `admin/content`, `admin/blog`, `pagina/[slug]`.

Estado: PARCIALMENTE IMPLEMENTADO.
Risco: validar RLS real para publico/admin.

## 14. Integracoes e segredos

Regras:
- Chaves secretas somente no backend/Render/Supabase.
- Frontend recebe apenas `NEXT_PUBLIC_*`.
- Service role nunca deve ir ao cliente.
- Logs e relatorios nao podem expor valores.

Estado: CONFIRMADO COMO DIRETRIZ NO CODIGO/DOCS.
Validacao de painel: BLOQUEADO POR ACESSO nesta etapa.
