# NODERE — Referências Externas Aplicadas

Data de consulta: 2026-07-18

Foram priorizadas fontes oficiais e avisos de segurança primários. As referências apoiaram decisões; não substituíram a inspeção do código e do ambiente NODERE.

## Banco e Supabase

- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): embasou a distinção entre RLS habilitado sem política (negação por padrão) e a necessidade de políticas específicas por papel.
- [Supabase — changelog de breaking changes](https://supabase.com/changelog?tags=breaking-change): usado para checar mudanças recentes antes de propor alteração estrutural.

Aplicação: não foram criadas políticas permissivas nas 28 tabelas hoje backend-only. Helpers `SECURITY DEFINER` e políticas existentes receberam uma migração preparada com schema privado, papel `authenticated`, `search_path` fixo e rollback.

## Next.js e React

- [Next.js 15.5](https://nextjs.org/blog/next-15-5): referência da versão de framework observada e de práticas de build/typecheck.
- [Next.js — Security](https://nextjs.org/blog): consulta de comunicados e orientação oficial de segurança.

Aplicação: sessão validada no servidor/backend antes do cookie, remoção de chave pública do cliente, build de produção e typecheck como gates.

## PWA

- [web.dev — PWA checklist](https://web.dev/articles/pwa-checklist): base para manifest, instalação, responsive e experiência offline.
- [web.dev — Installation](https://web.dev/learn/pwa/installation): base para identidade instalável e orientação ao usuário.

Aplicação: `id` no manifest, orientação flexível, shell offline deliberada e proibição de cache de navegação autenticada.

## Acessibilidade

- [W3C — novidades do WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/): referência para foco visível, tamanho/uso de alvos e interação consistente.

Aplicação: foco global reforçado, hierarquia tipográfica, contraste escuro e suporte a movimento reduzido. A conformidade completa ainda exige auditoria autenticada.

## Planilhas e dependências

- [ExcelJS — releases](https://github.com/exceljs/exceljs/releases): usado na substituição do parser de planilhas.
- [GHSA-4r6h-8v6p-xvw6 — SheetJS prototype pollution](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6).
- [GHSA-5pgg-2g8v-p4x9 — SheetJS ReDoS](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9).
- [GHSA-p6gq-j5cr-w38f — Nodemailer](https://github.com/advisories/GHSA-p6gq-j5cr-w38f).
- [GHSA-w5hq-g745-h8pq — UUID](https://github.com/advisories/GHSA-w5hq-g745-h8pq).
- [GHSA-qx2v-qp2m-jg93 — PostCSS](https://github.com/advisories/GHSA-qx2v-qp2m-jg93).

Aplicação: remoção de `xlsx`, adoção do ExcelJS com limites de entrada, atualização de Nodemailer e overrides corretivos de UUID/PostCSS. As auditorias npm ficaram sem alertas conhecidos.

## Limites da pesquisa

Não foi adotado padrão externo que contradiga a regra de negócio observada. Integrações pagas ou com OAuth não foram declaradas funcionais apenas com base em documentação: exigem teste no tenant real ou sandbox.
