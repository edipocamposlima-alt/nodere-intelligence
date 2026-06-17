import { cookies } from "next/headers";

export async function getServerSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get("nodere_session")?.value || cookieStore.get("nodere-session")?.value || null;
}
