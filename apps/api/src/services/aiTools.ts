import { randomUUID } from "node:crypto";
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { getSupabase } from "../db/supabase.js";
import type { AiAgentRecord } from "./aiRegistry.js";

type ToolContext = {
  workspaceId: string;
  executionId: string;
  conversationId: string;
  session: { userId?: string; email?: string; role?: string };
  agent: AiAgentRecord;
};

const pipelineStages = [
  "Novo Lead",
  "Qualificado",
  "Contactado",
  "Diagnóstico",
  "Reunião marcada",
  "Proposta enviada",
  "Negociação",
  "Fechado",
  "Perdido"
] as const;

export function buildAiTools(context: ToolContext): ToolSet {
  const allowed = new Set(context.agent.allowedTools);
  const role = context.session.role || "viewer";
  const canWrite = role === "owner" || role === "admin" || role === "operator";
  const tools: ToolSet = {};

  if (allowed.has("list_companies")) {
    tools.list_companies = tool({
      description: "Lista empresas e leads reais do CRM deste workspace, com filtros opcionais. Use antes de afirmar que um lead existe.",
      inputSchema: z.object({
        query: z.string().trim().max(120).optional(),
        status: z.string().trim().max(60).optional(),
        limit: z.number().int().min(1).max(50).default(20)
      }),
      strict: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "list_companies", "read", false, input, async () => {
        const sb = requireAiDatabase();
        let query = sb.from("nodere_companies")
          .select("id,name,category,city,state,status,score,opportunity_level,phone,whatsapp,website,updated_at")
          .eq("workspace_id", context.workspaceId)
          .order("updated_at", { ascending: false })
          .limit(input.limit);
        if (input.status) query = query.eq("status", input.status);
        if (input.query) query = query.ilike("name", `%${escapeLike(input.query)}%`);
        const { data, error } = await query;
        if (error) throw error;
        return { count: data?.length ?? 0, companies: data ?? [] };
      })
    });
  }

  if (allowed.has("get_company")) {
    tools.get_company = tool({
      description: "Obtém os dados verificáveis de uma empresa do CRM pelo ID, sempre isolada no workspace atual.",
      inputSchema: z.object({ companyId: z.string().min(1).max(120) }),
      strict: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "get_company", "read", false, input, async () => {
        const sb = requireAiDatabase();
        const { data, error } = await sb.from("nodere_companies")
          .select("*")
          .eq("workspace_id", context.workspaceId)
          .eq("id", input.companyId)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw serviceError("COMPANY_NOT_FOUND", "Empresa não encontrada neste workspace.", 404);
        return { company: data };
      })
    });
  }

  if (canWrite && allowed.has("create_company")) {
    tools.create_company = tool({
      description: "Cria um novo lead no CRM. É uma mutação persistente e sempre exige aprovação humana explícita.",
      inputSchema: z.object({
        name: z.string().trim().min(2).max(180),
        category: z.string().trim().max(120).default(""),
        city: z.string().trim().max(120).default(""),
        state: z.string().trim().max(40).default(""),
        phone: z.string().trim().max(40).optional(),
        website: z.string().trim().url().max(500).optional()
      }),
      strict: true,
      needsApproval: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "create_company", "write", true, input, async () => {
        const sb = requireAiDatabase();
        const id = randomUUID();
        const { data, error } = await sb.from("nodere_companies").insert({
          id,
          workspace_id: context.workspaceId,
          name: input.name,
          category: input.category,
          city: input.city,
          state: input.state,
          address: "",
          phone: input.phone || null,
          website: input.website || null,
          status: "Novo Lead",
          score: 0
        }).select("id,name,status,created_at").single();
        if (error) throw error;
        return { receipt: "company_created", company: data };
      })
    });
  }

  if (canWrite && allowed.has("update_pipeline_stage")) {
    tools.update_pipeline_stage = tool({
      description: "Move um lead existente para outra etapa do funil. É uma mutação persistente e sempre exige aprovação humana explícita.",
      inputSchema: z.object({
        companyId: z.string().min(1).max(120),
        stage: z.enum(pipelineStages),
        reason: z.string().trim().min(3).max(500)
      }),
      strict: true,
      needsApproval: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "update_pipeline_stage", "write", true, input, async () => {
        const sb = requireAiDatabase();
        const current = await sb.from("nodere_companies")
          .select("id,name,status")
          .eq("workspace_id", context.workspaceId)
          .eq("id", input.companyId)
          .maybeSingle();
        if (current.error) throw current.error;
        if (!current.data) throw serviceError("COMPANY_NOT_FOUND", "Empresa não encontrada neste workspace.", 404);
        const { data, error } = await sb.from("nodere_companies").update({
          status: input.stage,
          updated_at: new Date().toISOString()
        }).eq("workspace_id", context.workspaceId).eq("id", input.companyId).select("id,name,status,updated_at").single();
        if (error) throw error;
        return {
          receipt: "pipeline_stage_updated",
          company: data,
          previousStage: current.data.status,
          reason: input.reason
        };
      })
    });
  }

  return tools;
}

