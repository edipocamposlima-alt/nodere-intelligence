import { Router } from "express";
import { getSupabase, hasSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId, requireWorkspaceRole } from "../middleware/session.js";

const router = Router();

const INTEGRATION_KEYS = [
  "openai_key",
  "google_places_key",
  "apollo_key",
  "smtp_host",
  "smtp_port",
  "smtp_user",
  "smtp_pass",
  "smtp_from",
  "whatsapp_token",
  "whatsapp_phone_id"
];

function requireSupabase() {
  if (!hasSupabase()) {
    const error = new Error("Supabase não configurado no backend.") as Error & { status?: number };
    error.status = 503;
    throw error;
  }
  return getSupabase()!;
}

function maskSecret(value: string) {
  if (!value) return "";
  return value.length > 8 ? `${value.slice(0, 4)}****${value.slice(-4)}` : "****";
}

router.patch("/workspace", requireWorkspaceRole("admin", "owner"), async (req, res) => {
  const allowed = ["name", "website", "phone", "segment", "address", "timezone", "currency"];
  const updates: Record<string, unknown> = {};
  for (const field of allowed) {
    if (req.body?.[field] !== undefined) updates[field] = req.body[field];
  }
  updates.updated_at = new Date().toISOString();

  try {
    const sb = requireSupabase();
    const { error } = await sb.from("nodere_workspaces").update(updates).eq("id", getRequestWorkspaceId(req));
    if (error) throw error;
    return res.json({ message: "Workspace atualizado." });
  } catch (error) {
    console.error("[settings/workspace]", error);
    const status = (error as { status?: number }).status || 500;
    return res.status(status).json({ error: "Erro ao salvar configurações." });
  }
});

router.get("/integrations", requireWorkspaceRole("admin", "owner"), async (req, res) => {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("nodere_workspace_settings")
      .select("key, masked_value")
      .eq("workspace_id", getRequestWorkspaceId(req));
    if (error) throw error;
    const result: Record<string, string> = {};
    for (const row of data || []) {
      result[String(row.key)] = String(row.masked_value || "");
    }
    return res.json(result);
  } catch (error) {
    console.error("[settings/integrations/get]", error);
    const status = (error as { status?: number }).status || 500;
    return res.status(status).json({ error: "Erro ao carregar configurações." });
  }
});

router.patch("/integrations", requireWorkspaceRole("admin", "owner"), async (req, res) => {
  try {
    const sb = requireSupabase();
    const workspaceId = getRequestWorkspaceId(req);
    for (const key of INTEGRATION_KEYS) {
      if (req.body?.[key] === undefined) continue;
      const value = String(req.body[key] || "");
      const { error } = await sb.from("nodere_workspace_settings").upsert({
        workspace_id: workspaceId,
        key,
        value,
        masked_value: maskSecret(value),
        updated_at: new Date().toISOString()
      }, { onConflict: "workspace_id,key" });
      if (error) throw error;
    }
    return res.json({ message: "Integrações salvas." });
  } catch (error) {
    console.error("[settings/integrations/patch]", error);
    const status = (error as { status?: number }).status || 500;
    return res.status(status).json({ error: "Erro ao salvar integrações." });
  }
});

async function getIntegrationValue(workspaceId: string, key: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("nodere_workspace_settings")
    .select("value")
    .eq("workspace_id", workspaceId)
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return typeof data?.value === "string" ? data.value : "";
}

router.get("/test/openai", requireWorkspaceRole("admin", "owner"), async (req, res) => {
  try {
    const value = await getIntegrationValue(getRequestWorkspaceId(req), "openai_key");
    if (!value) return res.status(400).json({ error: "Chave OpenAI não configurada." });
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${value}` }
    });
    if (!response.ok) return res.status(400).json({ error: "Chave inválida ou sem acesso." });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Erro ao testar conexão OpenAI." });
  }
});

router.get("/test/google", requireWorkspaceRole("admin", "owner"), async (req, res) => {
  try {
    const value = await getIntegrationValue(getRequestWorkspaceId(req), "google_places_key");
    if (!value) return res.status(400).json({ error: "Chave Google não configurada." });
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=test&key=${value}`);
    const json = await response.json() as { status?: string };
    if (json.status === "REQUEST_DENIED") return res.status(400).json({ error: "Chave inválida." });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Erro ao testar Google Places." });
  }
});

router.get("/test/apollo", requireWorkspaceRole("admin", "owner"), async (req, res) => {
  try {
    const value = await getIntegrationValue(getRequestWorkspaceId(req), "apollo_key");
    if (!value) return res.status(400).json({ error: "Chave Apollo não configurada." });
    const response = await fetch("https://api.apollo.io/v1/auth/health", {
      headers: { "X-Api-Key": value }
    });
    if (!response.ok) return res.status(400).json({ error: "Chave Apollo inválida." });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Erro ao testar Apollo.io." });
  }
});

export default router;
