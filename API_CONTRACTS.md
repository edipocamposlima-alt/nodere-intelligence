# Nodere Intelligence API Contracts

Base URL: `/api/v1`

## Auth and Users

### `POST /auth/session`
Creates or refreshes an authenticated session.

```json
{
  "provider": "firebase",
  "idToken": "..."
}
```

### `GET /users`
Returns workspace users and module permissions.

### `POST /users/invite`
Creates an invitation token and initial permissions.

```json
{
  "email": "sdr@empresa.com",
  "name": "Novo SDR",
  "role": "sdr",
  "modules": ["dashboard", "search", "company", "crm", "inbox"]
}
```

### `PATCH /users/:id/permissions`
Updates tab-level access.

```json
{
  "modules": ["dashboard", "search", "scanner", "company", "reports"]
}
```

## Leads and Search

### `POST /leads/search`
Starts a Google/Places discovery job.

```json
{
  "city": "Sao Paulo",
  "state": "SP",
  "segment": "clinicas odontologicas",
  "keyword": "implante dentario",
  "filters": {
    "withoutWebsite": true,
    "withoutWhatsapp": false,
    "withoutGoogleAds": true,
    "maxGoogleRating": 4.2
  }
}
```

### `GET /leads`
Lists leads with filters, pagination and assignment.

### `GET /leads/:id`
Returns lead, audit, score, interactions and deal.

### `POST /leads/:id/enrich`
Runs enrichment using public data and configured providers.

### `GET /leads/:id/events`
Returns the commercial timeline for a lead.

### `POST /leads/:id/events`
Records a note, WhatsApp action, status change or diagnosis event.

```json
{
  "eventType": "note",
  "body": "Cliente pediu retorno depois do diagnostico."
}
```

## Audits and Intelligence

### `POST /leads/:id/audit`
Runs digital audit.

### `POST /leads/:id/diagnosis`
Generates AI diagnosis and commercial plan.

### `GET /google/business-profile/:leadId/audit`
Returns Google Business Profile readiness.

### `GET /google/ads/:leadId/readiness`
Returns Google Ads readiness and missing assets.

### `POST /google/ads/:leadId/conversion-plan`
Generates tracking and conversion plan.

## CRM

### `PATCH /deals/:id/stage`
Moves a deal between pipeline stages.

```json
{
  "stage": "proposal_sent",
  "probability": 60
}
```

### `POST /tasks`
Creates a task or follow-up.

### `POST /interactions`
Records email, WhatsApp, call or meeting.

## Inbox and WhatsApp

### `POST /whatsapp/messages`
Sends a WhatsApp Cloud API message.

```json
{
  "leadId": "uuid",
  "template": "diagnosis_offer",
  "variables": {
    "company": "Odonto Prime Paulista",
    "score": "86"
  }
}
```

### `POST /webhooks/whatsapp`
Receives delivery, read and inbound message events.

## Reports

### `POST /reports/export`
Creates PDF, XLSX or CSV export.

```json
{
  "type": "diagnosis_pdf",
  "leadId": "uuid"
}
```

## Billing and Credits

### `GET /billing/subscription`
Returns current plan, limits and renewal date.

### `GET /billing/usage`
Returns credit consumption by event type.

### `POST /billing/credits`
Adds or consumes credits.

```json
{
  "eventType": "lead_enrichment",
  "amount": -5,
  "description": "Enrichment for 1 lead"
}
```

## Performance

### `GET /performance/forecast`
Returns revenue forecast and pipeline metrics.

### `GET /performance/operators`
Returns productivity ranking by user.
