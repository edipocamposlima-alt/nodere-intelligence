# Recovery Report - dpl_FNSh4CdUHvL3AdNsnW7QFhYfkNWZ

Date: 2026-06-11

Branch: recovery-production-2026-06-11

Functional deployment:

- Deployment ID: dpl_FNSh4CdUHvL3AdNsnW7QFhYfkNWZ
- URL: https://web-7drg7tyb3-edipo-lima-s-projects.vercel.app/
- Production aliases confirmed by `vercel inspect`: https://nodere.com.br and https://www.nodere.com.br
- Created: Mon Jun 08 2026 16:09:22 GMT-0300
- Status: Ready

## What Was Recovered

Recovered 220 files from the Vercel deployment file tree:

- `deployment-files-tree.json`: complete file tree exposed by Vercel for this deployment.
- `recovery-manifest.json`: filtered inventory of recovered files.
- `artifacts/src/.next/**`: compiled Next.js server pages, route handlers, manifests, static chunks, and runtime files.
- `artifacts/src/.vercel/output/**`: Vercel output files exposed as normal files.
- `artifacts/src/package.json` and `artifacts/src/.env.example`.

The recovery script is stored at:

- `scripts/recover-vercel-deployment-artifacts.mjs`

## Important Limitation

The Vercel deployment did not expose the original TypeScript/TSX source files. The recovered package contains compiled deployment artifacts, not the editable source tree that produced them.

This was validated by checking the recovered artifact tree for `*.ts` and `*.tsx`; no source files were present.

## Preserved Route Inventory

Compiled routes preserved from `artifacts/src/.next/server/app`:

- `/`
- `/_not-found`
- `/admin`
- `/ajuda`
- `/api/admin/[...path]`
- `/api/auth/me`
- `/api/auth/session`
- `/automations`
- `/billing`
- `/busca-de-empresas`
- `/calendar`
- `/calendario`
- `/catalog`
- `/companies`
- `/companies/[id]`
- `/configuracoes`
- `/crm`
- `/dashboard`
- `/empresas`
- `/help`
- `/ia`
- `/inbox`
- `/integracoes`
- `/integrations`
- `/intelligence`
- `/login`
- `/manual`
- `/marketing`
- `/operators`
- `/pagespeed`
- `/pipeline`
- `/privacy`
- `/register`
- `/relatorios`
- `/reports`
- `/reset-password`
- `/searches`
- `/settings`
- `/terms`

## Difference Versus origin/main

`origin/main` is at commit:

- `8f2bb525da5745bd140c0ad9a16a0dd7e487809f`

The Vercel deployment contains compiled routes that do not exist in `origin/main` as source files, including:

- `/admin`
- `/calendar`
- `/calendario`
- `/catalog`
- `/help`
- `/manual`
- `/marketing`
- `/privacy`
- `/register`
- `/reset-password`
- `/terms`
- `/api/auth/me`
- `/api/auth/session`
- `/api/admin/[...path]`

Routes that exist in both the deployment artifacts and `origin/main` include:

- `/dashboard`
- `/crm`
- `/busca-de-empresas`
- `/companies`
- `/companies/[id]`
- `/configuracoes`
- `/empresas`
- `/ia`
- `/inbox`
- `/integracoes`
- `/integrations`
- `/intelligence`
- `/login`
- `/operators`
- `/pagespeed`
- `/pipeline`
- `/relatorios`
- `/reports`
- `/searches`
- `/settings`

## Files Still Missing

Original editable source files are still missing for the deployment-only routes, especially:

- `apps/web/app/admin/page.tsx`
- `apps/web/app/calendar/page.tsx`
- `apps/web/app/calendario/page.tsx`
- `apps/web/app/register/page.tsx`
- `apps/web/app/reset-password/page.tsx`
- `apps/web/app/api/auth/me/route.ts`
- `apps/web/app/api/auth/session/route.ts`
- `apps/web/app/api/admin/[...path]/route.ts`

Only their compiled JavaScript deployment artifacts were recoverable from Vercel.

## Production Safety

No deploy was executed during this preservation step.

No production aliases were changed during this preservation step.

No database changes were executed.
