import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiRequire = createRequire(path.join(root, "apps", "api", "package.json"));
const { Client } = apiRequire("pg");

const databaseUrl = process.env.COMMERCIAL_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("COMMERCIAL_DATABASE_URL ou DATABASE_URL ausente.");
  process.exit(1);
}

const migrationPath = path.join(root, "packages", "database", "block_produtos_servicos_composicao_comercial.sql");
const migrationSql = fs.readFileSync(migrationPath, "utf8");
const reportPath = path.join(root, "BACKUP_LOGICO_COMERCIAL_PRE_MIGRACAO.md");

const tables = ["catalog_items", "nodere_proposals", "nodere_audit_logs", "nodere_platform_users", "nodere_companies"];

const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

function mdTable(rows, columns) {
  if (!rows.length) return "_Nenhum registro._\n";
  const header = `| ${columns.join(" | ")} |`;
  const sep = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((col) => String(row[col] ?? "").replace(/\|/g, "\\|")).join(" | ")} |`);
  return [header, sep, ...body].join("\n") + "\n";
}

async function collectBackup() {
  const counts = await client.query(
    `select table_name, (
       xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, ''))
     )[1]::text::int as row_count
     from information_schema.tables
     where table_schema = 'public' and table_name = any($1::text[])
     order by table_name`,
    [tables]
  );
  const columns = await client.query(
    `select table_name, column_name, data_type, is_nullable, column_default
     from information_schema.columns
     where table_schema = 'public' and table_name = any($1::text[])
     order by table_name, ordinal_position`,
    [tables]
  );
  const constraints = await client.query(
    `select conrelid::regclass::text as table_name, conname, contype
     from pg_constraint
     where connamespace = 'public'::regnamespace
       and conrelid::regclass::text = any($1::text[])
     order by table_name, conname`,
    [tables.map((table) => `public.${table}`)]
  );
  const indexes = await client.query(
    `select tablename as table_name, indexname
     from pg_indexes
     where schemaname = 'public' and tablename = any($1::text[])
     order by tablename, indexname`,
    [tables]
  );
  const policies = await client.query(
    `select tablename as table_name, policyname, cmd
     from pg_policies
     where schemaname = 'public' and tablename = any($1::text[])
     order by tablename, policyname`,
    [tables]
  );

  const content = [
    "# Backup logico comercial pre-migracao",
    "",
    `Gerado em: ${new Date().toISOString()}`,
    "",
    "Este arquivo registra metadados e contagens antes da migracao comercial. Nao contem dados sensiveis, senhas, tokens ou connection string.",
    "",
    "## Contagens",
    "",
    mdTable(counts.rows, ["table_name", "row_count"]),
    "## Colunas",
    "",
    mdTable(columns.rows, ["table_name", "column_name", "data_type", "is_nullable", "column_default"]),
    "## Constraints",
    "",
    mdTable(constraints.rows, ["table_name", "conname", "contype"]),
    "## Indices",
    "",
    mdTable(indexes.rows, ["table_name", "indexname"]),
    "## Policies",
    "",
    mdTable(policies.rows, ["table_name", "policyname", "cmd"])
  ].join("\n");
  fs.writeFileSync(reportPath, content, "utf8");
}

async function verify() {
  const requiredColumns = [
    ["catalog_items", "commercial_guidance"],
    ["catalog_items", "billing_unit"],
    ["catalog_items", "payment_method"],
    ["catalog_items", "execution_deadline"],
    ["catalog_items", "internal_notes"],
    ["catalog_items", "created_by"],
    ["catalog_items", "updated_by"],
    ["catalog_items", "deleted_at"],
    ["catalog_items", "deleted_by"],
    ["nodere_proposals", "items"],
    ["nodere_proposals", "metadata"],
    ["nodere_proposals", "subtotal"],
    ["nodere_proposals", "discount"],
    ["nodere_proposals", "total"]
  ];
  const { rows } = await client.query(
    `select table_name, column_name
     from information_schema.columns
     where table_schema = 'public'
       and (table_name, column_name) in (${requiredColumns.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(",")})`,
    requiredColumns.flat()
  );
  const found = new Set(rows.map((row) => `${row.table_name}.${row.column_name}`));
  const missing = requiredColumns.filter(([table, column]) => !found.has(`${table}.${column}`));
  if (missing.length) {
    throw new Error(`Colunas ausentes apos migracao: ${missing.map(([table, column]) => `${table}.${column}`).join(", ")}`);
  }
}

try {
  await client.connect();
  await collectBackup();
  await client.query(migrationSql);
  await verify();
  console.log(`Backup logico criado: ${path.relative(root, reportPath)}`);
  console.log("Migracao comercial aplicada e schema validado.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
