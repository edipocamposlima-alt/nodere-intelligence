# NODERE Intelligence

**NODERE Intelligence** e uma plataforma para encontrar empresas com falhas digitais e transformar esses sinais em oportunidades comerciais para Google Ads, Google Business Profile, trafego pago e consultoria digital.

Slogan:

> Transformando falhas digitais em oportunidades comerciais.

## Status do MVP

O repositorio contem duas camadas:

- Prototipo web estatico pronto para GitHub Pages: `index.html`, `styles.css`, `app.js`, PWA e previews.
- Base evolutiva com Next.js + Express em `apps/web` e `apps/api`, preparada para Google Places, PageSpeed, CRM, WhatsApp, OpenAI e PostgreSQL.

## O que o prototipo entrega

- Dashboard executivo.
- Buscador inteligente de empresas.
- Scanner com buscas salvas e fila de auditoria.
- Google Intelligence para Ads e Perfil da Empresa.
- Tela de empresa com diagnostico, score e playbook.
- CRM Kanban.
- Automacao comercial.
- Inbox com WhatsApp/e-mail simulado.
- Copilot IA com previsao, ROI e proposta.
- Diagnostico printavel em PDF.
- Relatorios e exportacao CSV.
- Admin com usuarios, permissoes por aba e convites.
- Planos, creditos, consumo e faturas.
- PWA instalavel.

## Como abrir localmente

No Windows:

```text
INICIAR_NODERE.bat
```

Ou:

```bash
npm run serve
```

Depois acesse:

```text
http://localhost:4173
```

Tambem e possivel abrir diretamente o arquivo `index.html`.

## Integracoes seguras

A URL em GitHub Pages e estatica. Por seguranca, ela nao le nem armazena chaves reais. Todas as chamadas com segredo devem passar pelo backend em `backend/` ou `apps/api`.

O backend possui conectores para:

- Google Places API: busca real de empresas por texto.
- Google Maps API: geocoding, links e contexto local.
- Google PageSpeed Insights API: performance mobile no diagnostico digital.
- Google Business Profile API: OAuth com `client_id`, `client_secret` e `refresh_token`.
- OpenAI API: diagnosticos comerciais via endpoint seguro.

Na tela `#configuracoes`, informe somente:

- URL da API, por exemplo `http://localhost:3333` ou a URL publicada no Render/Railway.
- Token da API, caso `MVP_OWNER_TOKEN` esteja configurado no backend.

Nunca cole chaves Google/OpenAI na tela do navegador.

Para validar as chaves no `.env`, rode:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-google-apis.ps1
```

O script nao imprime as chaves. Ele mostra apenas o status de Places, Maps, PageSpeed, Business Profile e OpenAI.

## Variaveis principais

Copie `.env.example` para `.env` e preencha conforme necessario:

```env
USE_MOCK_DATA=false
FRONTEND_ORIGIN=http://localhost:4173
PRODUCTION_FRONTEND_ORIGIN=https://edipocamposlima-alt.github.io
MVP_OWNER_TOKEN=
GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_PAGESPEED_API_KEY=
GOOGLE_BUSINESS_PROFILE_CLIENT_ID=
GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET=
GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN=
WHATSAPP_CLOUD_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Deploy

O projeto ja possui `.github/workflows/pages.yml` para publicar o prototipo estatico no GitHub Pages a cada push na branch `main`.

Para a versao com API real:

- Frontend Next.js: Vercel com root `apps/web`.
- Backend Express MVP: Render/Railway com root `backend` e comando `npm start`.
- Backend Next/Express evolutivo: Render/Railway com root `apps/api`.
- Banco: PostgreSQL gerenciado.
- Variaveis: usar os valores do `.env` no painel da plataforma, nunca commitadas no Git.

Depois do deploy do backend:

1. Abra `https://edipocamposlima-alt.github.io/nodere-intelligence/#configuracoes`.
2. Cole a URL publica da API no campo `URL da API`.
3. Informe o token se `MVP_OWNER_TOKEN` estiver ativo.
4. Clique em `Salvar` e depois em `Validar conexoes`.

## Banco de dados

O schema em `packages/database/schema.sql` cria:

- `users`
- `companies`
- `company_scores`
- `company_contacts`
- `crm_notes`
- `crm_status`
- `integrations`
- `searches`

## Proximas evolucoes

- Persistir a API no PostgreSQL em vez de store em memoria.
- Autenticacao JWT ou Firebase Auth.
- Job diario para busca e atualizacao automatica.
- Tela OAuth do Google Business Profile.
- WhatsApp Cloud API com templates aprovados.
- Propostas comerciais geradas por IA.
- Pipeline com drag and drop.
- Relatorios por cidade, segmento e canal.
