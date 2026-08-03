import process from "node:process";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiRequire = createRequire(path.join(root, "apps", "api", "package.json"));
const { Client } = apiRequire("pg");

loadEnvFiles([
  ".env",
  ".env.local",
  ".env.production",
  "apps/api/.env",
  "apps/api/.env.local",
  "apps/api/.env.production",
  "apps/web/.env.local",
  "apps/web/.env.production"
]);

const WORKSPACE_ID = "TESTE_V6_HOMOLOGACAO_NODERE";
const CANARY_WORKSPACE_ID = "TESTE_V6_HOMOLOGACAO_CANARY";
const TEST_DOMAIN = "example.com";
const STATE_DIR = path.join(root, ".codex_tmp");
const STATE_FILE = path.join(STATE_DIR, "nodere-v6-homologation-state.json");
const EVIDENCE_FILE = path.join(STATE_DIR, "nodere-v6-homologation-evidence.json");
const API_BASE_URL = (process.env.V6_API_BASE_URL || "https://nodere-api.onrender.com").replace(/\/+$/, "");
const WEB_BASE_URL = (process.env.V6_WEB_BASE_URL || "https://web-gekxr8nqd-edipo-lima-s-projects.vercel.app").replace(/\/+$/, "");
const SUPABASE_URL = (process.env.V6_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = process.env.V6_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.V6_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DATABASE_URL = normalizeDatabaseUrl(process.env.V6_DATABASE_URL || process.env.COMMERCIAL_DATABASE_URL || process.env.DATABASE_URL || "");
const CLEANUP_ONLY = process.argv.includes("--cleanup");
const RETAIN = process.argv.includes("--retain");
const HTTP_ONLY = process.argv.includes("--http-only");

const profiles = [
  { key: "owner", label: "TESTE_V6_OWNER", email: `teste.v6.owner@${TEST_DOMAIN}`, role: "owner", status: "active", visibility: "full", customRole: null, permissions: {} },
  { key: "admin", label: "TESTE_V6_ADMIN", email: `teste.v6.admin@${TEST_DOMAIN}`, role: "admin", status: "active", visibility: "full", customRole: null, permissions: {} },
  { key: "manager", label: "TESTE_V6_MANAGER", email: `teste.v6.manager@${TEST_DOMAIN}`, role: "operator", status: "active", visibility: "read_edit", customRole: "Gerente Comercial", permissions: { dashboard: "full", buscas: "full", crm: "full", agenda: "full", relatorios: "full", integracoes: "read", admin: "none" } },
  { key: "sdr", label: "TESTE_V6_SDR", email: `teste.v6.sdr@${TEST_DOMAIN}`, role: "operator", status: "active", visibility: "read_edit", customRole: "SDR", permissions: { dashboard: "read", buscas: "full", crm: "full", agenda: "full", relatorios: "read", integracoes: "none", admin: "none" } },
  { key: "sales", label: "TESTE_V6_SALES", email: `teste.v6.sales@${TEST_DOMAIN}`, role: "operator", status: "active", visibility: "read_edit", customRole: "Vendas", permissions: { dashboard: "read", buscas: "read", crm: "full", agenda: "full", relatorios: "read", integracoes: "none", admin: "none" } },
  { key: "viewer", label: "TESTE_V6_VIEWER", email: `teste.v6.viewer@${TEST_DOMAIN}`, role: "viewer", status: "active", visibility: "read", customRole: "Visualizador", permissions: { dashboard: "read", buscas: "read", crm: "read", agenda: "read", relatorios: "read", integracoes: "none", admin: "none" } },
  { key: "restricted", label: "TESTE_V6_RESTRICTED", email: `teste.v6.restricted@${TEST_DOMAIN}`, role: "operator", status: "restricted", visibility: "read", customRole: "Restrito", permissions: { dashboard: "none", buscas: "none", crm: "none", agenda: "none", relatorios: "none", integracoes: "none", admin: "none" } }
];

const client = DATABASE_URL ? new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;
const checks = [];
const created = { authUserIds: [], profileIds: [], roleIds: [], companyIds: [], briefingIds: [], proposalIds: [], calendarIds: [], attachmentIds: [], outboxIds: [] };
let runId = `V6_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}_${randomUUID().slice(0, 8)}`;
let password = securePassword();
let cleaned = false;

function loadEnvFiles(files) {
  for (const relative of files) {
    const full = path.join(root, relative);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  }
}

function normalizeDatabaseUrl(raw) {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return raw;
  }
}

function securePassword() {
  return `NdV6!${randomBytes(18).toString("base64url")}aA7`;
}

function hashPassword(raw) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(raw, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function safeHost(raw) {
  try { return new URL(raw).hostname; } catch { return ""; }
}

function record(name, ok, detail = "") {
  const row = { name, ok: Boolean(ok), detail: String(detail || "").slice(0, 500), at: new Date().toISOString() };
  checks.push(row);
  console.log(`${row.ok ? "OK" : "FAIL"} ${name}${row.detail ? ` - ${row.detail}` : ""}`);
  return row.ok;
}

function requireConfig() {
  const missing = [
    !HTTP_ONLY && !DATABASE_URL && "DATABASE_URL",
    !SUPABASE_URL && "SUPABASE_URL",
    !SUPABASE_ANON_KEY && "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ].filter(Boolean);
  if (missing.length) throw new Error(`Configuração ausente: ${missing.join(", ")}`);
  if (!HTTP_ONLY) {
    const host = safeHost(DATABASE_URL);
    if (["localhost", "127.0.0.1", "::1"].includes(host)) throw new Error("V6_DATABASE_URL aponta para banco local; a homologação exige o banco remoto controlado.");
  }
}

async function api(pathname, token = "", options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) headers.authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData) && !headers["content-type"]) headers["content-type"] = "application/json";
  const response = await fetch(`${API_BASE_URL}${pathname}`, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : Buffer.from(await response.arrayBuffer());
  return { response, body, contentType };
}

function jsonBody(value) {
  return JSON.stringify(value);
}

