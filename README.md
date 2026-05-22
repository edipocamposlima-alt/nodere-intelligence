# LeadRadar

MVP web para prospeccao inteligente focada em Google Ads, Google Meu Negocio e presenca digital local.

O produto combina dashboard comercial, busca de empresas, score de oportunidade, diagnostico digital, WhatsApp rapido e CRM simples.

## Stack

- Frontend: Next.js, React, TailwindCSS
- Backend: Node.js, Express
- Banco: PostgreSQL
- Deploy sugerido: Vercel para `apps/web` e Railway/Render para `apps/api`

## Estrutura

```txt
apps/
  api/      Express API, scoring, adapters Google e CRM
  web/      Next.js app, dashboard, empresas, CRM e integracoes
packages/
  database/ schema PostgreSQL
```

## Rodando localmente

1. Instale dependencias:

```bash
npm install
```

2. Crie o `.env`:

```bash
cp .env.example .env
```

3. Suba o Postgres opcional:

```bash
docker compose up -d
```

4. Rode API e Web:

```bash
npm run dev
```

URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/health`

## Modo MVP sem chaves

Por padrao, `USE_MOCK_DATA=true`. A busca inteligente retorna dados demonstrativos e permite validar fluxo, score, WhatsApp por link e CRM sem custo de API.

Para ativar busca real:

```env
USE_MOCK_DATA=false
GOOGLE_PLACES_API_KEY=...
GOOGLE_MAPS_API_KEY=...
GOOGLE_PAGESPEED_API_KEY=...
```

## Integracoes prontas

O codigo ja possui conectores seguros para:

- Google Places API: busca real de empresas por texto.
- Google Maps API: mapas, links e coordenadas vindos do Places.
- Google PageSpeed Insights API: performance mobile no diagnostico digital.
- Google Business Profile API: variaveis e painel preparados para OAuth; a leitura real exige que a conta Google autorize perfis gerenciados.
- WhatsApp Cloud API: `POST /api/companies/:id/whatsapp` envia via Cloud API quando configurado; sem token, retorna link `wa.me`.
- OpenAI API: `POST /api/companies/:id/diagnosis` gera diagnostico comercial; sem chave, usa diagnostico por template.

Variaveis:

```env
GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_PAGESPEED_API_KEY=
GOOGLE_BUSINESS_PROFILE_CLIENT_ID=
GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET=
GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN=
WHATSAPP_CLOUD_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
OPENAI_API_KEY=
```

## Endpoints principais

- `GET /api/dashboard`
- `GET /api/companies`
- `GET /api/companies/:id`
- `POST /api/companies/:id/analyze`
- `POST /api/companies/:id/whatsapp`
- `POST /api/companies/:id/diagnosis`
- `PATCH /api/companies/:id/status`
- `POST /api/companies/:id/notes`
- `POST /api/searches`
- `GET /api/integrations`
- `GET /api/integrations/health`

## Score de oportunidade

O score considera sinais como:

- Nota abaixo de 4.2
- Menos de 50 avaliacoes
- Ausencia de site
- Ausencia de WhatsApp
- Ausencia de Google Ads detectado
- Perfil sem descricao, fotos ou posts recentes
- Falta de resposta a avaliacoes
- Site lento no mobile

Classificacao:

- `Alta`: score >= 65
- `Media`: score >= 40
- `Baixa`: score < 40

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

- Persistir API no PostgreSQL em vez de store em memoria
- Autenticacao JWT ou Firebase Auth
- Job diario para busca e atualizacao automatica
- Persistencia completa dos leads e diagnosticos no PostgreSQL
- Tela de configuracao OAuth do Google Business Profile
- Templates aprovados de WhatsApp para disparos fora da janela de atendimento
- Propostas comerciais geradas por IA
- Pipeline com drag and drop
- Relatorios por cidade, segmento e canal
