import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { sanitizeCommunicationHtml } from "../routes/communicationCenter.js";
import { BRIEFING_FIELDS, calculateBriefingCompletion, missingRequiredBriefingFields, normalizeBriefingAnswers } from "../services/briefingFields.js";
import { renderCommercialBriefingPdf } from "../services/briefingPdf.js";

test("contrato oficial do briefing preserva exatamente 47 campos únicos", () => {
  assert.equal(BRIEFING_FIELDS.length, 47);
  assert.equal(new Set(BRIEFING_FIELDS.map((field) => field.key)).size, 47);
  assert.deepEqual(BRIEFING_FIELDS.filter((field) => field.required).map((field) => field.key), ["company_name", "segment", "decision_maker_name", "next_action"]);
});

test("normalização recusa campos desconhecidos e mede a conclusão", () => {
  const answers = normalizeBriefingAnswers({ company_name: "  NODERE  ", unknown: "não entra", tags: [" crm ", " ia "] });
  assert.deepEqual(answers, { company_name: "NODERE", tags: ["crm", "ia"] });
  assert.equal(Object.hasOwn(answers, "unknown"), false);
  assert.equal(calculateBriefingCompletion(answers), 4);
  assert.ok(missingRequiredBriefingFields(answers).some((field) => field.key === "next_action"));
});

test("HTML de comunicação remove XSS persistente e preserva formatação segura", () => {
  const sanitized = sanitizeCommunicationHtml('<p style="text-align:center" onclick="steal()"><strong>Olá</strong><script>alert(1)</script><a href="javascript:alert(2)">link</a></p>');
  assert.match(sanitized, /<p style="text-align:center"><strong>Olá<\/strong>/);
  assert.doesNotMatch(sanitized, /script|onclick|javascript:/i);
  assert.match(sanitized, /noopener noreferrer nofollow/);
});

test("PDF comercial é válido e materializa todos os campos", async () => {
  const answers = Object.fromEntries(BRIEFING_FIELDS.map((field) => [field.key, `Valor de ${field.label}`]));
  const pdf = await renderCommercialBriefingPdf({ code: "BRF-TESTE", title: "Teste", status: "completed", priority: "normal", version: 2, companyName: "Empresa Teste", answers, generatedAt: new Date("2026-08-01T12:00:00Z") });
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.length > 5_000);
});

test("migration V5 ativa RLS, imutabilidade, outbox e ciclo de exclusão", () => {
  const migration = readFileSync(join(process.cwd(), "src", "db", "migrations", "20260801_nodere_v5_commercial.sql"), "utf8");
  assert.match(migration, /record_state in \('active', 'archived', 'trash'\)/);
  assert.match(migration, /create table if not exists public\.communication_outbox/);
  assert.match(migration, /unique \(workspace_id, idempotency_key\)/);
  assert.match(migration, /communication_events_immutable/);
  assert.match(migration, /nodere_audit_events_immutable/);
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /force row level security/g);
  assert.match(migration, /revoke all on table[\s\S]+from authenticated/);
});

test("catálogo persistido contém os mesmos 47 campos e quatro obrigatórios", () => {
  const catalog = readFileSync(join(process.cwd(), "src", "db", "migrations", "20260801_nodere_v5_briefing_field_catalog.sql"), "utf8");
  const seededKeys = [...catalog.matchAll(/^\s{4}\('([^']+)'/gm)].map((match) => match[1]);
  assert.equal(seededKeys.length, 47);
  assert.deepEqual(seededKeys, BRIEFING_FIELDS.map((field) => field.key));
  for (const field of BRIEFING_FIELDS.filter((item) => item.required)) {
    assert.match(catalog, new RegExp(`\\('${field.key.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}'[^\\n]+true`));
  }
});

test("rotas V5 exigem confirmação de IA, envio e purga protegida", () => {
  const briefing = readFileSync(join(process.cwd(), "src", "routes", "briefings.ts"), "utf8");
  const communications = readFileSync(join(process.cwd(), "src", "routes", "communicationCenter.ts"), "utf8");
  const companies = readFileSync(join(process.cwd(), "src", "routes", "companies.ts"), "utf8");
  assert.match(briefing, /confirmed: z\.literal\(true\)/);
  assert.match(communications, /confirmed: z\.literal\(true\)/);
  assert.match(communications, /sanitizeCommunicationHtml/);
  assert.match(companies, /EXCLUIR DEFINITIVAMENTE/);
  assert.match(companies, /purge_after/);
  assert.match(companies, /legal_hold/);
});

test("frontend oferece roteamento automático, briefing e comunicações", () => {
  const root = join(process.cwd(), "..", "web");
  const ai = readFileSync(join(root, "app", "ai", "page.tsx"), "utf8");
  const sidebar = readFileSync(join(root, "components", "Sidebar.tsx"), "utf8");
  const communications = readFileSync(join(root, "app", "crm", "communications", "CommunicationsClient.tsx"), "utf8");
  assert.match(ai, /Modelo automático/);
  assert.match(ai, /routingMode/);
  assert.match(sidebar, /Briefings Comerciais/);
  assert.match(sidebar, /Comunicações/);
  assert.match(communications, /Salvar na outbox/);
  assert.match(communications, /Confirmar e enviar/);
});