async function expectApi(name, pathname, token, options, expectedStatuses = [200]) {
  const result = await api(pathname, token, options);
  const ok = expectedStatuses.includes(result.response.status);
  record(name, ok, `HTTP ${result.response.status}`);
  if (!ok) {
    const message = Buffer.isBuffer(result.body) ? result.body.toString("utf8").slice(0, 500) : JSON.stringify(result.body).slice(0, 500);
    throw new Error(`${name}: HTTP ${result.response.status} ${message}`);
  }
  return result;
}

async function authAdmin(pathname, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1${pathname}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function supabaseRpc(name, params) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return databaseLedgerRpc(name, params);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(params)
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`RPC ${name} HTTP ${response.status}: ${JSON.stringify(body).slice(0, 400)}`);
  return body;
}

async function databaseLedgerRpc(name, params) {
  const definitions = {
    nodere_ai_reserve_credits: {
      sql: "select * from public.nodere_ai_reserve_credits($1, $2::uuid, $3, $4::numeric)",
      values: [params.p_workspace_id, params.p_execution_id, params.p_idempotency_key, params.p_amount]
    },
    nodere_ai_release_credits: {
      sql: "select * from public.nodere_ai_release_credits($1, $2::uuid, $3, $4::jsonb)",
      values: [params.p_workspace_id, params.p_execution_id, params.p_idempotency_key, JSON.stringify(params.p_metadata || {})]
    }
  };
  const definition = definitions[name];
  if (!definition) throw new Error(`RPC sem fallback controlado: ${name}`);
  await client.query("begin");
  try {
    await client.query("set local role service_role");
    const result = await client.query(definition.sql, definition.values);
    await client.query("commit");
    return result.rows;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  }
}

