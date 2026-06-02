const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseAuthConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

async function supabaseAuthFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase Auth não configurado no frontend.");
  }
  const response = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
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
  return supabaseAuthFetch<{ message?: string }>(
    "/recover",
    { email, redirect_to: `${typeof window !== "undefined" ? window.location.origin : ""}/login` }
  );
}
