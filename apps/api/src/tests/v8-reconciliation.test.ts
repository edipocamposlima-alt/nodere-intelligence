import assert from "node:assert/strict";
import test from "node:test";
import { mapPersistedCompanyRow } from "../services/companyStore.js";

test("a persisted legacy company is always visible as a CRM lead", () => {
  const company = mapPersistedCompanyRow({
    id: "legacy-company-1",
    name: "Empresa real preservada",
    status: "Novo Lead",
    score: 42,
    record_state: "active",
    is_deleted: false,
    digital_signals: {
      crmSaved: false,
      isCrmLead: false
    },
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  });

  const persistence = company as unknown as Record<string, unknown>;
  assert.equal(persistence.crmSaved, true);
  assert.equal(persistence.isCrmLead, true);
  assert.equal(company.id, "legacy-company-1");
  assert.equal(company.name, "Empresa real preservada");
});
