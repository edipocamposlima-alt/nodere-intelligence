import { Router } from "express";
import { getAuditLog } from "../services/auditLog.js";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { getSupabase, hasSupabase } from "../db/supabase.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(500, Number(req.query.limit ?? 100));
    const workspaceId = getRequestWorkspaceId(req);
    if (hasSupabase()) {
      const query = getSupabase()!
        .from("activity_logs")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return res.json((data ?? []).map((row: any) => ({
        id: row.id,
        category: row.entity_type || "system",
        action: row.action,
        description: row.metadata?.description || row.action,
        operatorId: row.user_id,
        metadata: row.metadata || {},
        at: row.created_at
      })));
    }
    return res.json(getAuditLog(limit));
  } catch (error) {
    const text = error instanceof Error ? error.message : JSON.stringify(error);
    if (text.includes("activity_logs") || text.includes("Could not find the table") || text.includes("42P01")) {
      return res.json(getAuditLog(Math.min(500, Number(req.query.limit ?? 100))));
    }
    return next(error);
  }
});

router.get("/downloads", async (req, res, next) => {
  try {
    const limit = Math.min(500, Number(req.query.limit ?? 100));
    const workspaceId = getRequestWorkspaceId(req);
    if (!hasSupabase()) return res.json([]);
    const { data, error } = await getSupabase()!
      .from("download_logs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return res.json((data ?? []).map((row: any) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      userId: row.user_id,
      fileType: row.file_type,
      fileName: row.file_name,
      metadata: row.metadata || {},
      createdAt: row.created_at
    })));
  } catch (error) {
    const text = error instanceof Error ? error.message : JSON.stringify(error);
    if (text.includes("download_logs") || text.includes("Could not find the table") || text.includes("42P01")) {
      return res.json([]);
    }
    return next(error);
  }
});

export default router;
