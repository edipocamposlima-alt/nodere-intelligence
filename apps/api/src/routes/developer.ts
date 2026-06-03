import { Router } from "express";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getRequestWorkspaceId, requireWorkspaceRole } from "../middleware/session.js";
import { getSupabase } from "../db/supabase.js";
import { addNote, listCompaniesAsync, searchCompaniesWithMeta, updateCompany } from "../services/companyStore.js";
import { consumeSearch } from "../services/credits.js";

export const developerRouter = Router();
export const publicApiRouter = Router();

developerRouter.post("/keys", requireWorkspaceRole("owner", "admin"), async (req, res, next) => {
  try {
    const body = z.object({ name: z.string().min(2), scopes: z.array(z.string()).default(["leads:read"]) }).parse(req.body);
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado para API keys." });
    const rawKey = `ndr_${randomBytes(24).toString("base64url")}`;
    const row = {
      id: randomUUID(),
      workspace_id: getRequestWorkspaceId(req),
      name: body.name,
      key_hash: hashKey(rawKey),
      scopes: body.scopes,
      created_at: new Date().toISOString()
    };
    const { data, error } = await sb.from("api_keys").insert(row).select("id, name, scopes, created_at").single();
    if (error) throw error;
    res.status(201).json({ key: rawKey, record: data, warning: "Copie agora. Esta chave não será exibida novamente." });
  } catch (error) {
    next(error);
  }
});

developerRouter.delete("/keys/:id", requireWorkspaceRole("owner", "admin"), async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (sb) await sb.from("api_keys").delete().eq("id", req.params.id).eq("workspace_id", getRequestWorkspaceId(req));
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

publicApiRouter.use(async (req, res, next) => {
  try {
    const raw = String(req.headers["x-nodere-api-key"] || "");
    if (!raw) return res.status(401).json({ error: "Unauthorized" });
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: "API key storage unavailable" });
    const { data, error } = await sb.from("api_keys").select("*");
    if (error) throw error;
    const match = (data ?? []).find((row: any) => safeEqual(row.key_hash, hashKey(raw)));
    if (!match) return res.status(401).json({ error: "Unauthorized" });
    await sb.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", match.id);
    (req as any).session = { workspaceId: match.workspace_id, role: "operator", email: "api", userId: match.id };
    next();
  } catch (error) {
    next(error);
  }
});

publicApiRouter.get("/leads", async (req, res, next) => {
  try {
    const all = await listCompaniesAsync(getRequestWorkspaceId(req));
    const city = String(req.query.city || "").toLowerCase();
    const stage = String(req.query.stage || "");
    const minScore = Number(req.query.min_score || 0);
    res.json(all.filter((lead) =>
      (!city || lead.city.toLowerCase().includes(city)) &&
      (!stage || lead.status === stage) &&
      lead.score >= minScore
    ));
  } catch (error) {
    next(error);
  }
});

publicApiRouter.post("/leads", async (req, res) => {
  res.status(501).json({ message: "Criação direta via API pública será habilitada após validação de schema de escrita externa." });
});

publicApiRouter.patch("/leads/:id", async (req, res, next) => {
  try {
    const updated = await updateCompany(req.params.id, req.body, getRequestWorkspaceId(req));
    if (!updated) return res.status(404).json({ message: "Lead não encontrado." });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

publicApiRouter.patch("/leads/:id/stage", async (req, res, next) => {
  try {
    const updated = await updateCompany(req.params.id, { status: String(req.body?.stage || "Novo Lead") as any }, getRequestWorkspaceId(req));
    if (!updated) return res.status(404).json({ message: "Lead não encontrado." });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

publicApiRouter.post("/leads/:id/notes", async (req, res, next) => {
  try {
    const note = await addNote(req.params.id, String(req.body?.body || ""), getRequestWorkspaceId(req));
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

publicApiRouter.get("/search", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    await consumeSearch(String(req.query.segment || req.query.companyName || "API search"), workspaceId);
    res.json(await searchCompaniesWithMeta({
      companyName: String(req.query.companyName || ""),
      segment: String(req.query.segment || ""),
      city: String(req.query.city || ""),
      state: String(req.query.state || ""),
      keyword: String(req.query.keyword || ""),
      limit: Number(req.query.limit || 20)
    }, workspaceId));
  } catch (error) {
    next(error);
  }
});

function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
