import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiRequire = createRequire(path.join(root, "apps", "api", "package.json"));
const pg = apiRequire("pg");

const envPath = path.join(root, "apps", "api", ".env");
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
  if (!match) continue;
  const [, key, rawValue] = match;
  if (process.env[key] !== undefined) continue;
  process.env[key] = rawValue.replace(/^["']|["']$/g, "");
}

const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL ausente em apps/api/.env.");
  process.exit(1);
}

const schemaPath = path.join(root, "apps", "api", "src", "db", "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

function normalizeDatabaseUrl(rawUrl) {
  const dbUrl = new URL(rawUrl);
  const decodedPassword = decodeURIComponent(dbUrl.password);
  if (decodedPassword.startsWith("[") && decodedPassword.endsWith("]")) {
    dbUrl.password = decodedPassword.slice(1, -1);
    console.log("DATABASE_URL normalizada: senha estava envolvida por colchetes.");
  }
  return dbUrl.toString();
}

function directSupabaseUrlFromPooler(rawUrl) {
  if (!supabaseUrl) return null;
  const dbUrl = new URL(rawUrl);
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const password = decodeURIComponent(dbUrl.password);
  if (!projectRef || !password) return null;
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
}

async function createConnectedClient(rawUrl) {
  const normalizedUrl = normalizeDatabaseUrl(rawUrl);
  const urls = [normalizedUrl];
  const sessionPoolerUrl = normalizedUrl.replace(":6543/", ":5432/");
  if (sessionPoolerUrl !== normalizedUrl && !urls.includes(sessionPoolerUrl)) urls.push(sessionPoolerUrl);
  const directUrl = directSupabaseUrlFromPooler(normalizedUrl);
  if (directUrl && !urls.includes(directUrl)) urls.push(directUrl);

  let lastError;
  for (const url of urls) {
    const client = new pg.Client({
      connectionString: url,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log(`Conectado ao Postgres via ${url.includes(".pooler.") ? `Supabase pooler:${new URL(url).port}` : "Supabase direct"}.`);
      return client;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Falha na conexao ${url.includes(".pooler.") ? `Supabase pooler:${new URL(url).port}` : "Supabase direct"}: ${message}`);
      await client.end().catch(() => undefined);
    }
  }
  throw lastError;
}

let client;

try {
  client = await createConnectedClient(databaseUrl);
  await client.query(schema);
  const checks = [
    "nodere_workspaces",
    "nodere_platform_users",
    "nodere_companies",
    "nodere_company_notes",
    "nodere_searches",
    "nodere_operators",
    "nodere_operator_goals",
    "nodere_app_settings"
  ];
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1::text[]) order by table_name",
    [checks]
  );
  const found = new Set(rows.map((row) => row.table_name));
  const missing = checks.filter((name) => !found.has(name));
  if (missing.length) {
    console.error(`Schema aplicado parcialmente. Tabelas ausentes: ${missing.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log(`Schema NODERE aplicado com sucesso. Tabelas verificadas: ${checks.join(", ")}`);
  }
} catch (error) {
  console.error("Falha ao aplicar schema NODERE:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client?.end().catch(() => undefined);
}
