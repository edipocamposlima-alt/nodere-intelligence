import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const requireFromApi = createRequire(path.join(root, "apps", "api", "package.json"));

loadEnvFiles([".env", ".env.local", ".env.production", "apps/api/.env", "apps/api/.env.local", "apps/api/.env.production", "apps/web/.env.local"]);

const checks = [];
const failures = [];

const tableChecks = [
  {
    table: "nodere_companies",
    required: [
      ["segmento", ["category"]],
      ["empresa", ["name"]],
      ["cidade", ["city"]],
      ["estado", ["state"]],
      ["CNPJ", ["cnpj"]],
      ["telefone", ["phone", "telefone_principal"]],
      ["email", ["email_principal", "email_comercial"]],
      ["site", ["website"]],
      ["avaliacao", ["rating"]],
      ["avaliacoes", ["review_count"]],
      ["score", ["score", "score_comercial"]],
      ["maps", ["maps_url"]],
      ["resumo_sobre_a_empresa", ["resumo", "business_summary", "resumo_sobre_empresa"]],
      ["place_id", ["place_id", "google_place_id", "id"]],
      ["workspace_id", ["workspace_id"]],
      ["status", ["status"]],
      ["created_at", ["created_at"]],
      ["updated_at", ["updated_at"]]
    ]
  },
  {
    table: "nodere_searches",
    required: [
      ["workspace_id", ["workspace_id"]],
      ["city", ["city"]],
      ["state", ["state"]],
      ["segment", ["segment"]],
      ["results_count", ["results_count"]],
      ["created_at", ["created_at"]]
    ]
  },
  {
    table: "catalog_items",
    required: [
      ["workspace_id", ["workspace_id"]],
      ["name", ["name"]],
      ["type", ["type"]],
      ["status", ["status"]],
      ["price", ["price"]],
      ["commercial_guidance", ["commercial_guidance"]],
      ["created_at", ["created_at"]],
      ["updated_at", ["updated_at"]]
    ]
  },
  {
    table: "nodere_proposals",
    required: [
      ["workspace_id", ["workspace_id"]],
      ["lead_id", ["lead_id"]],
      ["items", ["items"]],
      ["metadata", ["metadata"]],
      ["subtotal", ["subtotal"]],
      ["discount", ["discount"]],
      ["total", ["total"]],
      ["created_at", ["created_at"]],
      ["updated_at", ["updated_at"]]
    ]
  },
  {
    table: "nodere_audit_logs",
    required: [
      ["workspace_id", ["workspace_id"]],
      ["resource_type", ["resource_type"]],
      ["resource_id", ["resource_id"]],
      ["action", ["action"]],
      ["created_at", ["created_at"]]
    ]
  },
  {
    table: "nodere_app_settings",
    required: [
      ["workspace_id", ["workspace_id"]],
      ["settings", ["settings"]],
      ["updated_at", ["updated_at"]]
    ]
  }
];

const databaseUrl = process.env.COMMERCIAL_DATABASE_URL || process.env.DATABASE_URL || "";
const supabaseUrl = process.env.COMMERCIAL_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.COMMERCIAL_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const databaseHost = safeHost(databaseUrl);
const supabaseHost = safeHost(supabaseUrl);
console.log(`Schema validator: database_url=${databaseUrl ? "present" : "absent"} host=${databaseHost || "n/a"}`);
console.log(`Schema validator: supabase_url=${supabaseUrl ? "present" : "absent"} host=${supabaseHost || "n/a"} key=${supabaseKey ? "present" : "absent"}`);

let mode = "";
if (databaseUrl && databaseHost && !["localhost", "127.0.0.1", "::1"].includes(databaseHost)) {
  mode = "postgres";
  await validateWithPostgres(databaseUrl);
} else if (supabaseUrl && supabaseKey) {
  mode = "supabase-rest";
  await validateWithSupabaseRest(supabaseUrl, supabaseKey);
} else {
  fail("environment", "Nenhuma conexao remota disponivel. Configure DATABASE_URL remoto ou SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

console.log(`Schema validator mode: ${mode || "none"}`);
for (const item of checks) console.log(`${item.ok ? "OK" : "FAIL"} ${item.name}${item.detail ? ` - ${item.detail}` : ""}`);

if (failures.length) {
  console.error(`Schema validation failed: ${failures.length} erro(s).`);
  process.exit(1);
}

console.log("Schema validation approved.");

function loadEnvFiles(files) {
  for (const relative of files) {
    const full = path.join(root, relative);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, raw] = match;
      if (process.env[key]) continue;
      let value = raw.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[key] = value;
    }
  }
}

