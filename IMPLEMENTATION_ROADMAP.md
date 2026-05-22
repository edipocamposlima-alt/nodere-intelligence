# Nodere Intelligence Implementation Roadmap

## Phase 1 - SaaS Foundation

- Next.js app with authenticated routes.
- Firebase Authentication or Auth.js.
- PostgreSQL with Prisma.
- Organization, users, module permissions and invitations.
- Role-based route guards in frontend and backend.
- Basic lead CRUD and CRM pipeline.

## Phase 2 - Lead Discovery

- Google Places search jobs by city, segment and keyword.
- Queue-based enrichment pipeline.
- Website, phone, WhatsApp, address and social profile normalization.
- Credit consumption per search and enrichment.
- Saved searches and recurring scan schedules.

## Phase 3 - Digital Audit

- Website scanner for tags, pixels, GA4, GTM and conversion events.
- PageSpeed Insights integration.
- SEO basic audit.
- Google Business Profile data ingestion where authorized.
- Opportunity, maturity, commercial and paid traffic scores.

## Phase 4 - Google Intelligence

- Google Ads API connection.
- Conversion tracking readiness.
- Missing asset analysis.
- Keyword and recommendation modules.
- Offline conversion import from CRM.
- Business Profile reviews, posts, Q&A, locations and performance.

## Phase 5 - Commercial Automation

- AI diagnosis generation.
- PDF diagnosis export.
- WhatsApp Web quick contact.
- WhatsApp Cloud API for templates, inbound replies and delivery status.
- Inbox with SLA, assignment and conversation history.
- Email sequences and follow-up rules.

## Phase 6 - Revenue Operations

- Billing with Stripe.
- Plans, credits and usage events.
- Operator ranking, goals and productivity.
- Forecast, pipeline value and revenue reports.
- Audit log for user, billing and permission changes.

## Phase 7 - Mobile

- PWA hardening.
- Push notifications.
- React Native or Expo app if native features become necessary.
- Quick WhatsApp contact, mobile CRM and alerts.

## Production Priorities

1. Implement backend permission enforcement before giving real users access.
2. Use official APIs and respect Google/Meta terms.
3. Store provider tokens encrypted.
4. Add LGPD consent, retention and data-source records.
5. Add job queues and rate limiting before large-scale scans.