export function buildToolIdempotencyKey(conversationId: string, toolCallId: string) {
  return `ai:conversation:${conversationId}:tool:${toolCallId}`;
}

async function withToolReceipt<TInput, TOutput>(
  context: ToolContext,
  toolCallId: string,
  toolName: string,
  riskLevel: "read" | "write" | "external" | "destructive",
  approvalRequired: boolean,
  input: TInput,
  operation: () => Promise<TOutput>
): Promise<TOutput> {
  const sb = requireAiDatabase();
  const idempotencyKey = buildToolIdempotencyKey(context.conversationId, toolCallId);
  const existing = await sb.from("nodere_ai_tool_receipts")
    .select("status,output,error_code")
    .eq("workspace_id", context.workspaceId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.status === "succeeded") return existing.data.output as TOutput;
  if (existing.data?.status === "failed") throw serviceError(existing.data.error_code || "TOOL_EXECUTION_FAILED", "A execução anterior desta ferramenta falhou.", 409);
  if (existing.data?.status === "pending") throw serviceError("TOOL_EXECUTION_IN_PROGRESS", "Esta ferramenta já está em execução.", 409);

  const inserted = await sb.from("nodere_ai_tool_receipts").insert({
    workspace_id: context.workspaceId,
    execution_id: context.executionId,
    conversation_id: context.conversationId,
    tool_call_id: toolCallId,
    tool_name: toolName,
    idempotency_key: idempotencyKey,
    risk_level: riskLevel,
    approval_required: approvalRequired,
    approved_by: approvalRequired ? (context.session.userId || context.session.email || null) : null,
    input,
    status: "pending"
  });
  if (inserted.error) {
    if (String(inserted.error.code) !== "23505") throw inserted.error;
    const concurrent = await sb.from("nodere_ai_tool_receipts")
      .select("status,output,error_code")
      .eq("workspace_id", context.workspaceId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (concurrent.error) throw concurrent.error;
    if (concurrent.data?.status === "succeeded") return concurrent.data.output as TOutput;
    if (concurrent.data?.status === "failed") {
      throw serviceError(concurrent.data.error_code || "TOOL_EXECUTION_FAILED", "A execução anterior desta ferramenta falhou.", 409);
    }
    throw serviceError("TOOL_EXECUTION_IN_PROGRESS", "Esta ferramenta já está em execução.", 409);
  }

  try {
    const output = await operation();
    const { error } = await sb.from("nodere_ai_tool_receipts").update({
      output,
      status: "succeeded",
      finished_at: new Date().toISOString()
    }).eq("workspace_id", context.workspaceId).eq("idempotency_key", idempotencyKey);
    if (error) throw error;
    return output;
  } catch (error) {
    await sb.from("nodere_ai_tool_receipts").update({
      status: "failed",
      error_code: String((error as { code?: string })?.code || "TOOL_EXECUTION_FAILED"),
      finished_at: new Date().toISOString()
    }).eq("workspace_id", context.workspaceId).eq("idempotency_key", idempotencyKey);
    throw error;
  }
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function requireAiDatabase() {
  const sb = getSupabase();
  if (!sb) throw serviceError("AI_DATABASE_UNAVAILABLE", "Supabase não está configurado para executar ferramentas de IA.", 503);
  return sb;
}

function serviceError(code: string, message: string, status: number) {
  const error = new Error(message) as Error & { code?: string; status?: number };
  error.code = code;
  error.status = status;
  return error;
}
