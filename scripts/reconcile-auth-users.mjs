#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const require = createRequire(new URL("../apps/api/package.json", import.meta.url));
const { Client } = require("pg");
const dotenv = require("dotenv");

dotenv.config({ path: resolve(process.cwd(), "apps/api/.env") });
dotenv.config({ path: resolve(process.cwd(), ".env"), override: false });

const args = parseArgs(process.argv.slice(2));
const mode = args.rollback ? "rollback" : args.apply ? "apply" : "dry-run";
const batchSize = clamp(Number(args.batch || 50), 1, 500);
const checkpointPath = args.checkpoint ? resolve(String(args.checkpoint)) : "";
const outputPath = resolve(String(args.output || "NODERE_RECONCILIACAO_AUTH_RESULTADO.csv"));

await main().catch((error) => {
  console.error(`[reconcile-auth-users] ${sanitizeError(error)}`);
  process.exitCode = 1;
});

async function main() {
  if (mode === "rollback") return rollback();
  assertRuntimeConfig();
  if (mode === "apply") assertApplyGate();

  const client = databaseClient();
  await client.connect();
  try {
    const profiles = await loadProfiles(client);
    const authUsers = await loadAuthUsers();
    const result = classify(profiles, authUsers);
    writeCsv(outputPath, result.matrix);

    console.log(`[reconcile-auth-users] mode=${mode} profiles=${profiles.length} auth=${authUsers.length}`);
    console.log(`[reconcile-auth-users] deterministic_links=${result.actions.length} conflicts=${result.conflicts}`);
    console.log(`[reconcile-auth-users] matrix=${outputPath}`);

    if (mode === "dry-run") {
      console.log("[reconcile-auth-users] dry-run concluído; nenhuma alteração foi feita.");
      return;
    }

    const checkpoint = {
      version: 1,
      createdAt: new Date().toISOString(),
      environment: String(args.environment),
      projectRef: String(args["project-ref"]),
      status: "started",
      actions: result.actions.map((action) => ({ ...action, applied: false }))
    };
    writeJson(checkpointPath, checkpoint);

    for (let offset = 0; offset < checkpoint.actions.length; offset += batchSize) {
      const batch = checkpoint.actions.slice(offset, offset + batchSize);
      await client.query("begin");
      try {
        await client.query("select pg_advisory_xact_lock(hashtext('nodere-auth-reconciliation'))");
        for (const action of batch) {
          const updated = await client.query(
            `update public.nodere_platform_users
             set auth_user_id = $1, updated_at = now()
             where id = $2
               and active = true
               and auth_user_id is null`,
            [action.newAuthUserId, action.profileId]
          );
          if (updated.rowCount !== 1) throw new Error(`Vínculo concorrente ou não idempotente no perfil ${action.profileId}.`);
          action.applied = true;
          action.appliedAt = new Date().toISOString();
        }
        await client.query("commit");
        writeJson(checkpointPath, checkpoint);
        console.log(`[reconcile-auth-users] lote_aplicado=${offset / batchSize + 1} registros=${batch.length}`);
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        checkpoint.status = "failed";
        checkpoint.error = sanitizeError(error);
        writeJson(checkpointPath, checkpoint);
        throw error;
      }
    }

    checkpoint.status = "complete";
    checkpoint.completedAt = new Date().toISOString();
    writeJson(checkpointPath, checkpoint);
    console.log(`[reconcile-auth-users] concluído alterações=${checkpoint.actions.filter((item) => item.applied).length}`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function rollback() {
  assertRuntimeConfig();
  if (!checkpointPath || !existsSync(checkpointPath)) throw new Error("Rollback exige --checkpoint apontando para um arquivo existente.");
  if (args.confirm !== "CONFIRM-AUTH-ROLLBACK") throw new Error("Rollback exige --confirm CONFIRM-AUTH-ROLLBACK.");
  const checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8"));
  const actions = Array.isArray(checkpoint.actions) ? checkpoint.actions.filter((item) => item.applied && !item.rolledBack) : [];
  const client = databaseClient();
  await client.connect();
  try {
    for (let offset = 0; offset < actions.length; offset += batchSize) {
      const batch = actions.slice(offset, offset + batchSize);
      await client.query("begin");
      try {
        await client.query("select pg_advisory_xact_lock(hashtext('nodere-auth-reconciliation'))");
        for (const action of batch) {
          const reverted = await client.query(
            `update public.nodere_platform_users
             set auth_user_id = $1, updated_at = now()
             where id = $2 and auth_user_id = $3`,
            [action.oldAuthUserId || null, action.profileId, action.newAuthUserId]
          );
          if (reverted.rowCount !== 1) throw new Error(`Estado divergente; rollback recusado no perfil ${action.profileId}.`);
          action.rolledBack = true;
          action.rolledBackAt = new Date().toISOString();
        }
        await client.query("commit");
        writeJson(checkpointPath, checkpoint);
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw error;
      }
    }
    checkpoint.status = "rolled_back";
    checkpoint.rolledBackAt = new Date().toISOString();
    writeJson(checkpointPath, checkpoint);
    console.log(`[reconcile-auth-users] rollback concluído registros=${actions.length}`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

function classify(profiles, authUsers) {
  const profileByEmail = groupBy(profiles, (item) => normalizeEmail(item.email));
  const authByEmail = groupBy(authUsers, (item) => normalizeEmail(item.email));
  const authById = new Map(authUsers.map((item) => [item.id, item]));
  const actions = [];
  const matrix = [];
  let conflicts = 0;

  for (const profile of profiles) {
    const email = normalizeEmail(profile.email);
    const sameProfiles = profileByEmail.get(email) || [];
    const sameAuth = authByEmail.get(email) || [];
    const linkedAuth = profile.auth_user_id ? authById.get(profile.auth_user_id) : null;
    let classification = "profile_without_auth";
    let risk = "high";
    let recommendation = "manual_review";

    if (!isValidEmail(email)) classification = "invalid_email";
    else if (!profile.active) classification = "inactive_profile";
    else if (sameProfiles.length > 1 || sameAuth.length > 1) classification = "duplicate_email";
    else if (profile.auth_user_id && !linkedAuth) classification = "orphan_auth_uid";
    else if (linkedAuth && normalizeEmail(linkedAuth.email) !== email) classification = "auth_uid_email_mismatch";
    else if (linkedAuth) {
      classification = "profile_and_auth_ok";
      risk = "low";
      recommendation = "none";
    } else if (sameAuth.length === 1 && sameAuth[0].email_confirmed_at) {
      classification = "deterministic_link_candidate";
      risk = "medium";
      recommendation = "link_exact_unique_email";
      actions.push({ profileId: profile.id, oldAuthUserId: null, newAuthUserId: sameAuth[0].id });
    } else if (sameAuth.length === 1) {
      classification = "auth_unconfirmed";
      recommendation = "confirm_identity_before_link";
    } else {
      classification = "no_safe_automatic_reconciliation";
      recommendation = "individual_identity_validation";
    }

    if (!["profile_and_auth_ok", "deterministic_link_candidate", "inactive_profile"].includes(classification)) conflicts += 1;
    matrix.push(matrixRow({
      internal_id: profile.id,
      auth_uid: profile.auth_user_id || "",
      name: profile.name || "",
      normalized_email_masked: maskEmail(email),
      email_fingerprint: fingerprint(email),
      auth_state: linkedAuth ? "present" : sameAuth.length ? "email_match_unlinked" : "missing",
      profile_state: profile.active ? String(profile.status || "active") : "inactive",
      duplicate: sameProfiles.length > 1 || sameAuth.length > 1,
      conflict: !["profile_and_auth_ok", "deterministic_link_candidate", "inactive_profile"].includes(classification),
      created_at: profile.created_at || "",
      last_access_at: profile.last_active_at || linkedAuth?.last_sign_in_at || "",
      dependencies: "preserved_not_mutated",
      related_actions: recommendation,
      risk,
      classification,
      recommended_solution: recommendation
    }));
  }

  const linkedIds = new Set(profiles.map((item) => item.auth_user_id).filter(Boolean));
  for (const authUser of authUsers.filter((item) => !linkedIds.has(item.id))) {
    const email = normalizeEmail(authUser.email);
    if ((profileByEmail.get(email) || []).length) continue;
    conflicts += 1;
    matrix.push(matrixRow({
      internal_id: "",
      auth_uid: authUser.id,
      name: "",
      normalized_email_masked: maskEmail(email),
      email_fingerprint: fingerprint(email),
      auth_state: "present_unlinked",
      profile_state: "missing",
      duplicate: false,
      conflict: true,
      created_at: authUser.created_at || "",
      last_access_at: authUser.last_sign_in_at || "",
      dependencies: "workspace_unknown",
      related_actions: "none",
      risk: "high",
      classification: "auth_without_profile",
      recommended_solution: "individual_workspace_validation"
    }));
  }

  return { actions, matrix, conflicts };
}

async function loadProfiles(client) {
  const result = await client.query(`
    select id, auth_user_id, name, email, active, status, role, created_at, last_active_at
    from public.nodere_platform_users
    order by created_at asc, id asc
  `);
  return result.rows;
}

async function loadAuthUsers() {
  const base = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  const users = [];
  for (let page = 1; ; page += 1) {
    const response = await fetch(`${base}/auth/v1/admin/users?page=${page}&per_page=1000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) throw new Error(`Supabase Auth recusou listagem (HTTP ${response.status}).`);
    const payload = await response.json();
    const pageUsers = Array.isArray(payload) ? payload : payload.users || [];
    users.push(...pageUsers);
    if (pageUsers.length < 1000) break;
  }
  return users;
}

function assertRuntimeConfig() {
  const missing = ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Variáveis ausentes: ${missing.join(", ")}.`);
}

function assertApplyGate() {
  if (args.confirm !== "CONFIRM-AUTH-RECONCILIATION") throw new Error("Aplicação exige --confirm CONFIRM-AUTH-RECONCILIATION.");
  if (!checkpointPath) throw new Error("Aplicação exige --checkpoint <arquivo>.");
  if (!args.environment) throw new Error("Aplicação exige --environment staging|production.");
  if (!args["project-ref"]) throw new Error("Aplicação exige --project-ref <ref>.");
  if (args.environment === "production" && !args["allow-production"]) {
    throw new Error("Produção exige também --allow-production, após backup restaurável e staging validados.");
  }
}

function databaseClient() {
  const connectionString = String(process.env.DATABASE_URL);
  const host = new URL(connectionString).hostname;
  const ssl = ["localhost", "127.0.0.1", "::1"].includes(host) ? false : { rejectUnauthorized: false };
  return new Client({ connectionString, ssl });
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw.startsWith("--")) continue;
    const [name, inline] = raw.slice(2).split("=", 2);
    if (inline !== undefined) parsed[name] = inline;
    else if (argv[index + 1] && !argv[index + 1].startsWith("--")) parsed[name] = argv[++index];
    else parsed[name] = true;
  }
  return parsed;
}

function groupBy(items, key) {
  const grouped = new Map();
  for (const item of items) {
    const value = key(item);
    grouped.set(value, [...(grouped.get(value) || []), item]);
  }
  return grouped;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function maskEmail(value) {
  const [local = "", domain = ""] = value.split("@");
  if (!domain) return "invalid";
  return `${local.slice(0, 2)}***@${domain}`;
}

function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function matrixRow(row) {
  return row;
}

function writeCsv(path, rows) {
  const headers = Object.keys(rows[0] || {
    internal_id: "", auth_uid: "", normalized_email_masked: "", classification: "", recommended_solution: ""
  });
  const lines = [headers.join(","), ...rows.map((row) => headers.map((header) => csv(row[header])).join(","))];
  writeFileSync(path, `${lines.join("\n")}\n`, { encoding: "utf8", mode: 0o600 });
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

function csv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[DATABASE_URL]").replace(/eyJ[A-Za-z0-9._-]+/g, "[TOKEN]");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}
