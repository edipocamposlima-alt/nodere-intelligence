import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const pgPath = path.resolve(process.cwd(), "apps/api/node_modules/pg");
const { Client } = require(pgPath);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env"));
loadEnvFile(path.resolve(process.cwd(), "apps/api/.env"));

const target = process.env.COMMERCIAL_VALIDATION_TARGET ?? process.env.COMMERCIAL_MIGRATION_TARGET ?? "development";
const connectionString = process.env.COMMERCIAL_VALIDATION_DATABASE_URL
  ?? process.env.COMMERCIAL_MIGRATION_DATABASE_URL
  ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Defina COMMERCIAL_VALIDATION_DATABASE_URL ou DATABASE_URL com a connection string de development/staging.");
  process.exit(2);
}

if (!["development", "staging"].includes(target)) {
  console.error("Defina COMMERCIAL_VALIDATION_TARGET=development ou staging. Producao e bloqueada.");
  process.exit(2);
}

if (/prod|production/i.test(target) || /prod|production/i.test(connectionString)) {
  console.error("Alvo aparenta ser producao. Validacao bloqueada.");
  process.exit(2);
}

const requiredTables = [
  "nodere_commercial_catalog_items",
  "nodere_proposals",
  "nodere_proposal_items",
  "nodere_proposal_audit_logs"
];

const requiredColumns = {
  nodere_commercial_catalog_items: [
    "id", "workspace_id", "type", "name", "description", "unit", "unit_price_cents",
    "currency", "active", "created_by", "updated_by", "created_at", "updated_at"
  ],
  nodere_proposals: [
    "id", "workspace_id", "company_id", "title", "status", "subtotal_cents",
    "discount_percent", "discount_value_cents", "discount_reason", "total_cents",
    "commercial_snapshot", "created_by", "updated_by", "created_at", "updated_at"
  ],
  nodere_proposal_items: [
    "id", "proposal_id", "catalog_item_id", "item_snapshot", "quantity",
    "unit_price_cents", "subtotal_cents", "created_at"
  ],
  nodere_proposal_audit_logs: [
    "id", "proposal_id", "workspace_id", "actor_id", "action", "metadata", "created_at"
  ]
};

const requiredConstraints = [
  "nodere_proposals_single_discount",
  "nodere_proposals_discount_reason_required"
];

const requiredPolicies = [
  "nodere_catalog_read_workspace",
  "nodere_catalog_write_admin_owner",
  "nodere_proposals_read_workspace",
  "nodere_proposals_write_workspace",
  "nodere_proposal_items_read_workspace",
  "nodere_proposal_items_write_workspace",
  "nodere_proposal_audit_workspace"
];

const requiredTriggers = [
  "nodere_catalog_touch_updated_at",
  "nodere_proposals_touch_updated_at",
  "nodere_recalculate_before_proposal_discount_change",
  "nodere_validate_proposal_item",
  "nodere_recalculate_after_item_change"
];

const requiredFunctions = [
  "nodere_current_user_role",
  "nodere_touch_updated_at",
  "nodere_validate_proposal_item",
  "nodere_recalculate_proposal_totals",
  "nodere_recalculate_current_proposal"
];

function missing(expected, actual) {
  const actualSet = new Set(actual);
  return expected.filter((item) => !actualSet.has(item));
}

const client = new Client({
  connectionString,
  ssl: process.env.COMMERCIAL_VALIDATION_SSL === "false" ? false : { rejectUnauthorized: false }
});

const failures = [];

try {
  await client.connect();
  await client.query("begin read only");

  const tableResult = await client.query(`
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename = any($1::text[])
    order by tablename
  `, [requiredTables]);
  const tables = tableResult.rows.map((row) => row.tablename);
  const missingTables = missing(requiredTables, tables);
  if (missingTables.length) failures.push({ check: "tables", missing: missingTables });

  for (const [table, columns] of Object.entries(requiredColumns)) {
    const result = await client.query(`
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
      order by ordinal_position
    `, [table]);
    const missingColumns = missing(columns, result.rows.map((row) => row.column_name));
    if (missingColumns.length) failures.push({ check: `columns:${table}`, missing: missingColumns });
  }

  const constraintResult = await client.query(`
    select conname
    from pg_constraint
    where connamespace = 'public'::regnamespace
      and conname = any($1::text[])
  `, [requiredConstraints]);
  const missingConstraints = missing(requiredConstraints, constraintResult.rows.map((row) => row.conname));
  if (missingConstraints.length) failures.push({ check: "constraints", missing: missingConstraints });

  const rlsResult = await client.query(`
    select relname, relrowsecurity
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname = any($1::text[])
  `, [requiredTables]);
  const rlsDisabled = rlsResult.rows.filter((row) => row.relrowsecurity !== true).map((row) => row.relname);
  if (rlsDisabled.length) failures.push({ check: "rls", disabled: rlsDisabled });

  const policyResult = await client.query(`
    select policyname
    from pg_policies
    where schemaname = 'public'
      and policyname = any($1::text[])
  `, [requiredPolicies]);
  const missingPolicies = missing(requiredPolicies, policyResult.rows.map((row) => row.policyname));
  if (missingPolicies.length) failures.push({ check: "policies", missing: missingPolicies });

  const triggerResult = await client.query(`
    select tgname
    from pg_trigger
    where not tgisinternal
      and tgname = any($1::text[])
  `, [requiredTriggers]);
  const missingTriggers = missing(requiredTriggers, triggerResult.rows.map((row) => row.tgname));
  if (missingTriggers.length) failures.push({ check: "triggers", missing: missingTriggers });

  const functionResult = await client.query(`
    select proname
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = any($1::text[])
  `, [requiredFunctions]);
  const missingFunctions = missing(requiredFunctions, functionResult.rows.map((row) => row.proname));
  if (missingFunctions.length) failures.push({ check: "functions", missing: missingFunctions });

  await client.query("rollback");

  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok: true,
    checked: {
      tables: requiredTables.length,
      constraints: requiredConstraints.length,
      policies: requiredPolicies.length,
      triggers: requiredTriggers.length,
      functions: requiredFunctions.length
    }
  }, null, 2));
} catch (error) {
  try {
    await client.query("rollback");
  } catch {
    // ignore rollback failure after connection/query errors
  }
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error
      ? { name: error.name, message: error.message, code: error.code, stack: error.stack }
      : error
  }, null, 2));
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
