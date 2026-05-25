# Nodere Intelligence MVP Integration Guide

Este guia deixa o MVP pronto para uso pessoal com integrações básicas: login/segurança simples, Google Places, Supabase, scanner de site, IA, WhatsApp por link, CRM e CSV.

## MVP recomendado

1. Buscar empresas reais via Google Places.
2. Salvar leads no Supabase.
3. Rodar scanner no site.
4. Gerar diagnóstico com IA.
5. Abrir WhatsApp com mensagem pronta.
6. Controlar status no CRM.
7. Exportar CSV.
8. Gerar PDF pelo navegador usando a tela de diagnóstico.

## 1. Criar o Supabase

1. Crie um projeto em `https://supabase.com`.
2. Abra o SQL Editor.
3. Rode o arquivo `mvp-supabase-schema.sql`.
4. Vá em Project Settings > API.
5. Copie:
   - Project URL.
   - Service role key.

Para uso pessoal, a API usa a service role key apenas no backend local. Não coloque essa chave no frontend.

## 2. Criar chave Google Places

1. Acesse Google Cloud Console.
2. Crie um projeto.
3. Ative a Places API.
4. Crie uma API Key.
5. Restrinja a chave por API quando terminar os testes.

No MVP inicial, use Google Places para localizar empresas por cidade, segmento e palavra-chave. Google Ads API e Business Profile API ficam para a segunda etapa.

## 3. Criar chave OpenAI

1. Crie uma API key na plataforma da OpenAI.
2. Use a chave somente no backend.
3. O backend tem fallback: se a chave não existir, ele gera um diagnóstico básico sem IA externa.

## 4. Configurar o backend

Na pasta `backend`, crie um arquivo `.env` com base em `.env.mvp.example`.

Campos essenciais:

```env
PORT=3333
FRONTEND_ORIGIN=http://localhost:4173
MVP_OWNER_TOKEN=troque-por-uma-senha-grande
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
GOOGLE_MAPS_API_KEY=sua-chave-google
OPENAI_API_KEY=sua-chave-openai
```

Depois rode:

```bash
cd backend
npm install
npm run dev
```

Teste:

```text
http://localhost:3333/health
```

## 4.1. Conectar a interface ao backend

1. Abra o `index.html`.
2. Entre como Owner.
3. Vá em Admin.
4. Em "MVP local > Conexao com API", preencha:
   - URL da API: `http://localhost:3333`
   - Token pessoal: o mesmo valor de `MVP_OWNER_TOKEN`
5. Clique em "Salvar API".
6. Clique em "Testar conexao".

Depois disso, use:

- Buscador > "Buscar via Google Places" para buscar empresas reais.
- Buscador > "Carregar leads salvos" para sincronizar a lista do Supabase.
- Empresa > "Salvar lead" para gravar no Supabase.
- Empresa > "Scanner real" para auditar o site.
- Empresa > "IA real" para gerar diagnostico com IA.
- Empresa > "Etapa CRM" para mudar o status comercial e sincronizar com Supabase.
- Empresa > "Salvar nota" para registrar follow-up, retorno do cliente ou observacoes comerciais.
- Relatorios > CSV para exportar a base salva, com fallback local se a API estiver offline.

## 5. Fluxo operacional

### Buscar empresas

Endpoint:

```http
POST /api/v1/search/google-places
```

Body:

```json
{
  "city": "Campinas SP",
  "segment": "clinica odontologica",
  "keyword": "implante dentario",
  "limit": 10
}
```

### Salvar lead

Endpoint:

```http
POST /api/v1/leads
```

Use o objeto retornado pelo Google Places.

### Rodar scanner

Endpoint:

```http
POST /api/v1/leads/{id}/scan-site
```

Ele detecta:

- site existente
- HTTPS
- WhatsApp
- Meta Pixel
- Google Tag Manager
- Google Analytics/GA4
- formulário
- telefone
- meta description
- lentidão básica

### Gerar diagnóstico

Endpoint:

```http
POST /api/v1/leads/{id}/diagnosis
```

Retorna:

- resumo comercial
- diagnóstico
- serviços recomendados
- mensagem pronta para WhatsApp
- score de oportunidade

### Atualizar CRM

Endpoint:

```http
PATCH /api/v1/leads/{id}/status
```

Status sugeridos:

- `lead_new`
- `contact_started`
- `diagnosis_sent`
- `meeting_scheduled`
- `proposal_sent`
- `won`
- `lost`

### Registrar historico comercial

Endpoint:

```http
POST /api/v1/leads/{id}/events
```

Body:

```json
{
  "eventType": "note",
  "body": "Cliente pediu diagnostico por WhatsApp e retorno na sexta."
}
```

Tambem existe:

```http
GET /api/v1/leads/{id}/events
```

Eventos usados pelo MVP:

- `note`
- `status_changed`
- `whatsapp_opened`
- `diagnosis_generated`
- `lead_saved`

### Exportar CSV

Endpoint:

```http
GET /api/v1/leads/export.csv
```

## 6. WhatsApp no MVP

No primeiro momento, use link direto:

```text
https://wa.me/55DDDNUMERO?text=MENSAGEM
```

Isso evita a complexidade da WhatsApp Cloud API, aprovação de templates e webhooks. Para uso pessoal, é o caminho mais rápido.

## 7. PDF

O protótipo já tem diagnóstico printável. Use o botão de PDF/print do navegador para salvar o diagnóstico como PDF.

## 8. Próximo passo depois do MVP

Quando o uso pessoal estiver validado, evolua nesta ordem:

1. Conectar a interface ao backend.
2. Trocar token pessoal por login Supabase Auth.
3. Adicionar fila de buscas recorrentes.
4. Integrar WhatsApp Cloud API.
5. Adicionar Google Business Profile.
6. Adicionar Google Ads API.
7. Migrar para Next.js com API routes ou backend separado em produção.
