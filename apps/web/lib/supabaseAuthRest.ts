const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseAuthConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function missingSupabaseAuthVars() {
  return [
    !SUPABASE_URL ? "NEXT_PUBLIC_SUPABASE_URL" : "",
    !SUPABASE_ANON_KEY ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : ""
  ].filter(Boolean);
}

export function assertSupabaseAuthConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("[NODERI] NEXT_PUBLIC_SUPABASE_URL is not set. Check your environment variables.");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("[NODERI] NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Check your environment variables.");
  }
}

async function supabaseAuthFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const missing = missingSupabaseAuthVars();
  if (missing.length) {
    throw new Error(`Supabase Auth não configurado no frontend. Variável ausente: ${missing.join(", ")}.`);
  }
  const anonKey = SUPABASE_ANON_KEY as string;
  const response = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.msg || payload?.message || payload?.error_description || `Supabase Auth HTTP ${response.status}`);
  }
  return payload as T;
}

export function signInWithPassword(email: string, password: string) {
  return supabaseAuthFetch<{ access_token: string; user?: { email?: string } }>(
    "/token?grant_type=password",
    { email, password }
  );
}

export function signUpWithPassword(email: string, password: string, name: string) {
  return supabaseAuthFetch<{ access_token?: string; user?: { email?: string } }>(
    "/signup",
    { email, password, data: { name } }
  );
}

export function sendPasswordRecovery(email: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nodere-api.onrender.com";
  return fetch(`${apiUrl.replace(/\/+$/, "")}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || `Backend HTTP ${response.status}`);
    return payload as { message?: string };
  });
}

export async function updatePasswordWithRecoveryToken(token: string, password: string) {
  const missing = missingSupabaseAuthVars();
  if (missing.length) {
    throw new Error(`Supabase Auth não configurado no frontend. Variável ausente: ${missing.join(", ")}.`);
  }
  const anonKey = SUPABASE_ANON_KEY as string;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ password })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.msg || payload?.message || payload?.error_description || `Supabase Auth HTTP ${response.status}`);
  }
  return payload as { user?: { email?: string } };
}



