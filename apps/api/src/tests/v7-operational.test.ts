import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { renderReportPdf } from "../services/reportPdf.js";
import { calculateOpportunityScore } from "../services/scoring.js";

const repositoryRoot = path.resolve(process.cwd(), "../..");
const read = (relative: string) => fs.readFileSync(path.join(repositoryRoot, relative), "utf8");
const walk = (directory: string): string[] => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  if (["node_modules", ".next", "dist", "tests"].includes(entry.name)) return [];
  const absolute = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(absolute) : entry.isFile() && /\.(?:ts|tsx|js|mjs|html)$/.test(entry.name) ? [absolute] : [];
});

test("conta interna depende de UUID imutável e não de e-mail em código de sessão", () => {
  const migration = read("apps/api/src/db/migrations/20260803_nodere_v7_operational_completion.sql");
  assert.match(migration, /user_id uuid primary key references auth\.users\(id\)/);
  assert.match(migration, /account_type text not null default 'OWNER_INTERNAL'/);
  for (const file of ["apps/api/src/services/adminSession.ts", "apps/api/src/middleware/session.ts", "apps/api/src/services/userStore.ts"]) {
    assert.doesNotMatch(read(file), /edipo\.lima@nodere\.com\.br/i, file);
  }
});

test("salvar modelo de comunicação não aciona proposta ou documento", () => {
  const route = read("apps/api/src/routes/communicationCenter.ts");
  const start = route.indexOf('router.post("/templates"');
  const end = route.indexOf('router.', start + 20);
  const templateHandler = route.slice(start, end);
  assert.ok(start >= 0);
  assert.match(templateHandler, /nodere_communication_templates/);
  assert.doesNotMatch(templateHandler, /nodere_proposals|documents|pdf|stage/i);
});

test("Ficha antiga redireciona para a única Ficha 360 canônica", () => {
  const legacy = read("apps/web/app/companies/[id]/page.tsx");
  assert.match(legacy, /\/app\/crm\/clientes\//);
  assert.doesNotMatch(legacy, /LeadOperations|AuditPanel|CompanyPdfActions/);
});

test("ditado global usa PT-BR, exige revisão e bloqueia campos sensíveis", () => {
  const voice = read("apps/web/components/VoiceInputAssistant.tsx");
  assert.match(voice, /recognition\.lang = "pt-BR"/);
  assert.match(voice, /Revise antes de aplicar/);
  assert.match(voice, /senha\|password\|token/);
});

test("proposta e contrato possuem estruturas A4 distintas no servidor", () => {
  const pdf = read("apps/api/src/routes/proposals.ts");
  for (const text of ["Resumo executivo", "Escopo e investimento", "1. Partes e objeto", "Confidencialidade e dados", "CONTRATANTE", "Página ${index + 1}"]) assert.match(pdf, new RegExp(escapeRegex(text)));
  assert.match(pdf, /new PDFDocument\(\{ size: "A4"/);
  const legacyCrmPdf = read("apps/api/src/routes/crm.ts");
  assert.match(legacyCrmPdf, /LEGACY_PROPOSAL_PDF_REMOVED/);
  assert.doesNotMatch(legacyCrmPdf, /new PDFDocument/);
});

test("relatório PDF não cria página fantasma para o rodapé", async () => {
  const pdf = await renderReportPdf({
    filters: { period: "30d" },
    metrics: { leads_created: 1, leads_converted: 0, conversion_rate: 0, open_opportunities: 1, deals_won: 0, deals_lost: 0, activities_done: 0, avg_score: 50, pipeline_value: 0 },
    funnel: [{ name: "Novo Lead", count: 1, pct_of_total: 100 }],
    segments: [{ segment: "Serviços", count: 1, avg_score: 50 }],
    timeline: [{ date: "2026-08-03", count: 1 }],
    operators: [{ name: "Proprietário", role: "owner", leads_created: 1, followups_done: 0, leads_closed: 0 }]
  }, new Date("2026-08-03T12:00:00-03:00"));
  const pages = pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || [];
  assert.equal(pages.length, 1);
});

test("Ficha PDF compacta Maps e remove documentos duplicados", () => {
  const source = read("apps/api/src/routes/companies.ts");
  assert.match(source, /Abrir no Google Maps/);
  assert.match(source, /uniqueDocuments/);
  assert.match(source, /lineBreak: false/);
});

test("produto atual não contém os provedores removidos", () => {
  const roots = ["apps/api/src", "apps/web/app", "apps/web/components", "apps/web/lib"];
  const forbidden = /\b(?:apollo(?:\.io)?|econodata)\b/i;
  const offenders = roots.flatMap((relative) => walk(path.join(repositoryRoot, relative))).filter((file) => forbidden.test(fs.readFileSync(file, "utf8")));
  assert.deepEqual(offenders, []);
});

test("score comercial usa uma única escala explicável de zero a cem", () => {
  const scored = calculateOpportunityScore({ name: "Empresa auditada", city: "São Paulo", category: "Clínica", score: 0, status: "Novo Lead", opportunityLevel: "Baixa", detectedOpportunities: [], suggestions: [], notes: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  assert.ok(scored.score >= 0 && scored.score <= 100);
  assert.ok(scored.nodereScore >= 0 && scored.nodereScore <= 100);
  const productFiles = ["apps/api/src/routes/ai.ts", "apps/api/src/routes/intelligence.ts", "apps/web/components/CompanyTable.tsx"];
  for (const file of productFiles) assert.doesNotMatch(read(file), /\/1000|score \* 10/i, file);
});

test("exclusão global exige permissão formal e usa diálogo canônico", () => {
  const route = read("apps/api/src/routes/companies.ts");
  const middleware = read("apps/api/src/middleware/session.ts");
  const actions = read("apps/web/components/records/RecordActionsMenu.tsx");
  assert.match(route, /requireRecordPermission\("records\.delete"\)/);
  assert.match(route, /requireRecordPermission\("records\.purge"\)/);
  assert.match(middleware, /records\.delete/);
  assert.match(actions, /Impacto calculado/);
  assert.match(actions, /Li o impacto/);
});

test("limpeza administrativa usa somente IDs do test data registry", () => {
  const admin = read("apps/api/src/routes/admin.ts");
  const start = admin.indexOf('router.post("/cleanup-demo-data"');
  const end = admin.indexOf('router.delete("/users', start);
  const handler = admin.slice(start, end);
  assert.match(handler, /nodere_test_data_registry/);
  assert.match(handler, /batchId/);
  assert.doesNotMatch(handler, /source\.is\.null|source\.in/);
});

test("criação manual devolve o registro realmente persistido quando há duplicidade", () => {
  const source = read("apps/api/src/routes/companies.ts");
  assert.match(source, /const \[savedCompany\] = await saveCompanies\(\[company\], workspaceId\)/);
  assert.match(source, /status\(201\)\.json\(savedCompany\)/);
  assert.doesNotMatch(source, /status\(201\)\.json\(company\)/);
});

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
