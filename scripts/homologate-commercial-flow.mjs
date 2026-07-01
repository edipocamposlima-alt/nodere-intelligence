import process from "node:process";
import { randomUUID, randomBytes, scryptSync } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiRequire = createRequire(path.join(root, "apps", "api", "package.json"));
const { Client } = apiRequire("pg");

const databaseUrl = process.env.COMMERCIAL_DATABASE_URL || process.env.DATABASE_URL;
const apiBaseUrl = (process.env.COMMERCIAL_API_BASE_URL || "https://nodere-api.onrender.com").replace(/\/+$/, "");
const supabaseUrl = (process.env.COMMERCIAL_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const supabaseAnonKey = process.env.COMMERCIAL_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.COMMERCIAL_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!databaseUrl) {
  console.error("COMMERCIAL_DATABASE_URL ou DATABASE_URL ausente.");
  process.exit(1);
}

const runId = `SMOKE_TEST_DELETE_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}_${randomUUID().slice(0, 8)}`;
const password = `Nd-${randomUUID().slice(0, 12)}!`;
const workspaceId = "default";
const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
const results = [];
const created = { catalogIds: [], proposalIds: [], companyIds: [], userIds: [], authUserIds: [] };

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "OK" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function hashPassword(raw) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(raw, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

async function ensureWorkspace() {
  await client.query(
    `insert into public.nodere_workspaces (id, name, owner_email, plan, credits, created_at, updated_at)
     values ($1, 'NODERE Smoke Workspace', $2, 'trial', 999, now(), now())
     on conflict (id) do update set updated_at = now()`,
    [workspaceId, `smoke+${runId.toLowerCase()}_owner@nodere.com.br`]
  );
}

async function createUser(role) {
  const id = `${runId}_${role}`;
  const email = `smoke+${runId.toLowerCase()}_${role}@nodere.com.br`;
  await client.query(
    `insert into public.nodere_platform_users
      (id, workspace_id, name, email, role, active, password_hash, created_at, updated_at)
     values ($1, $2, $3, $4, $5, true, $6, now(), now())
     on conflict (email) do update set role = excluded.role, active = true, password_hash = excluded.password_hash, updated_at = now()`,
    [id, workspaceId, `${runId} ${role}`, email, role, hashPassword(password)]
  );
  created.userIds.push(id);
  return { id, email, role };
}

async function api(pathname, token, options = {}) {
  const response = await fetch(`${apiBaseUrl}${pathname}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.arrayBuffer();
  return { response, body };
}

async function login(user) {
  const response = await fetch(`${apiBaseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: user.email, password })
  });
  const body = await response.json().catch(() => ({}));
  if (response.ok && body.token) return body.token;
  return loginWithSupabaseAuth(user, `HTTP ${response.status} ${body.message || ""}`.trim());
}

