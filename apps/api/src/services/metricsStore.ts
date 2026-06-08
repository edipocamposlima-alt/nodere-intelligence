import { Request } from "express";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId } from "../middleware/session.js";

type MetricAction =
  | "search_performed"
  | "company_saved"
  | "crm_stage_changed"
  | "meeting_scheduled"
  | "proposal_generated"
  | "communication_logged";

export function getMetricUserId(request: Request) {
  const session = (request as any).session;
  return String(session?.userId || session?.email || "system");
}

export function logMetric(
  workspaceId: string,
  userId: string | undefined,
  action: MetricAction,
  entityId: string | null = null,
  metadata: Record<string, unknown> = {}
) {
  const sb = getSupabase();
  if (!sb) return;
  const safeUserId = userId || "system";
  void (async () => {
    try {
      const { error } = await sb.from("user_metrics").insert({
        workspace_id: workspaceId || "default",
        user_id: safeUserId,
        action,
        entity_id: entityId,
        metadata
      });
      if (error) {
        console.warn("[METRICS] user_metrics insert skipped:", error.message);
      }
    } catch (error) {
      console.warn("[METRICS] user_metrics insert failed:", error instanceof Error ? error.message : error);
    }
  })();
}

export function logRequestMetric(
  request: Request,
  action: MetricAction,
  entityId: string | null = null,
  metadata: Record<string, unknown> = {}
) {
  logMetric(getRequestWorkspaceId(request), getMetricUserId(request), action, entityId, metadata);
}

export async function getUserMetrics(workspaceId: string, sinceIso: string) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("user_metrics")
    .select("user_id, action, metadata, entity_id, created_at")
    .eq("workspace_id", workspaceId)
    .gte("created_at", sinceIso);
  if (error) {
    console.warn("[METRICS] user_metrics read unavailable:", error.message);
    return [];
  }
  return (data ?? []) as Array<{
    user_id: string;
    action: MetricAction;
    metadata?: Record<string, unknown> | null;
    entity_id?: string | null;
    created_at?: string;
  }>;
}
