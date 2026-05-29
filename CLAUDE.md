# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (SPA estática)
```bash
npm run serve          # Inicia servidor estático na porta 4173
```
No Windows: execute `INICIAR_NODERE.bat`

### Backend MVP (em produção — `backend/`)
```bash
cd backend && npm install
npm run dev            # node --watch (recarrega ao salvar)
npm start              # node src/server.js (produção)
```
No Windows: execute `INICIAR_API_MVP.bat`

### API TypeScript (`apps/api/` — em desenvolvimento)
```bash
cd apps/api
npm run dev            # tsx watch src/server.ts
npm run typecheck      # tsc --noEmit
npm run build          # tsc → dist/
```

### Frontend Next.js (`apps/web/` — em desenvolvimento)
```bash
cd apps/web
npm run dev            # next dev
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
```

### Diagnóstico de APIs Google
```bash
node scripts/debug-google-places.mjs
```

## Arquitetura

O projeto tem **duas camadas separadas** e **duas implementações da API coexistindo**:

### Camada 1 — Frontend estático (em produção)
- `index.html` + `app.js` + `service-worker.js`: SPA vanilla JS publicada no GitHub Pages.
- **Não executa backend e não pode conter segredos.** Todo acesso a APIs externas passa pelo backend.
- Persiste dados em `localStorage` quando não há backend configurado.
- O usuário configura a URL do backend em `#configuracoes` no runtime.

### Camada 2 — Backend seguro (em produção: `backend/`)
- Express + Node.js ESM (`"type": "module"`), porta 3333.
- Guarda e usa todas as chaves: Google Places, PageSpeed, OpenAI, WhatsApp Cloud API, Supabase.
- Rate limit simples em memória (Map por IP, 120 req/min).
- Autenticação opcional via `MVP_OWNER_TOKEN` (Bearer token em todas as rotas).
- CORS restrito: aceita apenas as origens definidas em `config.frontendOrigin` e `config.productionFrontendOrigin`.

### Implementação em TypeScript (`apps/api/` + `apps/web/`) — em desenvolvimento
- `apps/api/`: reescrita da API em TypeScript com Zod para validação, Helmet, pg (PostgreSQL direto).
- `apps/web/`: frontend Next.js 15 + Tailwind como substituto da SPA vanilla.
- Ainda não está em produção — o `backend/` é o que roda no Render/Railway.

## Campos do Lead (normalizeLead)

Além dos dados básicos (nome, telefone, site, endereço, rating), o lead agora inclui:
- **Redes sociais**: `instagram`, `facebook`, `linkedin`, `youtube`
- **CNPJ**: campo `cnpj`
- **Decisor**: `decisionMaker`, `decisionMakerRole`, `decisionMakerLinkedin`, `decisionMakerEmail`
- **Dor principal**: `mainPain`
- **Checklist Google Ads**: `googleAdsChecklist` (objeto livre)

Ao adicionar campos ao lead, incluí-los também em: `normalizeLead`, na lista `fields` em `openLeadDialog`, e (se editável pelo usuário) no formulário HTML do `#leadDialog`.

## Aba Serviços no Lead Dialog

A aba "Servicos" (`leadTab-servicos`) é renderizada por `renderLeadServicos(lead)`. Ela:
- Lista os `services` globais em um `<select>` para adicionar à negociação do lead
- Exibe as `lead.negotiations[]` (serviços em negociação) com valor total
- Chama `addServiceToLead()` para adicionar e oferece botões "Gerar proposta PDF" e "Gerar contrato"

## Padrões Importantes

### Resolução de variáveis Google com fallback
`backend/src/config.js` resolve as chaves Google em cascata:
```
GOOGLE_PLACES_API_KEY → GOOGLE_API_KEY → GOOGLE_MAPS_API_KEY
```
Isso permite usar uma única chave genérica `GOOGLE_API_KEY` para múltiplos serviços.

### Fallback operacional para OpenAI
`backend/src/services/aiDiagnosis.js` e `app.js` detectam ausência de `OPENAI_API_KEY` e retornam um diagnóstico local gerado a partir dos dados do lead — o sistema nunca quebra por falta de IA.

### Score de oportunidade
`apps/api/src/services/scoring.ts` calcula um score 0–100 baseado em sinais do lead (rating Google < 4.2, site ausente, PageSpeed < 60, sem Google Ads, etc). Scores ≥ 65 = Alta, ≥ 40 = Media.

### Classificação de erros Google Places
`backend/src/services/googlePlaces.js` classifica erros da API (chave inválida, API não ativada, billing inativo, quota excedida) em `error.code` específicos para dar feedback preciso ao usuário.

## Banco de Dados

Schema principal em `mvp-supabase-schema.sql`. Tabelas centrais:
- `mvp_leads` — lead com dados do Google Places e CRM
- `mvp_site_scans` — resultado do scan do site (SSL, responsividade, PageSpeed, etc.)
- `mvp_diagnoses` — diagnóstico IA por lead
- `mvp_crm_events`, `mvp_tasks`, `mvp_notes` — histórico e agenda comercial
- `mvp_searches` — histórico de buscas realizadas
- `mvp_ai_memory` — contexto persistente para o chat IA

O schema para a versão SaaS completa está em `ENTERPRISE_DATABASE_SCHEMA.sql`.

## Deploy

- **Frontend**: GitHub Pages publica automaticamente a branch `main`. A pasta `docs/` contém o build estático.
- **Backend**: Render ou Railway. Root directory: `backend`. Build: `npm install`. Start: `npm start`.
- Após deploy, configurar a URL pública do backend na tela `#configuracoes` da SPA.

## Segurança

Nenhuma chave de API pode estar no frontend (`app.js`, `index.html`, `docs/`), no repositório ou em `localStorage`. Toda chamada a Google, OpenAI e WhatsApp passa exclusivamente pelo `backend/`.