async function loginWithSupabaseAuth(user, previousError) {
  const authApiKey = supabaseServiceRoleKey || supabaseAnonKey;
  if (!supabaseUrl || !authApiKey) {
    throw new Error(`Login ${user.role} falhou: ${previousError}. Supabase Auth key indisponivel para fallback.`);
  }
  const authHeaders = {
    "content-type": "application/json",
    apikey: authApiKey,
    authorization: `Bearer ${authApiKey}`
  };
  let authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email: user.email, password })
  });
  let authBody = await authResponse.json().catch(() => ({}));
  if (!authResponse.ok) {
    if (supabaseServiceRoleKey) {
      const adminResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ email: user.email, password, email_confirm: true, user_metadata: { name: `${runId} ${user.role}` } })
      });
      if (!adminResponse.ok && adminResponse.status !== 422) {
        const adminBody = await adminResponse.json().catch(() => ({}));
        throw new Error(`Supabase Admin create ${user.role} falhou: HTTP ${adminResponse.status} ${adminBody.msg || adminBody.message || ""}`);
      }
    } else {
      authResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ email: user.email, password, data: { name: `${runId} ${user.role}` } })
      });
      authBody = await authResponse.json().catch(() => ({}));
      if (!authResponse.ok || !authBody.user) {
        await createSupabaseAuthUserDirect(user.email, `${runId} ${user.role}`);
      }
    }
    await confirmSupabaseAuthUser(user.email);
    authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ email: user.email, password })
    });
    authBody = await authResponse.json().catch(() => ({}));
  }
  const accessToken = authBody.access_token;
  if (!accessToken) {
    throw new Error(`Login ${user.role} falhou: ${previousError}. Supabase Auth HTTP ${authResponse.status}: ${authBody.msg || authBody.message || "sem access_token"}`);
  }
  const linkResponse = await fetch(`${apiBaseUrl}/api/admin/supabase-session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessToken })
  });
  const linkBody = await linkResponse.json().catch(() => ({}));
  if (!linkResponse.ok || !linkBody.token) {
    throw new Error(`Troca Supabase session ${user.role} falhou: HTTP ${linkResponse.status} ${linkBody.message || ""}`);
  }
  return linkBody.token;
}

async function createSupabaseAuthUserDirect(email, name) {
  const existing = await client.query(
    "select id from auth.users where lower(email) = lower($1) and deleted_at is null order by created_at desc limit 1",
    [email]
  );
  const authUserId = existing.rows[0]?.id || randomUUID();
  if (existing.rows[0]?.id) {
    await client.query(
      `update auth.users
       set aud = 'authenticated',
           role = 'authenticated',
           encrypted_password = crypt($2, gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
           raw_user_meta_data = jsonb_build_object('name', $3::text),
           updated_at = now(),
           is_sso_user = false,
           is_anonymous = false
       where id = $1::uuid`,
      [authUserId, password, name]
    );
  } else {
    await client.query(
      `insert into auth.users
        (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
       values
        ('00000000-0000-0000-0000-000000000000'::uuid, $1::uuid, 'authenticated', 'authenticated', $2,
         crypt($3, gen_salt('bf')), now(),
         '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('name', $4::text),
         now(), now(), false, false)`,
      [authUserId, email, password, name]
    );
  }
  await client.query(
    `insert into auth.identities
      (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
     values
      ($1::text, $1::uuid, jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true, 'phone_verified', false),
       'email', now(), now(), now())
     on conflict (provider, provider_id) do update
       set identity_data = excluded.identity_data,
           updated_at = now()`,
    [authUserId, email]
  );
}

async function confirmSupabaseAuthUser(email) {
  const authUser = await client.query("select id from auth.users where lower(email) = lower($1) and deleted_at is null order by created_at desc limit 1", [email]);
  const authUserId = authUser.rows[0]?.id;
  if (!authUserId) throw new Error(`Supabase Auth nao criou usuario para ${email}.`);
  await client.query(
    `update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
     where id = $1::uuid`,
    [authUserId]
  );
  await client.query(
    "update public.nodere_platform_users set auth_user_id = $1::uuid, updated_at = now() where lower(email) = lower($2)",
    [authUserId, email]
  );
  created.authUserIds.push(authUserId);
}

async function getOrCreateCompany() {
  const id = `${runId}_company`;
  await client.query(
    `insert into public.nodere_companies
      (id, workspace_id, name, category, city, state, address, status, score, opportunity_level, created_at, updated_at)
     values ($1, $2, $3, 'Smoke Test', 'Porto Alegre', 'RS', 'Teste', 'Novo Lead', 10, 'Baixa', now(), now())
     on conflict (id) do update set updated_at = now()`,
    [id, workspaceId, runId]
  );
  created.companyIds.push(id);
  return id;
}

async function cleanup() {
  for (const id of created.catalogIds) {
    await client.query("update public.catalog_items set status = 'inactive', deleted_at = coalesce(deleted_at, now()) where id = $1", [id]).catch(() => undefined);
  }
  for (const id of created.userIds) {
    await client.query("update public.nodere_platform_users set active = false, updated_at = now() where id = $1", [id]).catch(() => undefined);
  }
  for (const id of created.authUserIds) {
    await client.query("delete from auth.identities where user_id = $1::uuid", [id]).catch(() => undefined);
    await client.query("delete from auth.users where id = $1::uuid", [id]).catch(() => undefined);
  }
}

try {
  await client.connect();
  await ensureWorkspace();
  const users = {
    owner: await createUser("owner"),
    admin: await createUser("admin"),
    operator: await createUser("operator"),
    viewer: await createUser("viewer")
  };
  const tokens = {
    owner: await login(users.owner),
    admin: await login(users.admin),
    operator: await login(users.operator),
    viewer: await login(users.viewer)
  };
  record("login real por perfil", true, "owner/admin/operator/viewer");

  const companyId = await getOrCreateCompany();

  const catalogPayload = {
    code: runId,
    name: `${runId} Servico Comercial`,
    commercialName: `${runId} Comercial`,
    category: "Smoke Test",
    type: "service",
    status: "active",
    descriptionShort: "Servico criado pela homologacao automatizada.",
    commercialGuidance: "Orientacao comercial visivel no snapshot.",
    billingUnit: "hour",
    price: 1000,
    cost: 100,
    maxDiscountPct: 50,
    paymentConditions: "30 dias",
    paymentMethod: "PIX",
    executionTime: "5 dias uteis",
    internalNotes: "SMOKE_INTERNAL_NOTE_DO_NOT_EXPOSE"
  };

  const createByOwner = await api("/api/catalog", tokens.owner, { method: "POST", body: JSON.stringify(catalogPayload) });
  if (!createByOwner.response.ok) throw new Error(`owner cria catalogo HTTP ${createByOwner.response.status}: ${createByOwner.body?.message || ""}`);
  const activeItem = createByOwner.body;
  created.catalogIds.push(activeItem.id);
  record("owner cria produto/servico", true, activeItem.id);

  const editByAdmin = await api(`/api/catalog/${encodeURIComponent(activeItem.id)}`, tokens.admin, {
    method: "PATCH",
    body: JSON.stringify({ name: `${runId} Servico Editado`, descriptionShort: "Descricao editada na homologacao.", price: 1200, billingUnit: "hour" })
  });
  if (!editByAdmin.response.ok) throw new Error(`admin edita catalogo HTTP ${editByAdmin.response.status}: ${editByAdmin.body?.message || ""}`);
  record("admin edita produto/servico", true);

  const blockedOperator = await api("/api/catalog", tokens.operator, { method: "POST", body: JSON.stringify({ ...catalogPayload, code: `${runId}_OP` }) });
  record("operator nao cria catalogo", blockedOperator.response.status === 403, `HTTP ${blockedOperator.response.status}`);

  const blockedViewer = await api(`/api/catalog/${encodeURIComponent(activeItem.id)}`, tokens.viewer, {
    method: "PATCH",
    body: JSON.stringify({ name: "viewer should fail" })
  });
  record("viewer nao edita catalogo", blockedViewer.response.status === 403, `HTTP ${blockedViewer.response.status}`);

  const viewerList = await api("/api/catalog", tokens.viewer);
  record("viewer visualiza catalogo", viewerList.response.ok && Array.isArray(viewerList.body), `HTTP ${viewerList.response.status}`);

  const manualProposal = await api("/api/proposals", tokens.operator, {
    method: "POST",
    body: JSON.stringify({
      lead_id: companyId,
      title: `${runId} Manual Block`,
      items: [{ description: "Item livre", quantity: 1, unit_price: 1 }]
    })
  });
  record("proposta nao aceita item manual/livre", manualProposal.response.status >= 400, `HTTP ${manualProposal.response.status}`);

  const missingReason = await api("/api/proposals", tokens.operator, {
    method: "POST",
    body: JSON.stringify({
      lead_id: companyId,
      title: `${runId} Missing Reason`,
      items: [{ catalog_item_id: activeItem.id, quantity: 1, discount_type: "percent", discount_percent: 10 }]
    })
  });
  record("motivo obrigatorio quando houver desconto", missingReason.response.status === 422, `HTTP ${missingReason.response.status}`);

  const bothDiscounts = await api("/api/proposals", tokens.operator, {
    method: "POST",
    body: JSON.stringify({
      lead_id: companyId,
      title: `${runId} Both Discounts`,
      items: [{ catalog_item_id: activeItem.id, quantity: 1, discount_type: "percent", discount_percent: 10, discount_amount: 10, discount_reason: "Teste" }]
    })
  });
  record("percentual e valor nao podem ser usados juntos", bothDiscounts.response.status === 422, `HTTP ${bothDiscounts.response.status}`);

  const percentProposal = await api("/api/proposals", tokens.operator, {
    method: "POST",
    body: JSON.stringify({
      lead_id: companyId,
      title: `${runId} Percent Proposal`,
      document_type: "proposal",
      customer_notes: `${runId} CUSTOMER_NOTE_VISIBLE`,
      internal_notes: `${runId} INTERNAL_NOTE_HIDDEN`,
      items: [{ catalog_item_id: activeItem.id, quantity: 2, discount_type: "percent", discount_percent: 10, discount_reason: "Smoke percent" }]
    })
  });
  if (!percentProposal.response.ok) throw new Error(`desconto percentual HTTP ${percentProposal.response.status}: ${percentProposal.body?.message || ""}`);
  created.proposalIds.push(percentProposal.body.id);
  record("desconto percentual funciona", Number(percentProposal.body.discount) === 240 && Number(percentProposal.body.total) === 2160);
  record("snapshot comercial salvo corretamente", Array.isArray(percentProposal.body.items) && percentProposal.body.items[0]?.snapshot_name?.includes(runId));

  await api(`/api/catalog/${encodeURIComponent(activeItem.id)}`, tokens.admin, {
    method: "PATCH",
    body: JSON.stringify({ name: `${runId} Nome Alterado Pos Snapshot`, price: 9999 })
  });
  const proposalsAfterChange = await api("/api/proposals", tokens.viewer);
  const preserved = Array.isArray(proposalsAfterChange.body)
    ? proposalsAfterChange.body.find((item) => item.id === percentProposal.body.id)
    : null;
  record("alteracao posterior no catalogo nao altera proposta", preserved?.items?.[0]?.snapshot_unit_price === 1200);

  const amountProposal = await api("/api/proposals", tokens.operator, {
    method: "POST",
    body: JSON.stringify({
      lead_id: companyId,
      title: `${runId} Amount Proposal`,
      items: [{ catalog_item_id: activeItem.id, quantity: 1, discount_type: "amount", discount_amount: 100, discount_reason: "Smoke amount" }]
    })
  });
  if (!amountProposal.response.ok) throw new Error(`desconto em valor HTTP ${amountProposal.response.status}: ${amountProposal.body?.message || ""}`);
  created.proposalIds.push(amountProposal.body.id);
  record("desconto em valor funciona", Number(amountProposal.body.discount) === 100);

  const pdf = await api(`/api/proposals/${encodeURIComponent(percentProposal.body.id)}/pdf`, tokens.operator, { method: "POST" });
  const pdfText = Buffer.from(pdf.body).toString("latin1");
  record("PDF gerado", pdf.response.ok && pdf.response.headers.get("content-type")?.includes("application/pdf"), `HTTP ${pdf.response.status}`);
  record("PDF nao expoe observacoes internas", !pdfText.includes("SMOKE_INTERNAL_NOTE_DO_NOT_EXPOSE"));
  record("PDF nao expoe observacao interna global", !pdfText.includes("INTERNAL_NOTE_HIDDEN"));
  record("PDF nao expoe motivo interno do desconto", !pdfText.includes("Smoke percent"));

  const contractPdf = await api(`/api/proposals/${encodeURIComponent(percentProposal.body.id)}/contract-pdf`, tokens.operator, { method: "POST" });
  record("PDF de contrato gerado", contractPdf.response.ok && contractPdf.response.headers.get("content-type")?.includes("application/pdf"), `HTTP ${contractPdf.response.status}`);

  const audit = await client.query(
    `select action from public.nodere_audit_logs
     where workspace_id = $1 and resource_type = 'proposal' and resource_id = any($2::text[])
     order by created_at desc`,
    [workspaceId, created.proposalIds]
  );
  const auditActions = new Set(audit.rows.map((row) => row.action));
  record("auditoria registra criacao/PDF", auditActions.has("proposal_created") && auditActions.has("proposal_pdf_generated") && auditActions.has("contract_pdf_generated"), [...auditActions].join(","));

  const inactive = await api(`/api/catalog/${encodeURIComponent(activeItem.id)}`, tokens.admin, { method: "DELETE" });
  record("admin inativa produto/servico", inactive.response.ok, `HTTP ${inactive.response.status}`);

  const inactiveProposal = await api("/api/proposals", tokens.operator, {
    method: "POST",
    body: JSON.stringify({
      lead_id: companyId,
      title: `${runId} Inactive Block`,
      items: [{ catalog_item_id: activeItem.id, quantity: 1 }]
    })
  });
  record("proposta so permite item ativo do catalogo", inactiveProposal.response.status === 422, `HTTP ${inactiveProposal.response.status}`);

  const failed = results.filter((item) => !item.ok);
  await cleanup();
  if (failed.length) {
    throw new Error(`Homologacao falhou: ${failed.map((item) => item.name).join(", ")}`);
  }
  console.log("Homologacao comercial funcional aprovada.");
} catch (error) {
  await cleanup().catch(() => undefined);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
} finally {
  await client.end().catch(() => undefined);
}
