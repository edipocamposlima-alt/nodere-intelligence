import { randomUUID } from "node:crypto";
import { getSupabase } from "../db/supabase.js";

export async function emitDomainEvent(input: {
  workspaceId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  actorId?: string | null;
  causationId?: string | null;
  correlationId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const sb = getSupabase();
  if (!sb) return null;
  const row = {
    id: randomUUID(),
    workspace_id: input.workspaceId,
    aggregate_type: input.aggregateType,
    aggregate_id: input.aggregateId,
    event_type: input.eventType,
    actor_id: input.actorId || null,
    causation_id: input.causationId || null,
    correlation_id: input.correlationId || null,
    payload: input.payload || {},
    occurred_at: new Date().toISOString()
  };
  const { data, error } = await sb.from("nodere_domain_events").insert(row).select("*").single();
  if (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    if (message.includes("nodere_domain_events") || message.includes("42P01")) return null;
    throw error;
  }
  return data;
}
