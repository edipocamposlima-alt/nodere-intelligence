import { Router } from "express";
import { z } from "zod";
import { getRequestWorkspaceId, isPrivilegedSession, requireWorkspaceRole, requireWorkspaceSession } from "../middleware/session.js";
import { getSupabase } from "../db/supabase.js";
import { ensureSupabaseAuthUser, listWorkspaceUsers } from "../services/userStore.js";
import { getCreditStatus } from "../services/credits.js";
import { PREDEFINED_SEGMENTS } from "../constants/segments.js";

const router = Router();

router.get("/me", requireWorkspaceSession, async (req, res, next) => {
  try {
    const session = (req as any).session;
    const workspaceId = getRequestWorkspaceId(req);
    const sb = getSupabase();
    const workspace = sb
      ? await sb.from("nodere_workspaces").select("id, name, owner_email, plan, credits, expires_at, created_at, updated_at").eq("id", workspaceId).maybeSingle()
      : { data: null };
    const members = await listWorkspaceUsers(workspaceId);
    const member = members.find((item) => item.email === session.email);

    res.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name || member?.name || session.email,
        role: session.role,
        workspaceId
      },
      workspace: workspace.data ?? {
        id: workspaceId,
        name: "Workspace NODERE",
        plan: "trial"
      },
      credits: isPrivilegedSession(req)
        ? {
            total: 999999,
            used: 0,
            remaining: 999999,
            plan: "Owner/Admin",
            expires_at: null,
            trial_expires_at: null,
            renewal_at: null,
            resetAt: "",
            blocked: false,
            trialExpired: false,
            privileged: true
          }
        : await getCreditStatus(workspaceId),
      members
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

router.get("/segments", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const sb = getSupabase();
    let custom: string[] = [];
    if (sb) {
      const { data, error } = await sb.from("nodere_workspaces").select("custom_segments").eq("id", workspaceId).maybeSingle();
      if (!error && Array.isArray(data?.custom_segments)) custom = data.custom_segments;
    }
    const segments = Array.from(new Set([...PREDEFINED_SEGMENTS, ...custom.map((item) => String(item).trim()).filter(Boolean)])).sort((a, b) => a.localeCompare(b));
    res.json({ segments, predefined: PREDEFINED_SEGMENTS, custom });
  } catch (error) {
    next(error);
  }
});

router.post("/segments", requireWorkspaceSession, async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const segment = String(req.body?.segment || "").trim();
    if (!segment || segment.length < 2) return res.status(400).json({ message: "Informe um segmento válido." });
    if (segment.length > 80) return res.status(400).json({ message: "Segmento deve ter até 80 caracteres." });
    const sb = getSupabase();
    let custom = [segment];
    if (sb) {
      const current = await sb.from("nodere_workspaces").select("custom_segments").eq("id", workspaceId).maybeSingle();
      const currentSegments = Array.isArray(current.data?.custom_segments) ? current.data.custom_segments.map(String) : [];
      custom = Array.from(new Set([...currentSegments, segment])).slice(-120);
      const { error } = await sb.from("nodere_workspaces").update({ custom_segments: custom, updated_at: new Date().toISOString() }).eq("id", workspaceId);
      if (error) throw error;
    }
    const segments = Array.from(new Set([...PREDEFINED_SEGMENTS, ...custom])).sort((a, b) => a.localeCompare(b));
    res.status(201).json({ segments, predefined: PREDEFINED_SEGMENTS, custom });
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
      name: data.wl_name || data.name || "NODERE Nexus",
      logoUrl: data.wl_logo_url || "/logo-nodere-full.png",
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
    name: "NODERE Nexus",
    logoUrl: "/logo-nodere-full.png",
    primaryColor: "#1E6FDB",
    enabled: false
  };
}

export default router;

