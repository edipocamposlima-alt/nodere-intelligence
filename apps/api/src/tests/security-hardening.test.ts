import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { isValidMetaSignature } from "../middleware/metaWebhook.js";
import { assertPublicHttpUrl, UnsafePublicUrlError } from "../utils/publicHttp.js";

const privateTargets = [
  "http://localhost/admin",
  "http://127.0.0.1/",
  "http://10.0.0.4/",
  "http://172.16.0.1/",
  "http://192.168.1.1/",
  "http://169.254.169.254/latest/meta-data/",
  "http://[::1]/"
];

for (const target of privateTargets) {
  test(`scanner recusa destino interno ${target}`, async () => {
    await assert.rejects(
      () => assertPublicHttpUrl(target),
      (error: unknown) => error instanceof UnsafePublicUrlError && error.code === "UNSAFE_PUBLIC_URL"
    );
  });
}

test("scanner recusa protocolos, credenciais e portas fora da allowlist", async () => {
  for (const target of ["file:///etc/passwd", "https://user:secret@example.com/", "https://example.com:8443/"]) {
    await assert.rejects(() => assertPublicHttpUrl(target), UnsafePublicUrlError);
  }
});

test("assinatura Meta usa HMAC SHA-256 do corpo bruto", () => {
  const body = Buffer.from('{"entry":[{"id":"safe"}]}');
  const secret = "meta-test-secret";
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  assert.equal(isValidMetaSignature(body, signature, secret), true);
  assert.equal(isValidMetaSignature(Buffer.from("alterado"), signature, secret), false);
  assert.equal(isValidMetaSignature(body, "sha256=invalida", secret), false);
  assert.equal(isValidMetaSignature(body, signature, undefined), false);
});

test("fontes de produção não mantêm curingas e segredos inseguros", () => {
  const root = process.cwd();
  const server = readFileSync(join(root, "src", "server.ts"), "utf8");
  const config = readFileSync(join(root, "src", "config.ts"), "utf8");
  const webhooks = readFileSync(join(root, "src", "routes", "webhooks.ts"), "utf8");
  const inbox = readFileSync(join(root, "src", "routes", "inbox.ts"), "utf8");

  assert.doesNotMatch(server, /endsWith\(["']\.vercel\.app["']\)/);
  assert.match(server, /denied\.status = 403/);
  assert.match(server, /CORS_ORIGIN_DENIED/);
  assert.doesNotMatch(config, /nodere-webhook-secret/);
  assert.match(config, /isProduction \? "" : "nodere-local-admin-secret"/);
  assert.match(webhooks, /router\.post\("\/whatsapp", requireMetaWebhookSignature/);
  assert.match(inbox, /router\.post\("\/webhook", requireMetaWebhookSignature/);
});

test("status de integração distingue configuração de conexão comprovada", () => {
  const source = readFileSync(join(process.cwd(), "src", "services", "integrationStatus.ts"), "utf8");
  assert.match(source, /configured \? "configured" : "not_configured"/);
  assert.doesNotMatch(source, /configured \? "ok" : "not_configured"/);
});

test("convites não retornam senha temporária conhecida", () => {
  const admin = readFileSync(join(process.cwd(), "src", "routes", "admin.ts"), "utf8");
  const operators = readFileSync(join(process.cwd(), "src", "routes", "operators.ts"), "utf8");
  assert.doesNotMatch(admin, /temporaryPassword|generateTemporaryPassword/);
  assert.doesNotMatch(operators, /temporaryPassword|generatedPassword/);
  assert.match(admin, /inviteWorkspaceUser/);
  assert.match(operators, /inviteWorkspaceUser/);
});

test("hardening preparado remove metadado mutável e policies sobrepostas", () => {
  const hardening = readFileSync(join(process.cwd(), "..", "..", "packages", "database", "audit_final_security_hardening.sql"), "utf8");
  const rollback = readFileSync(join(process.cwd(), "..", "..", "packages", "database", "audit_final_security_hardening_rollback.sql"), "utf8");
  assert.doesNotMatch(hardening, /auth\.jwt\(\)[\s\S]{0,200}user_metadata/);
  assert.match(hardening, /drop policy if exists nodere_discovery_runs_service_role_all/);
  assert.match(hardening, /for insert to authenticated/);
  assert.match(hardening, /for update to authenticated/);
  assert.match(hardening, /for delete to authenticated/);
  assert.match(rollback, /user_metadata/);
  assert.match(rollback, /create policy nodere_discovery_runs_service_role_all/);
});
