import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { canMutateCalendarEvent, eventCreateSchema, validateEventRange } from "../routes/calendar.js";

const baseEvent = {
  title: "Reunião de diagnóstico",
  type: "reuniao" as const,
  priority: "media" as const,
  startAt: "2026-06-22T13:00:00.000Z",
  endAt: "2026-06-22T14:00:00.000Z",
  status: "pendente" as const
};

test("aceita intervalo válido e rejeita término anterior ao início", () => {
  assert.doesNotThrow(() => validateEventRange(baseEvent.startAt, baseEvent.endAt));
  assert.throws(
    () => validateEventRange(baseEvent.endAt, baseEvent.startAt),
    (error: unknown) => (error as { status?: number; code?: string }).status === 400
      && (error as { code?: string }).code === "CALENDAR_INVALID_RANGE"
  );
});

test("schema rejeita data inválida e relação divergente entre lead e empresa", () => {
  assert.equal(eventCreateSchema.safeParse({ ...baseEvent, startAt: "data-inválida" }).success, false);
  assert.equal(eventCreateSchema.safeParse({ ...baseEvent, companyId: "empresa-a", leadId: "empresa-b" }).success, false);
});

test("owner e admin alteram qualquer evento", () => {
  const event = { assigned_to: "operator-a", created_by: "operator-a" };
  assert.equal(canMutateCalendarEvent("owner", "owner-a", event), true);
  assert.equal(canMutateCalendarEvent("admin", "admin-a", event), true);
});

test("operator altera somente evento criado por ele ou atribuído a ele", () => {
  assert.equal(canMutateCalendarEvent("operator", "operator-a", { assigned_to: "operator-a" }), true);
  assert.equal(canMutateCalendarEvent("operator", "operator-a", { created_by: "operator-a" }), true);
  assert.equal(canMutateCalendarEvent("operator", "operator-a", { assigned_to: "operator-b", created_by: "operator-b" }), false);
  assert.equal(canMutateCalendarEvent("viewer", "viewer-a", { assigned_to: "viewer-a" }), false);
});

test("rota usa sobreposição de período e valida entidades oficiais do workspace", () => {
  const source = readFileSync(join(process.cwd(), "src", "routes", "calendar.ts"), "utf8");
  assert.match(source, /gte\("end_at", filters\.start\)/);
  assert.match(source, /lte\("start_at", filters\.end\)/);
  assert.match(source, /from\("nodere_companies"\)/);
  assert.match(source, /from\("nodere_platform_users"\)/);
  assert.match(source, /from\("company_contacts"\)/);
});
