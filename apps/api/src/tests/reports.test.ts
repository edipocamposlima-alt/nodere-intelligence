import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildReportCsv,
  escapeCsvCell,
  filterCompaniesForReport,
  normalizeReportFilters
} from "../services/reports.js";

const baseCompanies = [
  {
    id: "company-1",
    name: "Clinica Alfa",
    stage: "Ganho",
    status: "Ganho",
    source: "google_places",
    createdAt: "2026-06-10T10:00:00.000Z",
    ownerId: "operator-1",
    score: 90
  },
  {
    id: "company-2",
    name: "Empresa Beta",
    status: "Perdido",
    origin: "manual",
    created_at: "2026-06-11T10:00:00.000Z",
    ownerId: "operator-2",
    score: 55
  },
  {
    id: "company-3",
    name: "Negocio Antigo",
    stage: "Novo Lead",
    source: "google_places",
    createdAt: "2025-01-01T10:00:00.000Z",
    ownerId: "operator-1",
    score: 20
  }
];

describe("reports filters and exports", () => {
  it("forces operator scope when authenticated role is operator", () => {
    const filters = normalizeReportFilters({ operatorId: "operator-2", role: "operator", userId: "operator-1" });

    assert.equal(filters.operatorId, "operator-1");
    assert.equal(filters.role, "operator");
  });

  it("filters companies by period, operator, source, status and company", () => {
    const result = filterCompaniesForReport(
      baseCompanies as any,
      {
        period: "30d",
        operatorId: "operator-1",
        source: "google_places",
        status: "Ganho",
        companyId: "company-1"
      },
      { now: new Date("2026-06-22T12:00:00.000Z") }
    );

    assert.equal(result.length, 1);
    assert.equal(result[0]?.id, "company-1");
  });

  it("escapes CSV values that can trigger spreadsheet formulas", () => {
    assert.equal(escapeCsvCell("=IMPORTXML('x')"), "\"'=IMPORTXML('x')\"");
    assert.equal(escapeCsvCell("normal"), "\"normal\"");
  });

  it("builds a report CSV with metrics and dimensions", () => {
    const csv = buildReportCsv({
      filters: { period: "30d", groupBy: "day" },
      generated_at: "2026-06-22T12:00:00.000Z",
      metrics: {
        leads_created: 3,
        leads_converted: 1,
        conversion_rate: 33,
        open_opportunities: 2,
        deals_won: 1,
        deals_lost: 0,
        activities_done: 4,
        total_companies: 3,
        avg_score: 70,
        pipeline_value: 5000
      },
      funnel: [{ name: "Novo Lead", count: 3, pct_of_total: 100, conversion_from_previous: 100 }],
      timeline: [{ date: "2026-06-22", count: 3 }],
      origins: [{ source: "google_places", count: 3 }],
      statuses: [{ status: "Novo Lead", count: 3 }],
      segments: [{ segment: "Clinica", count: 3, avg_score: 70 }],
      cities: [{ city: "Goiania", state: "GO", count: 3 }],
      operators: [{ user_id: "operator-1", name: "Operador", leads_created: 3, followups_done: 4, leads_closed: 1, conversion_rate: 33 }],
      options: { companies: [], operators: [], statuses: [], origins: [] },
      warnings: []
    });

    assert.match(csv, /"indicador","leads_criados","3",""/);
    assert.match(csv, /"origem","google_places","3",""/);
    assert.match(csv, /"operador","Operador","3","4"/);
  });
});
