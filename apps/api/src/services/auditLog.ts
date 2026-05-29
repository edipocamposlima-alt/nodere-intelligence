import { randomUUID } from "node:crypto";
import { AuditLogEvent, AuditCategory } from "../types.js";

const events: AuditLogEvent[] = [];

export function appendAuditLog(
  category: AuditCategory,
  action: string,
  description: string,
  options?: { operatorId?: string; metadata?: Record<string, unknown> }
) {
  const event: AuditLogEvent = {
    id: randomUUID(),
    category,
    action,
    description,
    operatorId: options?.operatorId,
    metadata: options?.metadata,
    at: new Date().toISOString()
  };
  events.unshift(event);
  if (events.length > 1000) events.pop();
  return event;
}

export function getAuditLog(limit = 100) {
  return events.slice(0, limit);
}
