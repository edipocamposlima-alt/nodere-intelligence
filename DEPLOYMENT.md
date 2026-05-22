# Nodere Intelligence Deployment Guide

## Prototype Deployment

The current version is a static prototype. It can be deployed to:

- Vercel static project.
- Netlify.
- Cloudflare Pages.
- Firebase Hosting.
- Any static web server.

Required files:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `service-worker.js`
- `logo.svg`

## Recommended Production Stack

- Frontend: Next.js + TypeScript.
- Backend: Node.js with Fastify or NestJS.
- Database: PostgreSQL.
- ORM: Prisma.
- Queue: Redis + BullMQ.
- Auth: Firebase Auth or Auth.js.
- Storage: Google Cloud Storage or S3.
- Billing: Stripe.
- Observability: Sentry + structured logs.

## Deployment Environments

### Development

- Local PostgreSQL.
- Local Redis.
- Test API keys.
- Mocked Google/WhatsApp providers.

### Staging

- Separate database.
- Real auth.
- Sandbox billing.
- Restricted Google/Meta credentials.
- Internal users only.

### Production

- Isolated production database.
- Encrypted provider tokens.
- Backups.
- Rate limits.
- Audit logs.
- LGPD controls.
- Monitoring and alerting.

## Production Checklist

- Configure domain and HTTPS.
- Configure authentication provider.
- Apply database migrations.
- Configure organization/workspace creation.
- Enable backend permission checks.
- Configure Google OAuth app.
- Configure Google Places/Maps keys.
- Configure Google Ads API access.
- Configure WhatsApp Cloud API.
- Configure billing plans and webhooks.
- Add privacy policy and terms.
- Add monitoring, alerts and backups.

## Security Notes

- Never expose Google, Meta, Stripe or database secrets in the frontend.
- All module permissions must be enforced on backend endpoints.
- Store provider tokens encrypted.
- Log permission and billing changes.
- Keep source, date and confidence for enriched public data.
- Respect Google, Meta and data privacy terms.
