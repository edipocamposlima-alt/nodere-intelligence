# NODERE — Mapa de Módulos e Coerência

Data: 2026-07-18

## Arquitetura canônica

```text
Navegador / PWA
  -> Next.js em apps/web (Vercel)
      -> rotas server-side, /api/auth/session e /api/backend
      -> API_URL
          -> Express em apps/api (Render)
              -> Supabase PostgreSQL/Auth
              -> Google Places/Maps/PageSpeed
              -> OpenAI/Anthropic
              -> WhatsApp/Apollo/Econodata, quando configurados
```

Código legado na raiz, `backend/`, `dist/`, `index.html` e `serve-nodere.mjs` não é fonte de produção.

## Módulos funcionais

| Módulo | Interface | Backend/dados | Coerência após auditoria | Observação |
|---|---|---|---|---|
| Autenticação | login, logout, guard global | `/workspace/me`, cookie httpOnly | Forte | valida antes de renderizar |
| Dashboard | `/dashboard` | empresas, CRM, relatórios | Forte | hierarquia revisada |
| Prospecção | buscas/Discovery | Google Places e rotas companies | Forte | chave fica no backend |
| Empresas/Ficha | lista e ficha 360 | `nodere_companies` e entidades vinculadas | Média | 827 registros sem CNPJ |
| CRM/Funil | `/crm`, Kanban e lista | companies/stages/history | Forte | conversão canônica corrigida |
| Leads | visão comercial | companies/workspace | Forte | depende do vínculo de usuário |
| Agenda | calendário/follow-ups | rotas calendar | Forte | 5 testes dedicados |
| Propostas/Contratos | composição e PDF | proposals/catalog | Média | schema existe; baixa massa real |
| Catálogo | produtos/serviços | `catalog_items` | Média | 10 itens observados |
| Comunicação | Inbox/WhatsApp/e-mail | wa.me, webhooks e provedor | Parcial | integração oficial não certificada |
| IA | textos e diagnóstico | OpenAI/Anthropic | Parcial | OpenAI saudável; Anthropic indisponível |
| Relatórios | `/reports` e executivos | `/reports/*` | Forte | teste de período corrigido |
| Marketing | campanhas/conteúdo | APIs sociais/CMS | Parcial | OAuths dependem de configuração |
| Admin | usuários, conteúdo, integrações | workspace, CMS, Supabase | Parcial | `/admin/blog` unificado; CMS precisa schema |
| Configurações | preferências/workspace | `/settings`, `/workspace/me` | Forte | Supabase direto removido |
| Integrações | status/testes | health e provedores | Média | painel externo limita confirmação |
| PWA | manifest/service worker/offline | recursos públicos | Forte | dados privados não são cacheados |

## Regras de coerência

1. `workspaceId`, usuário, papel e módulos vêm do backend autenticado; chamadas privadas usam proxy same-origin e cookie httpOnly, nunca token persistente ou consulta anônima no cliente.
2. Empresa aberta na Ficha deve ter ID persistido; IDs de provedores externos são resolvidos antes da navegação.
3. Dashboard e Relatórios usam a mesma semântica de etapas canônicas do CRM.
4. CMS usa `/admin/content`; `/admin/blog` é apenas alias de compatibilidade.
5. Secrets e service role existem apenas no servidor/ambiente de implantação.
6. PWA não armazena resposta privada.
7. Importação aceita CSV/XLSX moderno e aplica limites antes do processamento completo.

## Incoerências remanescentes

- 161 de 162 usuários da plataforma não possuem vínculo válido com `auth.users`.
- todos os 827 registros de empresa estão sem CNPJ, reduzindo deduplicação e enriquecimento.
- 28 tabelas com RLS sem políticas são inacessíveis ao cliente; isso é seguro, mas precisa ser documentado por tabela se alguma voltar a ser consumida diretamente.
- CMS dinâmico não pode ser certificado sem as tabelas oficiais.
- integrações exibidas como “preparadas” não equivalem a integrações testadas.
- bundles de páginas complexas ainda concentram muitas dependências no cliente.

## Fonte de verdade

- Rotas/UI: `apps/web`.
- API/regra de negócio: `apps/api`.
- Schema/hardening: `packages/database` e projeto Supabase observado.
- Operação: Vercel para frontend; Render para backend.
- Documentação desta rodada: arquivos `NODERE_*` e manuais atualizados na raiz/`docs`.
