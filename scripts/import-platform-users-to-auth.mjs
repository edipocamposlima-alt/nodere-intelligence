import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] ??= value;
  }
}

loadEnvFile(path.join(rootDir, ".env"));
loadEnvFile(path.join(rootDir, "apps", "api", ".env"));

const require = createRequire(import.meta.url);
const { createClient } = require(path.join(rootDir, "apps", "api", "node_modules", "@supabase", "supabase-js"));

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const frontendUrl = process.env.FRONTEND_URL ?? "https://nodere.com.br";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de importar usuarios.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function friendlyError(error) {
  if (!error) return "Erro desconhecido";
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error) return String(error.message);
  return String(error);
}

const { data: users, error: listError } = await supabase
  .from("nodere_platform_users")
  .select("id, workspace_id, name, email, role, active, auth_user_id")
  .eq("active", true)
  .is("auth_user_id", null)
  .order("created_at", { ascending: true });

if (listError) {
  throw new Error(`Erro ao listar usuarios pendentes: ${listError.message}`);
}

console.log(`Usuarios ativos pendentes de importacao: ${users?.length ?? 0}`);

let imported = 0;
let failed = 0;

async function findAuthUserByEmail(email) {
  const normalized = email.toLowerCase();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data.users.find((authUser) => authUser.email?.toLowerCase() === normalized);
    if (found) return found;
    if (data.users.length < perPage) return null;

    page += 1;
  }
}

for (const user of users ?? []) {
  try {
    if (!user.email) {
      throw new Error("Usuario sem email.");
    }

    const tempPassword = `${crypto.randomBytes(24).toString("base64url")}A1!`;
    let authUser = await findAuthUserByEmail(user.email);

    if (!authUser) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role,
          workspace_id: user.workspace_id,
          legacy_platform_user_id: user.id
        }
      });

      if (createError) throw createError;
      if (!created.user?.id) throw new Error("Supabase Auth nao retornou o ID do usuario criado.");
      authUser = created.user;
    }

    const { error: updateError } = await supabase
      .from("nodere_platform_users")
      .update({
        auth_user_id: authUser.id,
        auth_imported_at: new Date().toISOString(),
        auth_import_error: null
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    const { error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
      options: {
        redirectTo: `${frontendUrl}/app/reset-password`
      }
    });

    if (linkError) throw linkError;

    imported += 1;
    console.log(`OK ${user.email} -> ${authUser.id}`);
  } catch (error) {
    failed += 1;
    const message = friendlyError(error);

    await supabase
      .from("nodere_platform_users")
      .update({ auth_import_error: message })
      .eq("id", user.id);

    console.error(`FALHA ${user.email ?? user.id}: ${message}`);
  }
}

console.log(`Importacao concluida. Sucesso: ${imported}. Falhas: ${failed}.`);