async function validateWithPostgres(url) {
  const { Client } = requireFromApi("pg");
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const check of tableChecks) {
      const columns = await client.query(
        `select column_name from information_schema.columns where table_schema = 'public' and table_name = $1`,
        [check.table]
      );
      const set = new Set(columns.rows.map((row) => row.column_name));
      validateColumnAliases(check, set);
    }
    await validateIndexesWithPostgres(client);
    await validateRlsWithPostgres(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function validateWithSupabaseRest(url, key) {
  for (const check of tableChecks) {
    const selectedAliases = check.required.map(([_, aliases]) => aliases[0]);
    const endpoint = `${url.replace(/\/+$/, "")}/rest/v1/${check.table}?select=${encodeURIComponent(selectedAliases.join(","))}&limit=1`;
    const response = await fetch(endpoint, {
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`
      }
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      for (const [label, aliases] of check.required) ok(`${check.table}.${label}`, aliases[0]);
      continue;
    }
    const details = JSON.stringify(body);
    if (response.status === 401 || response.status === 403) {
      fail(check.table, `Sem permissao para validar via REST HTTP ${response.status}. Use SUPABASE_SERVICE_ROLE_KEY ou DATABASE_URL remoto.`);
      continue;
    }
    if (details.includes("Could not find") || details.includes("column") || body.code === "42703" || body.code === "PGRST204") {
      await validateSupabaseColumnsIndividually(url, key, check);
      continue;
    }
    fail(check.table, `REST HTTP ${response.status}: ${sanitize(details)}`);
  }
}

async function validateSupabaseColumnsIndividually(url, key, check) {
  for (const [label, aliases] of check.required) {
    let found = "";
    const errors = [];
    for (const column of aliases) {
      const endpoint = `${url.replace(/\/+$/, "")}/rest/v1/${check.table}?select=${encodeURIComponent(column)}&limit=1`;
      const response = await fetch(endpoint, {
        headers: {
          apikey: key,
          authorization: `Bearer ${key}`
        }
      });
      if (response.ok) {
        found = column;
        break;
      }
      const body = await response.json().catch(() => ({}));
      errors.push(`${column}:${body.code || response.status}`);
    }
    if (found) ok(`${check.table}.${label}`, found);
    else fail(`${check.table}.${label}`, `aliases ausentes ou inacessiveis: ${errors.join(", ")}`);
  }
}

function validateColumnAliases(check, columns) {
  for (const [label, aliases] of check.required) {
    const found = aliases.find((column) => columns.has(column));
    if (found) ok(`${check.table}.${label}`, found);
    else fail(`${check.table}.${label}`, `nenhum alias encontrado: ${aliases.join(" | ")}`);
  }
}

async function validateIndexesWithPostgres(client) {
  const requiredIndexes = [
    "idx_companies_workspace",
    "idx_companies_city_state",
    "idx_companies_score",
    "idx_searches_workspace",
    "idx_catalog_items_commercial_active",
    "idx_nodere_proposals_commercial_snapshot",
    "idx_nodere_audit_logs_proposal_actions"
  ];
  const rows = await client.query(
    `select indexname from pg_indexes where schemaname = 'public' and indexname = any($1::text[])`,
    [requiredIndexes]
  );
  const set = new Set(rows.rows.map((row) => row.indexname));
  for (const name of requiredIndexes) {
    if (set.has(name)) ok(`index.${name}`, "present");
    else fail(`index.${name}`, "ausente");
  }
}

async function validateRlsWithPostgres(client) {
  const requiredTables = ["nodere_companies", "catalog_items", "nodere_proposals", "nodere_audit_logs"];
  const rows = await client.query(
    `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relname = any($1::text[])`,
    [requiredTables]
  );
  const map = new Map(rows.rows.map((row) => [row.relname, row.relrowsecurity]));
  for (const table of requiredTables) {
    if (map.get(table) === true) ok(`rls.${table}`, "enabled");
    else fail(`rls.${table}`, "RLS nao habilitado ou tabela ausente");
  }
}

function ok(name, detail = "") {
  checks.push({ name, ok: true, detail });
}

function fail(name, detail = "") {
  checks.push({ name, ok: false, detail });
  failures.push({ name, detail });
}

function safeHost(value) {
  try {
    if (!value) return "";
    const normalized = value.startsWith("postgres") || value.startsWith("http") ? value : `https://${value}`;
    return new URL(normalized).hostname;
  } catch {
    return "";
  }
}

function sanitize(value) {
  return String(value || "").replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[secret]").replace(/(apikey["']?\s*[:=]\s*["']?)[A-Za-z0-9._-]+/gi, "$1[secret]").slice(0, 500);
}
