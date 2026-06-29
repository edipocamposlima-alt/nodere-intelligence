import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const { Client } = require(path.resolve(process.cwd(), "apps/api/node_modules/pg"));

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

const target = process.env.COMMERCIAL_MIGRATION_TARGET ?? "development";
const connectionString = process.env.COMMERCIAL_MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!["development", "staging"].includes(target)) {
  console.error("Defina COMMERCIAL_MIGRATION_TARGET=development ou staging. Producao e bloqueada.");
  process.exit(2);
}

if (!connectionString) {
  console.error("Defina COMMERCIAL_MIGRATION_DATABASE_URL ou DATABASE_URL.");
  process.exit(2);
}

if (/prod|production/i.test(target) || /prod|production/i.test(connectionString)) {
  console.error("Alvo aparenta ser producao. Migracao bloqueada.");
  process.exit(2);
}

const migrationPath = path.resolve(process.cwd(), "packages/database/block_produtos_servicos_composicao_comercial.sql");
const migrationSql = fs.readFileSync(migrationPath, "utf8");

const commercialTables = [
  "nodere_commercial_catalog_items",
  "nodere_proposals",
  "nodere_proposal_items",
  "nodere_proposal_audit_logs"
];

function backupName(table, stamp) {
  return `${table}_${stamp}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

const client = new Client({
  connectionString,
  ssl: process.env.COMMERCIAL_MIGRATION_SSL === "false" ? false : { rejectUnauthorized: false }
});

try {
  await client.connect();
  const info = await client.query("select current_database() as database, current_user as user, inet_server_addr()::text as host");
  console.log(JSON.stringify({ target, connected: info.rows[0] }, null, 2));

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  await client.query("begin");
  await client.query("set local lock_timeout = '10s'");
  await client.query("create schema if not exists nodere_commercial_backups");

  const existing = await client.query(`
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename = any($1::text[])
  `, [commercialTables]);

  const backups = [];
  for (const row of existing.rows) {
    const table = row.tablename;
    const backupTable = backupName(table, stamp);
    await client.query(`create table nodere_commercial_backups.${backupTable} as table public.${table}`);
    backups.push(`nodere_commercial_backups.${backupTable}`);
  }

  await client.query(migrationSql);
  await client.query("commit");

  console.log(JSON.stringify({ ok: true, backups }, null, 2));
} catch (error) {
  try {
    await client.query("rollback");
  } catch {
    // ignore rollback failure
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
