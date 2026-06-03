import { Router } from "express";
import { z } from "zod";
import { getRequestWorkspaceId, requireWorkspaceRole, requireWorkspaceSession } from "../middleware/session.js";
import { getSupabase } from "../db/supabase.js";
import { ensureSupabaseAuthUser, listWorkspaceUsers } from "../services/userStore.js";
import { getCreditStatus } from "../services/credits.js";

const router = Router();

router.get("/me", requireWorkspaceSession, async (req, res, next) => {
  try {
    const session = (req as any).session;
    const workspaceId = getRequestWorkspaceId(req);
    const sb = getSupabase();
    const workspace = sb
      ? await sb.from("nodere_workspaces").select("id, name, owner_email, plan, credits, expires_at, created_at, updated_at").eq("id", workspaceId).maybeSingle()
      : { data: null };

    res.json({
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        workspaceId
      },
      workspace: workspace.data ?? {
        id: workspaceId,
        name: "Workspace NODERE",
        plan: "trial"
      },
      credits: await getCreditStatus(workspaceId),
      members: await listWorkspaceUsers(workspaceId)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireWorkspaceSession, async (req, res, next) => {
  try {
    const session = (req as any).session;
    const body = z.object({
      name: z.string().min(2).default("Workspace NODERE")
    }).parse(req.body ?? {});
    const user = await ensureSupabaseAuthUser({
      authUserId: session.userId || session.email,
      email: session.email,
      name: session.email,
      workspaceName: body.name
    });
    const sb = getSupabase();
    if (sb) {
      await sb.from("nodere_workspaces").update({
        name: body.name,
        updated_at: new Date().toISOString()
      }).eq("id", user.workspaceId);
    }
    res.status(201).json({ user, message: "Workspace criado e vinculado ao usuário." });
  } catch (error) {
    next(error);
  }
});

router.patch("/onboarding", requireWorkspaceSession, async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const sb = getSupabase();
    if (sb) {
      await sb.from("nodere_workspaces").update({ onboarding_completed: true, updated_at: new Date().toISOString() }).eq("id", workspaceId);
    }
    res.json({ ok: true, onboarding_completed: true });
  } catch (error) {
    next(error);
  }
});

router.get("/branding", async (req, res, next) => {
  try {
    const domain = String(req.query.domain || req.headers.host || "").replace(/^www\./, "");
    const sb = getSupabase();
    if (!sb) return res.json(defaultBranding());
    let query = sb.from("nodere_workspaces").select("id, name, plan, wl_domain, wl_name, wl_logo_url, wl_primary_color, wl_enabled");
    if (domain) query = query.eq("wl_domain", domain);
    else query = query.eq("id", getRequestWorkspaceId(req));
    const { data } = await query.maybeSingle();
    if (!data || !data.wl_enabled) return res.json(defaultBranding());
    res.json({
      workspaceId: data.id,
      name: data.wl_name || data.name || "NODERE Intelligence",
      logoUrl: data.wl_logo_url || "/nodere-wordmark.png",
      primaryColor: data.wl_primary_color || "#1E6FDB",
      enabled: Boolean(data.wl_enabled)
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/branding", requireWorkspaceRole("owner", "admin"), async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado." });
    const current = await sb.from("nodere_workspaces").select("plan").eq("id", workspaceId).maybeSingle();
    if (current.data?.plan !== "agency") {
      return res.status(402).json({ message: "White-label disponível no plano Agency." });
    }
    const body = z.object({
      wl_domain: z.string().optional(),
      wl_name: z.string().optional(),
      wl_logo_url: z.string().url().optional(),
      wl_primary_color: z.string().optional(),
      wl_enabled: z.boolean().optional()
    }).parse(req.body);
    const { data, error } = await sb.from("nodere_workspaces").update({ ...body, updated_at: new Date().toISOString() }).eq("id", workspaceId).select("*").single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

function defaultBranding() {
  return {
    name: "NODERE Intelligence",
    logoUrl: "/nodere-wordmark.png",
    primaryColor: "#1E6FDB",
    enabled: false
  };
}

export default router;