async function removeAuthUser(id) {
  if (!id) return;
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    await client.query("delete from auth.sessions where user_id = $1::uuid", [id]);
    await client.query("delete from auth.identities where user_id = $1::uuid", [id]);
    await client.query("delete from auth.users where id = $1::uuid", [id]);
    return;
  }
  const result = await authAdmin(`/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!result.response.ok && result.response.status !== 404) {
    throw new Error(`Falha ao remover usuário Auth ${String(id).slice(0, 8)}: HTTP ${result.response.status}`);
  }
}

async function createAuthUser(profile) {
  if (SUPABASE_SERVICE_ROLE_KEY) {
    const auth = await authAdmin("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: profile.email,
        password,
        email_confirm: true,
        user_metadata: { name: profile.label, homologation: "NODERE_V6" },
        app_metadata: { homologation: "NODERE_V6" }
      })
    });
    if (!auth.response.ok || !auth.body?.id) throw new Error(`Supabase Auth não criou ${profile.key}: HTTP ${auth.response.status}`);
    return auth.body.id;
  }

  const authUserId = randomUUID();
  await client.query(
    `insert into auth.users
      (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
     values
      ('00000000-0000-0000-0000-000000000000'::uuid, $1::uuid, 'authenticated', 'authenticated', $2,
       crypt($3, gen_salt('bf')), now(),
       jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'homologation','NODERE_V6'),
       jsonb_build_object('name',$4::text,'homologation','NODERE_V6'),
       now(), now(), false, false)`,
    [authUserId, profile.email, password, profile.label]
  );
  await client.query(
    `insert into auth.identities
      (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
     values
      ($1::text, $1::uuid,
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'phone_verified',false),
       'email', now(), now(), now())`,
    [authUserId, profile.email]
  );
  return authUserId;
}

async function exactCleanup({ preserveEvidence = true } = {}) {
  if (!client) throw new Error("Conexão de banco indisponível para limpeza.");
  const emails = profiles.map((profile) => profile.email);
  const authRows = await client.query(
    `select distinct auth_user_id::text as id
       from public.nodere_platform_users
      where workspace_id in ($1, $2) or lower(email) = any($3::text[])`,
    [WORKSPACE_ID, CANARY_WORKSPACE_ID, emails]
  );
  for (const row of authRows.rows) await removeAuthUser(row.id);
  await client.query("delete from public.nodere_platform_users where workspace_id in ($1, $2) or lower(email) = any($3::text[])", [WORKSPACE_ID, CANARY_WORKSPACE_ID, emails]);
  await client.query("delete from public.nodere_workspaces where id in ($1, $2)", [WORKSPACE_ID, CANARY_WORKSPACE_ID]);
  const remaining = await client.query(
    `select
       (select count(*)::int from public.nodere_workspaces where id in ($1, $2)) as workspaces,
       (select count(*)::int from public.nodere_platform_users where workspace_id in ($1, $2) or lower(email) = any($3::text[])) as profiles,
       (select count(*)::int from auth.users where lower(email) = any($3::text[]) and deleted_at is null) as auth_users`,
    [WORKSPACE_ID, CANARY_WORKSPACE_ID, emails]
  );
  const row = remaining.rows[0];
  cleaned = row.workspaces === 0 && row.profiles === 0 && row.auth_users === 0;
  record("limpeza exata dos dados de homologação", cleaned, `workspaces=${row.workspaces}, perfis=${row.profiles}, auth=${row.auth_users}`);
  if (cleaned && fs.existsSync(STATE_FILE)) fs.rmSync(STATE_FILE);
  if (!preserveEvidence && fs.existsSync(EVIDENCE_FILE)) fs.rmSync(EVIDENCE_FILE);
  return row;
}

async function createWorkspaceRows() {
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  await client.query(
    `insert into public.nodere_workspaces (id, name, owner_email, plan, credits, credits_used, expires_at, created_at, updated_at)
     values ($1, $2, $3, 'trial', 20, 0, $4, now(), now()),
            ($5, $6, $7, 'trial', 0, 0, $4, now(), now())`,
    [WORKSPACE_ID, "TESTE V6 HOMOLOGAÇÃO NODERE", profiles[0].email, expiresAt, CANARY_WORKSPACE_ID, "TESTE V6 CANARY", `teste.v6.canary@${TEST_DOMAIN}`]
  );
  record("workspace isolado criado", true, WORKSPACE_ID);
}

async function createRoles() {
  const roleByName = new Map();
  for (const profile of profiles.filter((item) => item.customRole)) {
    if (roleByName.has(profile.customRole)) continue;
    const id = randomUUID();
    await client.query(
      `insert into public.custom_roles (id, workspace_id, name, description, permissions, color, created_at, updated_at)
       values ($1, $2, $3, $4, $5::jsonb, $6, now(), now())`,
      [id, WORKSPACE_ID, profile.customRole, `Cargo temporário da homologação ${runId}`, JSON.stringify(profile.permissions), profile.key === "restricted" ? "#B91C1C" : "#0B4D3B"]
    );
    roleByName.set(profile.customRole, id);
    created.roleIds.push(id);
  }
  record("cargos customizados criados", roleByName.size === 5, `${roleByName.size}/5`);
  return roleByName;
}

async function createUsers(roleByName) {
  const users = {};
  for (const profile of profiles) {
    const authUserId = await createAuthUser(profile);
    const id = randomUUID();
    const customRoleId = profile.customRole ? roleByName.get(profile.customRole) : null;
    await client.query(
      `insert into public.nodere_platform_users
        (id, workspace_id, name, email, role, active, password_hash, auth_user_id,
         custom_role_id, status, visibility_level, module_permissions, created_at, updated_at)
       values ($1, $2, $3, $4, $5, true, $6, $7::uuid, $8, $9, $10, $11::jsonb, now(), now())`,
      [id, WORKSPACE_ID, profile.label, profile.email, profile.role, hashPassword(password), authUserId, customRoleId, profile.status, profile.visibility, JSON.stringify(profile.permissions)]
    );
    created.authUserIds.push(authUserId);
    created.profileIds.push(id);
    users[profile.key] = { ...profile, id, authUserId, customRoleId };
  }
  record("sete contas de homologação criadas", Object.keys(users).length === 7, "7/7");
  return users;
}

async function supabasePasswordLogin(user) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ email: user.email, password })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) throw new Error(`Login Supabase ${user.key} falhou: HTTP ${response.status}`);
  const exchanged = await api("/api/admin/supabase-session", "", { method: "POST", body: JSON.stringify({ accessToken: body.access_token }) });
  if (!exchanged.response.ok || !exchanged.body?.token) throw new Error(`Troca de sessão ${user.key} falhou: HTTP ${exchanged.response.status}`);
  return { token: exchanged.body.token, profile: exchanged.body.user, supabaseToken: body.access_token };
}

async function authenticateProfiles(users) {
  const sessions = {};
  for (const profile of profiles) {
    const user = users[profile.key];
    const primary = await supabasePasswordLogin(user);
    if (HTTP_ONLY) {
      record(`autenticação Supabase real: ${profile.key}`, Boolean(primary.token), "Supabase Auth + troca de sessão");
    } else {
      const fallback = await api("/api/admin/login", "", { method: "POST", body: JSON.stringify({ email: user.email, password }) });
      record(`autenticação Supabase + fallback: ${profile.key}`, fallback.response.ok && Boolean(fallback.body?.token), `Supabase 200, fallback ${fallback.response.status}`);
    }
    const refresh = await api("/api/admin/session/refresh", primary.token, { method: "POST", body: "{}" });
    record(`renovação de sessão: ${profile.key}`, refresh.response.ok && Boolean(refresh.body?.token), `HTTP ${refresh.response.status}`);
    const customRoleOk = profile.customRole
      ? Boolean(primary.profile?.customRoleId) && (!user.customRoleId || primary.profile.customRoleId === user.customRoleId)
      : !primary.profile?.customRoleId;
    const profileOk = primary.profile?.email === profile.email
      && primary.profile?.role === profile.role
      && primary.profile?.workspaceId === WORKSPACE_ID
      && primary.profile?.status === profile.status
      && customRoleOk;
    record(`perfil propagado na sessão: ${profile.key}`, profileOk, `${primary.profile?.role || "?"}/${primary.profile?.status || "?"}`);
    sessions[profile.key] = { ...primary, user };
  }
  const invalid = await api("/api/companies", "token-invalido");
  record("token inválido rejeitado", invalid.response.status === 401, `HTTP ${invalid.response.status}`);
  return sessions;
}

async function validatePermissionMatrix(sessions) {
  const matrix = [
    ["owner", "/api/dashboard", 200], ["owner", "/api/integrations/status", 200], ["owner", "/api/admin/status", 200],
    ["admin", "/api/dashboard", 200], ["admin", "/api/integrations/status", 200], ["admin", "/api/admin/status", 200],
    ["manager", "/api/dashboard", 200], ["manager", "/api/integrations/status", 200], ["manager", "/api/admin/status", 403],
    ["sdr", "/api/searches", 200], ["sdr", "/api/companies", 200], ["sdr", "/api/integrations/status", 403], ["sdr", "/api/admin/status", 403],
    ["sales", "/api/companies", 200], ["sales", "/api/calendar", 200], ["sales", "/api/integrations/status", 403],
    ["viewer", "/api/dashboard", 200], ["viewer", "/api/companies", 200], ["viewer", "/api/reports/summary", 200], ["viewer", "/api/integrations/status", 403],
    ["restricted", "/api/dashboard", 403], ["restricted", "/api/companies", 403], ["restricted", "/api/calendar", 403]
  ];
  for (const [key, pathname, expected] of matrix) {
    const result = await api(pathname, sessions[key].token);
    record(`matriz ${key} ${pathname}`, result.response.status === expected, `HTTP ${result.response.status}, esperado ${expected}`);
  }
  const escalation = await api("/api/admin/users", sessions.sales.token);
  record("elevação de privilégio bloqueada", escalation.response.status === 403, `HTTP ${escalation.response.status}`);
  const viewerWrite = await api("/api/companies", sessions.viewer.token, {
    method: "POST",
    body: jsonBody({ name: `${runId} VIEWER NÃO DEVE CRIAR` })
  });
  record("viewer bloqueado em escrita direta", viewerWrite.response.status === 403, `HTTP ${viewerWrite.response.status}`);
}

async function createCanaryCompany() {
  const id = `${runId}_CANARY_COMPANY`;
  await client.query(
    `insert into public.nodere_companies
      (id, workspace_id, name, category, city, state, status, score, opportunity_level, digital_signals, created_at, updated_at)
     values ($1, $2, $3, 'Canary', 'Brasília', 'DF', 'Novo Lead', 1, 'Baixa', '{}'::jsonb, now(), now())`,
    [id, CANARY_WORKSPACE_ID, `${runId} CANARY NÃO VISÍVEL`]
  );
  return id;
}

async function validateCrmAndIsolation(sessions, preparedCanaryId = "") {
  const canaryId = preparedCanaryId || await createCanaryCompany();
  const createdCompany = await expectApi("CRM cria lead no workspace isolado", "/api/companies", sessions.sales.token, {
    method: "POST",
    body: jsonBody({
      name: `${runId} Empresa Homologação`,
      legalName: `${runId} Empresa Homologação LTDA`,
      category: "Consultoria",
      city: "São Paulo",
      state: "SP",
      email: `contato.${runId.toLowerCase()}@example.com`,
      phone: "11999990000",
      status: "Novo Lead",
      notes: "Lead temporário da homologação V6"
    })
  }, [201]);
  const companyId = createdCompany.body.id;
  created.companyIds.push(companyId);
  const list = await expectApi("CRM lista leads", "/api/companies", sessions.owner.token, {}, [200]);
  const listText = JSON.stringify(list.body);
  record("isolamento impede vazamento do canário", listText.includes(companyId) && !listText.includes(canaryId), "canário ausente");
  const directCanary = await api(`/api/companies/${encodeURIComponent(canaryId)}`, sessions.owner.token);
  record("acesso direto cross-workspace rejeitado", directCanary.response.status === 404, `HTTP ${directCanary.response.status}`);
  const detail = await expectApi("ficha 360 carrega lead", `/api/companies/${encodeURIComponent(companyId)}`, sessions.owner.token, {}, [200]);
  record("ficha 360 consistente", detail.body?.id === companyId && detail.body?.name?.includes(runId), detail.body?.name || "sem nome");
  for (const suffix of ["contacts", "tasks", "communications", "contracts", "documents"]) {
    await expectApi(`ficha 360: ${suffix}`, `/api/companies/${encodeURIComponent(companyId)}/${suffix}`, sessions.owner.token, {}, [200]);
  }
  const viewerDelete = await api(`/api/companies/${encodeURIComponent(companyId)}`, sessions.viewer.token, { method: "DELETE", body: jsonBody({ reason: "Tentativa sem permissão" }) });
  record("viewer não exclui lead", viewerDelete.response.status === 403, `HTTP ${viewerDelete.response.status}`);
  const trash = await expectApi("exclusão segura move lead para lixeira", `/api/companies/${encodeURIComponent(companyId)}`, sessions.manager.token, {
    method: "DELETE",
    body: jsonBody({ reason: "Homologação da retenção segura V6" })
  }, [200]);
  record("retenção de 30 dias registrada", trash.body?.company?.recordState === "trash" && Boolean(trash.body?.company?.purgeAfter), trash.body?.company?.purgeAfter || "sem prazo");
  await expectApi("restauração de lead funciona", `/api/companies/${encodeURIComponent(companyId)}/restore`, sessions.manager.token, {
    method: "POST",
    body: jsonBody({ reason: "Restauração após homologação segura" })
  }, [200]);
  return companyId;
}

async function validateBriefing(sessions, companyId) {
  const fields = await expectApi("catálogo do briefing disponível", "/api/briefings/fields", sessions.sales.token, {}, [200]);
  record("briefing possui 47 campos catalogados", Number(fields.body?.count) === 47, `campos=${fields.body?.count}`);
  const nextAction = `Enviar diagnóstico ${runId}`;
  const createdBriefing = await expectApi("briefing comercial criado", "/api/briefings", sessions.sales.token, {
    method: "POST",
    body: jsonBody({
      companyId,
      title: `${runId} Briefing Comercial`,
      priority: "high",
      answers: {
        company_name: `${runId} Empresa Homologação`,
        segment: "Consultoria",
        city: "São Paulo",
        state: "SP",
        decision_maker_name: "Responsável V6",
        next_action: nextAction
      }
    })
  }, [201]);
  const briefingId = createdBriefing.body.id;
  created.briefingIds.push(briefingId);
  const apply = await api(`/api/briefings/${encodeURIComponent(briefingId)}/apply-mappings`, sessions.sales.token, {
    method: "POST",
    body: jsonBody({ decisions: [] })
  });
  record("dados do briefing aplicados ao CRM", apply.response.ok && apply.body?.conflicts?.length === 0, `HTTP ${apply.response.status}`);
  const companyAfter = await api(`/api/companies/${encodeURIComponent(companyId)}`, sessions.owner.token);
  record("próxima ação do briefing integrada", companyAfter.response.ok && JSON.stringify(companyAfter.body).includes(nextAction), "mapeamento canônico");
  const pdf = await expectApi("PDF do briefing gerado", `/api/briefings/${encodeURIComponent(briefingId)}/pdf`, sessions.viewer.token, {}, [200]);
  record("PDF do briefing válido", Buffer.isBuffer(pdf.body) && pdf.body.subarray(0, 4).toString() === "%PDF", `${pdf.body.length} bytes`);
  return briefingId;
}

async function uploadBriefingAttachment(sessions, briefingId) {
  const marker = `NODERE V6 ATTACHMENT ${runId}`;
  const form = new FormData();
  form.set("file", new Blob([marker], { type: "text/plain" }), `${runId}-evidencia.txt`);
  const uploaded = await api(`/api/briefings/${encodeURIComponent(briefingId)}/attachments`, sessions.sales.token, { method: "POST", body: form });
  record("anexo do briefing enviado", uploaded.response.status === 201 && Boolean(uploaded.body?.id), `HTTP ${uploaded.response.status}`);
  if (!uploaded.response.ok || !uploaded.body?.id) throw new Error(`Upload de anexo falhou: ${JSON.stringify(uploaded.body).slice(0, 500)}`);
  created.attachmentIds.push(uploaded.body.id);
  const listed = await api("/api/communications-center/attachments", sessions.sales.token);
  const ref = `briefing:${uploaded.body.id}`;
  record("anexo aparece no seletor de e-mail", listed.response.ok && Array.isArray(listed.body) && listed.body.some((item) => item.ref === ref), ref);
  return ref;
}

async function validateCommunications(sessions, companyId, attachmentRef) {
  const status = await expectApi("status das comunicações", "/api/communications-center/status", sessions.owner.token, {}, [200]);
  const emailConfigured = status.body?.email?.status === "configured";
  const gmailConfigured = status.body?.gmail?.status === "configured";
  record("WhatsApp classificado como assistido", status.body?.whatsapp?.status === "assisted" && String(status.body?.whatsapp?.account_label || "").includes("wa.me"), status.body?.whatsapp?.status || "ausente");
  const template = await expectApi("modelo de comunicação criado", "/api/communications-center/templates", sessions.manager.token, {
    method: "POST",
    body: jsonBody({ name: `${runId} Modelo`, channel: "email", subject: "Homologação V6", bodyText: "Mensagem temporária de homologação.", active: true })
  }, [201]);
  record("modelo versionado", Boolean(template.body?.id) && Number(template.body?.current_version || 1) === 1, template.body?.id || "sem id");

  const emailDraft = await expectApi("rascunho de e-mail com anexo criado", "/api/communications-center/compose", sessions.sales.token, {
    method: "POST",
    body: jsonBody({
      companyId,
      channel: "email",
      recipient: "teste.v6.delivery@example.com",
      subject: `Homologação V6 ${runId}`,
      bodyText: "Mensagem controlada da homologação V6.",
      attachmentRefs: [attachmentRef],
      consentConfirmed: true,
      idempotencyKey: `${runId}:email-with-attachment`
    })
  }, [201]);
  created.outboxIds.push(emailDraft.body.id);
  record("referência do anexo persistida na outbox", JSON.stringify(emailDraft.body?.payload || {}).includes(attachmentRef), attachmentRef);
  const emailApprove = await api(`/api/communications-center/outbox/${encodeURIComponent(emailDraft.body.id)}/approve`, sessions.sales.token, {
    method: "POST",
    body: jsonBody({ confirmed: true })
  });
  const expectedExternalBlock = ["EMAIL_PROVIDER_NOT_CONFIGURED", "COMMUNICATION_QUIET_HOURS"].includes(emailApprove.body?.code);
  record(
    "Gmail/SMTP validado ou bloqueio externo comprovado",
    emailConfigured ? emailApprove.response.ok : (emailApprove.response.status === 409 && expectedExternalBlock && !gmailConfigured),
    emailConfigured ? `envio HTTP ${emailApprove.response.status}` : `${emailApprove.body?.code || "sem código"}`
  );

  const waDraft = await expectApi("rascunho WhatsApp assistido criado", "/api/communications-center/compose", sessions.sdr.token, {
    method: "POST",
    body: jsonBody({
      companyId,
      channel: "whatsapp",
      recipient: "+5511999990000",
      bodyText: `Olá, esta é uma abertura assistida controlada ${runId}.`,
      consentConfirmed: true,
      idempotencyKey: `${runId}:whatsapp-assisted`
    })
  }, [201]);
  created.outboxIds.push(waDraft.body.id);
  const waApprove = await expectApi("WhatsApp gera abertura wa.me sem envio automático", `/api/communications-center/outbox/${encodeURIComponent(waDraft.body.id)}/approve`, sessions.sdr.token, {
    method: "POST",
    body: jsonBody({ confirmed: true })
  }, [200]);
  record("modo assistido retornado", waApprove.body?.mode === "assisted" && String(waApprove.body?.url || "").startsWith("https://wa.me/"), waApprove.body?.mode || "ausente");
  await expectApi("abertura assistida encerrada sem alegar envio", `/api/communications-center/outbox/${encodeURIComponent(waDraft.body.id)}/confirm-assisted`, sessions.sdr.token, {
    method: "POST",
    body: jsonBody({ sent: false, note: "Homologação concluída sem envio externo." })
  }, [200]);
  return { emailConfigured, gmailConfigured, status: status.body, emailApprovalCode: emailApprove.body?.code || null };
}

async function validateCalendar(sessions, companyId) {
  const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const createdEvent = await expectApi("agenda cria tarefa/reunião", "/api/calendar", sessions.sales.token, {
    method: "POST",
    body: jsonBody({ companyId, title: `${runId} Reunião de homologação`, type: "reuniao", priority: "alta", startAt: start.toISOString(), endAt: end.toISOString(), status: "pendente", reminderEnabled: false })
  }, [201]);
  created.calendarIds.push(createdEvent.body.id);
  await expectApi("agenda atualiza tarefa/reunião", `/api/calendar/${encodeURIComponent(createdEvent.body.id)}`, sessions.sales.token, {
    method: "PATCH",
    body: jsonBody({ status: "confirmado", notes: "Atualização V6" })
  }, [200]);
  const viewerPatch = await api(`/api/calendar/${encodeURIComponent(createdEvent.body.id)}`, sessions.viewer.token, { method: "PATCH", body: jsonBody({ status: "cancelado" }) });
  record("viewer não altera agenda", viewerPatch.response.status === 403, `HTTP ${viewerPatch.response.status}`);
  await expectApi("agenda exclui item temporário", `/api/calendar/${encodeURIComponent(createdEvent.body.id)}`, sessions.sales.token, { method: "DELETE" }, [200]);
}

async function validateProposals(sessions, companyId) {
  const catalog = await expectApi("produto/serviço criado", "/api/catalog", sessions.owner.token, {
    method: "POST",
    body: jsonBody({
      code: runId,
      name: `${runId} Serviço de Homologação`,
      commercialName: `${runId} Comercial`,
      category: "Homologação",
      type: "service",
      status: "active",
      descriptionShort: "Serviço temporário da homologação V6.",
      commercialGuidance: "Uso exclusivo no teste controlado.",
      billingUnit: "unit",
      price: 100,
      cost: 10,
      maxDiscountPct: 20,
      paymentConditions: "À vista",
      paymentMethod: "PIX",
      executionTime: "1 dia"
    })
  }, [201]);
  const proposal = await expectApi("proposta criada a partir do catálogo", "/api/proposals", sessions.sales.token, {
    method: "POST",
    body: jsonBody({
      lead_id: companyId,
      title: `${runId} Proposta`,
      document_type: "proposal",
      customer_notes: "Proposta temporária para homologação.",
      internal_notes: "NOTA INTERNA V6 NÃO DEVE APARECER NO PDF DO CLIENTE",
      items: [{ catalog_item_id: catalog.body.id, quantity: 2, discount_type: "percent", discount_percent: 10, discount_reason: "Homologação controlada" }]
    })
  }, [201]);
  created.proposalIds.push(proposal.body.id);
  record("snapshot e cálculo comercial consistentes", Number(proposal.body.total) === 180 && Boolean(proposal.body.items?.[0]?.snapshot_name), `total=${proposal.body.total}`);
  const proposalPdf = await expectApi("PDF de proposta gerado", `/api/proposals/${encodeURIComponent(proposal.body.id)}/pdf`, sessions.viewer.token, { method: "POST", body: "{}" }, [200]);
  const proposalText = proposalPdf.body.toString("latin1");
  record("PDF de proposta válido e sem nota interna", proposalPdf.body.subarray(0, 4).toString() === "%PDF" && !proposalText.includes("NOTA INTERNA V6"), `${proposalPdf.body.length} bytes`);
  const contractPdf = await expectApi("PDF de contrato gerado", `/api/proposals/${encodeURIComponent(proposal.body.id)}/contract-pdf`, sessions.viewer.token, { method: "POST", body: "{}" }, [200]);
  record("PDF de contrato válido", contractPdf.body.subarray(0, 4).toString() === "%PDF", `${contractPdf.body.length} bytes`);
  const viewerProposal = await api("/api/proposals", sessions.viewer.token, { method: "POST", body: jsonBody({ lead_id: companyId, title: "Bloqueado", items: [{ catalog_item_id: catalog.body.id, quantity: 1 }] }) });
  record("viewer não cria proposta", viewerProposal.response.status === 403, `HTTP ${viewerProposal.response.status}`);
  return { proposalId: proposal.body.id, catalogId: catalog.body.id };
}

async function validateDashboardAndReports(sessions, companyId) {
  const dashboard = await expectApi("dashboard executivo responde", "/api/dashboard", sessions.owner.token, {}, [200]);
  const reports = await expectApi("relatório executivo responde", "/api/reports/summary", sessions.viewer.token, {}, [200]);
  record("dashboard contém dados reais do workspace", JSON.stringify(dashboard.body).includes(companyId) || Number(dashboard.body?.totalCompanies || dashboard.body?.companies || 0) >= 1, "workspace isolado populado");
  record("relatórios consistentes", reports.body && typeof reports.body === "object", "JSON válido");
  const reportPdf = await api("/api/reports/pdf", sessions.owner.token, { method: "POST", body: jsonBody({ title: `${runId} Relatório`, sections: [{ title: "Homologação", content: "Fluxo V6 aprovado." }] }) });
  record("PDF de relatório responde", reportPdf.response.ok && Buffer.isBuffer(reportPdf.body) && reportPdf.body.subarray(0, 4).toString() === "%PDF", `HTTP ${reportPdf.response.status}`);
}

async function validateAi(sessions) {
  const health = await expectApi("OpenAI health responde", "/api/openai/health", sessions.owner.token, {}, [200]);
  record(
    "OpenAI configurada no backend",
    health.body?.openaiConfigured === true && (health.body?.status === "ok" || health.body?.status?.configured === true),
    JSON.stringify(health.body?.status || {})
  );
  const providerHealth = await expectApi("health dos provedores de IA", "/api/health/providers", "", {}, [200]);
  record(
    "provedor OpenAI operacional",
    providerHealth.body?.providers?.openai === "ok" || providerHealth.body?.providers?.openai?.configured === true,
    JSON.stringify(providerHealth.body?.providers?.openai || {})
  );
  const registry = await expectApi("registry AI Gateway disponível", "/api/ai/registry", sessions.owner.token, {}, [200]);
  const efficient = registry.body?.models?.find((model) => model.id === "openai:gpt-5.6-luna");
  record("modelo eficiente habilitado", Boolean(efficient), efficient?.label || "ausente");
  const walletBefore = await expectApi("carteira de créditos disponível", "/api/ai/wallet", sessions.owner.token, {}, [200]);
  const requestId = `${runId}:real-ai-controlled:${randomUUID()}`;
  const chat = await api("/api/ai/chat", sessions.owner.token, {
    method: "POST",
    body: jsonBody({
      messages: [{ id: randomUUID(), role: "user", parts: [{ type: "text", text: "Teste controlado NODERE V6. Responda apenas com OK V6 e uma frase curta confirmando disponibilidade." }] }],
      agentId: "prospecting-analyst",
      modelId: "openai:gpt-5.6-luna",
      routingMode: "manual",
      requestId
    })
  });
  const streamText = Buffer.isBuffer(chat.body) ? chat.body.toString("utf8") : JSON.stringify(chat.body);
  const aiSucceeded = chat.response.ok
    && streamText.length > 20
    && /OK|V6/i.test(streamText)
    && !/"type":"error"/i.test(streamText);
  record("teste real e controlado de IA", aiSucceeded, `HTTP ${chat.response.status}, ${streamText.length} bytes`);
  if (!aiSucceeded) throw new Error(`Teste real de IA falhou: ${streamText.slice(0, 500)}`);

  if (HTTP_ONLY) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const walletAfterHttp = await expectApi("carteira reconciliada após IA", "/api/ai/wallet", sessions.owner.token, {}, [200]);
    record(
      "saldo e held reconciliados",
      Number(walletAfterHttp.body?.held) === 0 && Number(walletAfterHttp.body?.available) < Number(walletBefore.body?.available) && Number(walletAfterHttp.body?.lifetimeSpent) > Number(walletBefore.body?.lifetimeSpent),
      `antes=${walletBefore.body?.available}, depois=${walletAfterHttp.body?.available}, held=${walletAfterHttp.body?.held}`
    );
    return { walletBefore: walletBefore.body, walletAfter: walletAfterHttp.body, streamBytes: streamText.length, requestId };
  }

  const executionResult = await client.query(
    `select id::text, status, model_id, provider, reserved_credit::float8, charged_credit::float8,
            provider_cost_usd::float8, input_tokens, output_tokens, error_code
       from public.nodere_ai_executions
      where workspace_id = $1 and idempotency_key = $2
      order by started_at desc limit 1`,
    [WORKSPACE_ID, requestId]
  );
  const execution = executionResult.rows[0];
  record("execução real persistida no AI Gateway", execution?.status === "succeeded" && execution?.model_id === "openai:gpt-5.6-luna" && execution?.provider === "openai", execution ? `${execution.status}/${execution.model_id}` : "ausente");
  const ledgerResult = await client.query(
    `select entry_type, amount_credit::float8, available_after::float8, held_after::float8, provider_cost_usd::float8, idempotency_key
       from public.nodere_credit_ledger where workspace_id = $1 and execution_id = $2::uuid order by created_at`,
    [WORKSPACE_ID, execution.id]
  );
  const reserve = ledgerResult.rows.find((row) => row.entry_type === "reserve");
  const capture = ledgerResult.rows.find((row) => row.entry_type === "capture");
  record("ledger registrou reserva e captura", Boolean(reserve && capture) && Number(capture.provider_cost_usd) >= 0, ledgerResult.rows.map((row) => row.entry_type).join(","));
  const duplicate = await supabaseRpc("nodere_ai_reserve_credits", {
    p_workspace_id: WORKSPACE_ID,
    p_execution_id: execution.id,
    p_idempotency_key: `ai:${execution.id}:reserve`,
    p_amount: Number(reserve.amount_credit)
  });
  const duplicateRow = Array.isArray(duplicate) ? duplicate[0] : duplicate;
  record("reserva idempotente não duplica cobrança", duplicateRow?.duplicate === true, `duplicate=${duplicateRow?.duplicate}`);

  const syntheticExecutionId = randomUUID();
  await client.query(
    `insert into public.nodere_ai_executions
      (id, workspace_id, conversation_id, user_id, agent_id, model_id, provider, idempotency_key, status, reserved_credit, started_at)
     values ($1::uuid, $2, null, $3, 'prospecting-analyst', 'openai:gpt-5.6-luna', 'openai', $4, 'pending', 0, now())`,
    [syntheticExecutionId, WORKSPACE_ID, sessions.owner.user.id, `${runId}:release-path`]
  );
  const walletPreRelease = await client.query("select available_credit::float8, held_credit::float8 from public.nodere_credit_wallets where workspace_id = $1", [WORKSPACE_ID]);
  await supabaseRpc("nodere_ai_reserve_credits", { p_workspace_id: WORKSPACE_ID, p_execution_id: syntheticExecutionId, p_idempotency_key: `${runId}:release:reserve`, p_amount: 0.01 });
  const released = await supabaseRpc("nodere_ai_release_credits", { p_workspace_id: WORKSPACE_ID, p_execution_id: syntheticExecutionId, p_idempotency_key: `${runId}:release:final`, p_metadata: { reason: "homologation_controlled_release" } });
  const releasedAgain = await supabaseRpc("nodere_ai_release_credits", { p_workspace_id: WORKSPACE_ID, p_execution_id: syntheticExecutionId, p_idempotency_key: `${runId}:release:final`, p_metadata: { reason: "idempotency_replay" } });
  const walletPostRelease = await client.query("select available_credit::float8, held_credit::float8 from public.nodere_credit_wallets where workspace_id = $1", [WORKSPACE_ID]);
  const beforeRelease = walletPreRelease.rows[0];
  const afterRelease = walletPostRelease.rows[0];
  const replayRow = Array.isArray(releasedAgain) ? releasedAgain[0] : releasedAgain;
  record("falha controlada libera a reserva", Number(afterRelease.available_credit) === Number(beforeRelease.available_credit) && Number(afterRelease.held_credit) === Number(beforeRelease.held_credit), JSON.stringify(Array.isArray(released) ? released[0] : released));
  record("liberação idempotente", replayRow?.duplicate === true, `duplicate=${replayRow?.duplicate}`);
  await client.query("update public.nodere_ai_executions set status = 'cancelled', finished_at = now(), error_code = 'HOMOLOGATION_CONTROLLED_RELEASE' where id = $1::uuid", [syntheticExecutionId]);

  const walletAfter = await expectApi("carteira reconciliada após IA", "/api/ai/wallet", sessions.owner.token, {}, [200]);
  record(
    "saldo e held reconciliados",
    Number(walletAfter.body?.held) === 0 && Number(walletAfter.body?.available) < Number(walletBefore.body?.available) && Number(walletAfter.body?.lifetimeSpent) > Number(walletBefore.body?.lifetimeSpent),
    `antes=${walletBefore.body?.available}, depois=${walletAfter.body?.available}, held=${walletAfter.body?.held}`
  );
  return { execution, ledger: ledgerResult.rows, walletBefore: walletBefore.body, walletAfter: walletAfter.body, streamBytes: streamText.length };
}

async function validateRlsAndDatabase() {
  const result = await client.query(
    `select
       (select count(*)::int from public.nodere_platform_users where workspace_id = $1) as users,
       (select count(*)::int from public.custom_roles where workspace_id = $1) as roles,
       (select count(*)::int from public.nodere_companies where workspace_id = $1) as companies,
       (select count(*)::int from public.nodere_companies where workspace_id = $2) as canary_companies,
       (select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'nodere_platform_users' and column_name in ('custom_role_id','status','last_active_at','visibility_level','module_permissions')) as v6_columns`,
    [WORKSPACE_ID, CANARY_WORKSPACE_ID]
  );
  const row = result.rows[0];
  record("schema V6 completo", row.v6_columns === 5, `colunas=${row.v6_columns}`);
  record("perfis e cargos persistidos", row.users === 7 && row.roles === 5, `usuários=${row.users}, cargos=${row.roles}`);
  const grants = await client.query(
    `select p.proname,
            has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
            has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
            has_function_privilege('service_role', p.oid, 'EXECUTE') as service_execute
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('nodere_ai_reserve_credits','nodere_ai_capture_credits','nodere_ai_release_credits','nodere_ai_grant_credits','nodere_consume_credits')
      order by p.proname`
  );
  record("RPCs financeiras restritas ao service_role", grants.rows.length === 5 && grants.rows.every((row) => !row.anon_execute && !row.authenticated_execute && row.service_execute), `${grants.rows.length}/5`);
  const rls = await client.query(
    `select relname, relrowsecurity, relforcerowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and relname in ('nodere_platform_users','custom_roles','nodere_ai_executions','nodere_credit_wallets','nodere_credit_ledger') order by relname`
  );
  record("RLS e FORCE RLS ativos", rls.rows.length === 5 && rls.rows.every((row) => row.relrowsecurity && row.relforcerowsecurity), `${rls.rows.length}/5`);
  return { counts: row, grants: grants.rows, rls: rls.rows };
}

function saveState(users) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify({
    runId,
    workspaceId: WORKSPACE_ID,
    canaryWorkspaceId: CANARY_WORKSPACE_ID,
    apiBaseUrl: API_BASE_URL,
    webBaseUrl: WEB_BASE_URL,
    password,
    accounts: Object.fromEntries(Object.entries(users).map(([key, user]) => [key, {
      email: user.email,
      label: user.label,
      role: user.role,
      status: user.status,
      customRoleId: user.customRoleId || null
    }]))
  }, null, 2));
}

function saveEvidence(extra = {}) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const evidence = {
    runId,
    workspaceId: WORKSPACE_ID,
    apiBaseUrl: API_BASE_URL,
    webBaseUrl: WEB_BASE_URL,
    generatedAt: new Date().toISOString(),
    retained: RETAIN,
    cleaned,
    summary: { total: checks.length, passed: checks.filter((row) => row.ok).length, failed: checks.filter((row) => !row.ok).length },
    checks,
    created: Object.fromEntries(Object.entries(created).map(([key, value]) => [key, Array.isArray(value) ? value.length : value])),
    ...extra
  };
  fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(evidence, null, 2));
  return evidence;
}

async function run() {
  requireConfig();
  if (HTTP_ONLY) {
    if (!fs.existsSync(STATE_FILE)) throw new Error("Estado temporário da homologação remota não encontrado.");
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    if (saved.workspaceId !== WORKSPACE_ID || !saved.password || !saved.accounts) throw new Error("Estado temporário V6 inválido.");
    runId = saved.runId;
    password = saved.password;
    const users = Object.fromEntries(Object.entries(saved.accounts).map(([key, user]) => [key, { ...profiles.find((profile) => profile.key === key), ...user }]));
    const sessions = await authenticateProfiles(users);
    await validatePermissionMatrix(sessions);
    const companyId = await validateCrmAndIsolation(sessions, saved.canaryCompanyId);
    const briefingId = await validateBriefing(sessions, companyId);
    const attachmentRef = await uploadBriefingAttachment(sessions, briefingId);
    const communications = await validateCommunications(sessions, companyId, attachmentRef);
    await validateCalendar(sessions, companyId);
    const commercial = await validateProposals(sessions, companyId);
    await validateDashboardAndReports(sessions, companyId);
    const ai = await validateAi(sessions);
    const failed = checks.filter((row) => !row.ok);
    record("bateria HTTPS autenticada V6 sem falhas", failed.length === 0, failed.length ? failed.map((row) => row.name).join("; ") : `${checks.length} checks`);
    saveEvidence({ phase: "authenticated-e2e-http", communications, commercial, ai, security: { validation: "supabase_mcp" } });
    if (checks.some((row) => !row.ok)) process.exitCode = 1;
    return;
  }
  await client.connect();
  if (CLEANUP_ONLY) {
    if (fs.existsSync(STATE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      if (saved.workspaceId !== WORKSPACE_ID) throw new Error("Arquivo temporário não corresponde ao workspace V6 esperado.");
      runId = saved.runId || runId;
    }
    await exactCleanup();
    saveEvidence({ phase: "cleanup" });
    return;
  }

  await exactCleanup();
  checks.length = 0;
  cleaned = false;
  await createWorkspaceRows();
  const roleByName = await createRoles();
  const users = await createUsers(roleByName);
  saveState(users);
  const sessions = await authenticateProfiles(users);
  await validatePermissionMatrix(sessions);
  const companyId = await validateCrmAndIsolation(sessions);
  const briefingId = await validateBriefing(sessions, companyId);
  const attachmentRef = await uploadBriefingAttachment(sessions, briefingId);
  const communications = await validateCommunications(sessions, companyId, attachmentRef);
  await validateCalendar(sessions, companyId);
  const commercial = await validateProposals(sessions, companyId);
  await validateDashboardAndReports(sessions, companyId);
  const ai = await validateAi(sessions);
  const security = await validateRlsAndDatabase();
  const failed = checks.filter((row) => !row.ok);
  record("bateria V6 sem falhas", failed.length === 0, failed.length ? failed.map((row) => row.name).join("; ") : `${checks.length} checks`);
  saveEvidence({ phase: "authenticated-e2e", communications, commercial, ai, security });
  if (!RETAIN) await exactCleanup();
  if (checks.some((row) => !row.ok)) process.exitCode = 1;
}

try {
  await run();
} catch (error) {
  record("execução integral da homologação", false, error instanceof Error ? error.message : String(error));
  saveEvidence({ phase: CLEANUP_ONLY ? "cleanup-error" : "authenticated-e2e-error" });
  process.exitCode = 1;
} finally {
  if (client) await client.end().catch(() => undefined);
}
