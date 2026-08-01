import type { UIMessage } from "ai";
import { getSupabase } from "../db/supabase.js";
import type { AiAgentRecord, AiModelRecord } from "./aiRegistry.js";

type SessionIdentity = { userId?: string; email?: string; role?: string };

export async function ensureAiConversation(input: {
  conversationId?: string | null;
  workspaceId: string;
  session: SessionIdentity;
  agent: AiAgentRecord;
  model: AiModelRecord;
  messages: UIMessage[];
}) {
  const sb = requireAiDatabase();
  if (input.conversationId) {
    const { data, error } = await sb
      .from("nodere_ai_conversations")
      .select("id, workspace_id")
      .eq("id", input.conversationId)
      .eq("workspace_id", input.workspaceId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw serviceError("AI_CONVERSATION_NOT_FOUND", "Conversa não encontrada neste workspace.", 404);
    await sb.from("nodere_ai_conversations").update({
      agent_id: input.agent.id,
      model_id: input.model.id,
      updated_at: new Date().toISOString()
    }).eq("id", data.id).eq("workspace_id", input.workspaceId);
    return String(data.id);
  }

  const title = extractConversationTitle(input.messages);
  const { data, error } = await sb.from("nodere_ai_conversations").insert({
    workspace_id: input.workspaceId,
    user_id: input.session.userId || input.session.email || null,
    agent_id: input.agent.id,
    model_id: input.model.id,
    title
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function createAiExecution(input: {
  workspaceId: string;
  conversationId?: string | null;
  session: SessionIdentity;
  agent: AiAgentRecord;
  model: AiModelRecord;
  idempotencyKey: string;
  reservedCredit: number;
}) {
  const sb = requireAiDatabase();
  const { data, error } = await sb.from("nodere_ai_executions").insert({
    workspace_id: input.workspaceId,
    conversation_id: input.conversationId || null,
    user_id: input.session.userId || input.session.email || null,
    agent_id: input.agent.id,
    model_id: input.model.id,
    provider: input.model.provider,
    idempotency_key: input.idempotencyKey,
    status: "pending",
    reserved_credit: input.reservedCredit
  }).select("id").single();
  if (error) {
    if (String(error.code) === "23505") throw serviceError("AI_REQUEST_DUPLICATE", "Esta solicitação de IA já foi recebida.", 409);
    throw error;
  }
  return String(data.id);
}

export async function updateAiExecution(executionId: string, workspaceId: string, values: Record<string, unknown>) {
  const sb = requireAiDatabase();
  const { error } = await sb.from("nodere_ai_executions").update(values).eq("id", executionId).eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function persistLatestUserMessage(conversationId: string, workspaceId: string, messages: UIMessage[]) {
  const message = [...messages].reverse().find((item) => item.role === "user");
  if (!message) return;
  const sb = requireAiDatabase();
  const existing = await sb.from("nodere_ai_messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("provider_message_id", message.id)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return;
  const { error } = await sb.from("nodere_ai_messages").insert({
    conversation_id: conversationId,
    workspace_id: workspaceId,
    role: "user",
    parts: message.parts,
    provider_message_id: message.id
  });
  if (error && String(error.code) !== "23505") throw error;
}

export async function persistAssistantMessage(input: {
  conversationId: string;
  workspaceId: string;
  executionId: string;
  messageId?: string;
  parts: UIMessage["parts"];
}) {
  const sb = requireAiDatabase();
  const { error } = await sb.from("nodere_ai_messages").insert({
    conversation_id: input.conversationId,
    workspace_id: input.workspaceId,
    role: "assistant",
    parts: input.parts,
    provider_message_id: input.messageId || `execution:${input.executionId}`
  });
  if (error && String(error.code) !== "23505") throw error;
  await sb.from("nodere_ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", input.conversationId).eq("workspace_id", input.workspaceId);
}

export async function listAiConversations(workspaceId: string, limit = 30) {
  const sb = requireAiDatabase();
  const { data, error } = await sb
    .from("nodere_ai_conversations")
    .select("id,title,agent_id,model_id,status,created_at,updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));
  if (error) throw error;
  return data ?? [];
}

export async function getAiConversation(workspaceId: string, conversationId: string) {
  const sb = requireAiDatabase();
  const conversation = await sb
    .from("nodere_ai_conversations")
    .select("id,title,agent_id,model_id,status,created_at,updated_at")
    .eq("id", conversationId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (conversation.error) throw conversation.error;
  if (!conversation.data) throw serviceError("AI_CONVERSATION_NOT_FOUND", "Conversa não encontrada neste workspace.", 404);
  const messages = await sb
    .from("nodere_ai_messages")
    .select("id,role,parts,provider_message_id,created_at")
    .eq("conversation_id", conversationId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (messages.error) throw messages.error;
  return { ...conversation.data, messages: messages.data ?? [] };
}

function extractConversationTitle(messages: UIMessage[]) {
  const firstUser = messages.find((message) => message.role === "user");
  const text = firstUser?.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.slice(0, 80) : "Nova conversa";
}

function requireAiDatabase() {
  const sb = getSupabase();
  if (!sb) throw serviceError("AI_DATABASE_UNAVAILABLE", "Supabase não está configurado para persistir a operação de IA.", 503);
  return sb;
}

function serviceError(code: string, message: string, status: number) {
  const error = new Error(message) as Error & { code?: string; status?: number };
  error.code = code;
  error.status = status;
  return error;
}
