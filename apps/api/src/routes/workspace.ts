import { Router } from "express";
import { z } from "zod";
import { getRequestWorkspaceId, requireWorkspaceSession } from "../middleware/session.js";
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

export default router;
