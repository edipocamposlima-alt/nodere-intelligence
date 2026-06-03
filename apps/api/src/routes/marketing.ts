import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId } from "../middleware/session.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    return res.json(await listCampaigns(getRequestWorkspaceId(req)));
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    return res.status(201).json(await createCampaign(getRequestWorkspaceId(req), req.body));
  } catch (error) {
    return next(error);
  }
});

router.get("/templates", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase()
      .from("message_templates")
      .select("*")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) {
    return next(error);
  }
});

router.post("/templates", async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2),
      channel: z.enum(["whatsapp", "email", "linkedin"]).default("whatsapp"),
      subject: z.string().optional().nullable(),
      body: z.string().min(2),
      variables: z.array(z.string()).optional()
    }).parse(req.body);
    const row = { id: randomUUID(), workspace_id: getRequestWorkspaceId(req), ...body };
    const { data, error } = await requireSupabase().from("message_templates").insert(row).select("*").single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
});

router.get("/campaigns", async (req, res, next) => {
  try {
    return res.json(await listCampaigns(getRequestWorkspaceId(req)));
  } catch (error) {
    return next(error);
  }
});

router.post("/campaigns", async (req, res, next) => {
  try {
    return res.status(201).json(await createCampaign(getRequestWorkspaceId(req), req.body));
  } catch (error) {
    return next(error);
  }
});

router.get("/social/status", (_req, res) => res.json(buildSocialStatus()));
router.get("/status", (_req, res) => res.json(buildSocialStatus()));

function requireSupabase() {
  const sb = getSupabase();
  if (!sb) {
    const error = new Error("Supabase não configurado para marketing.") as Error & { status?: number; code?: string };
    error.status = 503;
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  return sb;
}

async function listCampaigns(workspaceId: string) {
  const { data, error } = await requireSupabase()
    .from("campaigns")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function createCampaign(workspaceId: string, input: unknown) {
  const body = z.object({
    name: z.string().min(2),
    platforms: z.array(z.string()).default([]),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    status: z.string().default("draft"),
    budgetBrl: z.coerce.number().optional().nullable(),
    notes: z.string().optional().nullable()
  }).parse(input);
  const row = {
    id: randomUUID(),
    workspace_id: workspaceId,
    name: body.name,
    platforms: body.platforms,
    start_date: body.startDate,
    end_date: body.endDate,
    status: body.status,
    budget_brl: body.budgetBrl,
    notes: body.notes
  };
  const { data, error } = await requireSupabase().from("campaigns").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

function buildSocialStatus() {
  const platforms = [
    { key: "instagram", name: "Instagram", configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET), requiredEnv: ["META_APP_ID", "META_APP_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"] },
    { key: "facebook", name: "Facebook", configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET), requiredEnv: ["META_APP_ID", "META_APP_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"] },
    { key: "linkedin", name: "LinkedIn", configured: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET), requiredEnv: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"] },
    { key: "google-business", name: "Google Meu Negócio", configured: Boolean(process.env.GOOGLE_BUSINESS_CLIENT_ID && process.env.GOOGLE_BUSINESS_CLIENT_SECRET), requiredEnv: ["GOOGLE_BUSINESS_CLIENT_ID", "GOOGLE_BUSINESS_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"] }
  ];
  return {
    platforms,
    mlabs: {
      configured: true,
      type: "workflow_shortcut",
      url: "https://app.mlabs.com.br",
      message: "mLabs não possui API pública para terceiros; use como atalho operacional."
    }
  };
}

export default router;
