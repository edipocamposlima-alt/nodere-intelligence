import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const requireFromApi = createRequire(path.join(root, "apps", "api", "package.json"));
const { Client } = requireFromApi("pg");

const databaseUrl = process.env.PUBLICATION_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("PUBLICATION_DATABASE_URL ou DATABASE_URL ausente.");
  process.exit(1);
}

const host = safeHost(databaseUrl);
console.log(`Publication schema fixes: database_url=present host=${host || "n/a"}`);
if (!host || ["localhost", "127.0.0.1", "::1"].includes(host)) {
  console.error("Banco local detectado. Informe a URL remota do Supabase somente em memoria da sessao.");
  process.exit(1);
}

const migrationPath = path.join(root, "packages", "database", "block_publicacao_campos_comerciais.sql");
const sql = fs.readFileSync(migrationPath, "utf8");
const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  console.log("Publication schema fixes applied.");
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
} finally {
  await client.end().catch(() => undefined);
}

function safeHost(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}
