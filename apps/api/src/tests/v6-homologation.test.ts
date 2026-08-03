import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { canAccessModule, normalizeAdminSession } from "../services/adminSession.js";
import { parseAttachmentRef, sanitizeCommunicationHtml } from "../routes/communicationCenter.js";

const root = join(import.meta.dirname, "../../../..");
const source = (path: string) => readFileSync(join(root, path), "utf8");

test("owner e admin mantêm acesso integral aos módulos", () => {
  assert.equal(canAccessModule({ role: "owner" }, "admin", "write"), true);
  assert.equal(canAccessModule({ role: "admin" }, "integracoes", "write"), true);
});

test("operador, viewer e perfil restrito obedecem acesso efetivo", () => {
  assert.equal(canAccessModule({ role: "operator", visibilityLevel: "read_edit" }, "crm", "write"), true);
  assert.equal(canAccessModule({ role: "viewer", visibilityLevel: "read" }, "crm", "read"), true);
  assert.equal(canAccessModule({ role: "viewer", visibilityLevel: "read" }, "crm", "write"), false);
  assert.equal(canAccessModule({ role: "viewer", modulePermissions: { crm: "full" } }, "crm", "write"), false);
  assert.equal(canAccessModule({ role: "operator", modulePermissions: { crm: false } }, "crm", "read"), false);
  assert.equal(canAccessModule({ role: "operator", modulePermissions: { agenda: "read" } }, "agenda", "write"), false);
  assert.equal(canAccessModule({ role: "operator", status: "restricted" }, "dashboard", "read"), false);
});

test("sessão normalizada preserva permissões sem enfraquecer owner embutido", () => {
  const session = normalizeAdminSession({
    email: "sdr@homolog.nodere.test",
    role: "operator",
    workspaceId: "homolog-v6",
    status: "active",
    visibilityLevel: "read_edit",
    modulePermissions: { crm: "write", admin: false },
    exp: Date.now() + 10_000
  });
  assert.deepEqual(session.modulePermissions, { crm: "write", admin: false });
  assert.equal(session.visibilityLevel, "read_edit");
  assert.equal(session.status, "active");
});

test("referências de anexos aceitam somente fontes internas conhecidas", () => {
  assert.deepEqual(parseAttachmentRef("briefing:12345678-abcd"), { source: "briefing", id: "12345678-abcd" });
  assert.deepEqual(parseAttachmentRef("company-file:12345678-abcd"), { source: "company-file", id: "12345678-abcd" });
  assert.equal(parseAttachmentRef("https://example.com/file.pdf"), null);
  assert.equal(parseAttachmentRef("../../secret"), null);
});

test("HTML de comunicação continua sanitizado", () => {
  const html = sanitizeCommunicationHtml('<p>Seguro</p><script>alert(1)</script><a href="javascript:alert(2)">link</a>');
  assert.match(html, /Seguro/);
  assert.doesNotMatch(html, /script|javascript:/i);
});

test("envio SMTP resolve e entrega anexos, falhando de forma fechada", () => {
  const api = source("apps/api/src/routes/communicationCenter.ts");
  assert.match(api, /resolveEmailAttachments\(workspaceId/);
  assert.match(api, /attachments\s*\n?\s*\}/);
  assert.match(api, /\.eq\("workspace_id", workspaceId\)\.in\("id", briefingIds\)/);
  assert.match(api, /path\.startsWith\(`\$\{workspaceId\}\/`\)/);
  assert.match(api, /MAX_ATTACHMENT_BYTES/);
  assert.match(api, /Um ou mais anexos não existem neste workspace/);
});

test("login faz fallback seguro para contas da plataforma", () => {
  const login = source("apps/web/app/login/LoginClient.tsx");
  assert.match(login, /supabaseFailure/);
  assert.match(login, /\/admin\/login/);
  assert.match(login, /persistSession\(payload, email\)/);
});

test("menus e API aplicam as mesmas permissões por módulo", () => {
  assert.match(source("apps/web/components/Sidebar.tsx"), /canUseModule\(user, item\.module\)/);
  assert.match(source("apps/web/components/MobileNav.tsx"), /canUseModule\(user, item\.module\)/);
  const server = source("apps/api/src/server.ts");
  assert.match(server, /requireModuleAccess\("crm"\)/);
  assert.match(server, /requireModuleAccess\("buscas"\)/);
  assert.match(server, /requireModuleAccess\("agenda"\)/);
  assert.match(server, /requireModuleAccess\("relatorios"\)/);
});

test("migração V6 é idempotente e possui rollback explícito", () => {
  const migration = source("apps/api/src/db/migrations/20260802_nodere_v6_homologation.sql");
  const rollback = source("apps/api/src/db/migrations/20260802_nodere_v6_homologation.rollback.sql");
  assert.match(migration, /add column if not exists module_permissions jsonb/);
  assert.match(migration, /force row level security/);
  assert.match(migration, /revoke all .* anon, authenticated/);
  assert.match(migration, /revoke execute on function public\.nodere_ai_reserve_credits[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.nodere_ai_reserve_credits[\s\S]*to service_role/);
  assert.match(migration, /alter function public\.nodere_touch_commercial_updated_at\(\) set search_path = ''/);
  assert.match(rollback, /drop column if exists module_permissions/);
});

test("alinhamento V6 completa o schema canônico de empresas sem reclassificar dados", () => {
  const migration = source("apps/api/src/db/migrations/20260803_nodere_v6_company_schema_alignment.sql");
  for (const column of ["temperature", "probability", "deal_value", "expected_close_date", "next_action", "owner_id", "source"]) {
    assert.match(migration, new RegExp(`add column if not exists ${column}`));
  }
  assert.doesNotMatch(migration, /update\s+public\.nodere_companies\s+set\s+source/i);
});

test("próxima ação do briefing possui mapeamento canônico para a ficha CRM", () => {
  const fields = source("apps/api/src/services/briefingFields.ts");
  assert.match(fields, /key:\s*"next_action"[^\n]*companyColumn:\s*"next_action"/);
});

test("atualização parcial não substitui sinais internos por updatedAt", () => {
  const store = source("apps/api/src/services/companyStore.ts");
  assert.match(store, /\["notes",\s*"updatedAt",\s*"workspaceId"\]\.includes\(key\)/);
});
