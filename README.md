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

## Integracoes Google validadas

O backend em `apps/api` possui conectores para:

- Google Places API: busca real de empresas por texto.
- Google Maps API: mapas, links e coordenadas vindos do Places.
- Google PageSpeed Insights API: performance mobile no diagnostico digital.
- Google Business Profile API: variaveis e painel preparados para OAuth; a leitura real exige autorizacao dos perfis gerenciados.

Para validar as chaves no `.env`, rode:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-google-apis.ps1
```

O script nao imprime a chave. Ele mostra apenas se Places e PageSpeed estao liberadas.

## Variaveis principais

Copie `.env.example` para `.env` e preencha conforme necessario:

```env
USE_MOCK_DATA=false
GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_PAGESPEED_API_KEY=
GOOGLE_BUSINESS_PROFILE_CLIENT_ID=
GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET=
GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN=
WHATSAPP_CLOUD_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
OPENAI_API_KEY=
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Deploy

O projeto ja possui `.github/workflows/pages.yml` para publicar o prototipo estatico no GitHub Pages a cada push na branch `main`.

Para a versao com API real:

- Frontend Next.js: Vercel com root `apps/web`.
- Backend Express: Railway ou Render com root `apps/api`.
- Banco: PostgreSQL gerenciado.
- Variaveis: usar os valores do `.env` no painel da plataforma, nunca commitadas no Git.

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
