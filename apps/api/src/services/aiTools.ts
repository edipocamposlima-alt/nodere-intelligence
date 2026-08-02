import { randomUUID } from "node:crypto";
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { getSupabase } from "../db/supabase.js";
import type { AiAgentRecord } from "./aiRegistry.js";
import { BRIEFING_FIELDS, calculateBriefingCompletion, missingRequiredBriefingFields, normalizeBriefingAnswers } from "./briefingFields.js";

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
          .eq("record_state", "active")
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

  if (allowed.has("briefing_list")) {
    tools.briefing_list = tool({
      description: "Lista briefings comerciais reais do workspace. Pode filtrar por empresa, status e texto.",
      inputSchema: z.object({
        companyId: z.string().max(120).optional(),
        status: z.enum(["draft", "completed", "archived"]).optional(),
        query: z.string().max(120).optional(),
        limit: z.number().int().min(1).max(50).default(20)
      }),
      strict: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "briefing_list", "read", false, input, async () => {
        let query = requireAiDatabase().from("commercial_briefings")
          .select("id,code,company_id,title,status,priority,completion_percent,current_version,next_action,next_action_at,updated_at")
          .eq("workspace_id", context.workspaceId)
          .order("updated_at", { ascending: false })
          .limit(input.limit);
        if (input.companyId) query = query.eq("company_id", input.companyId);
        if (input.status) query = query.eq("status", input.status);
        if (input.query) query = query.or(`code.ilike.%${escapePostgrest(input.query)}%,title.ilike.%${escapePostgrest(input.query)}%`);
        const { data, error } = await query;
        if (error) throw error;
        return { count: data?.length ?? 0, briefings: data ?? [] };
      })
    });
  }

  if (allowed.has("briefing_get")) {
    tools.briefing_get = tool({
      description: "Abre um briefing comercial pelo ID e retorna seu snapshot atual, sem inventar respostas ausentes.",
      inputSchema: z.object({ briefingId: z.string().min(1).max(120) }),
      strict: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "briefing_get", "read", false, input, async () => {
        const { data, error } = await requireAiDatabase().from("commercial_briefings")
          .select("*").eq("workspace_id", context.workspaceId).eq("id", input.briefingId).maybeSingle();
        if (error) throw error;
        if (!data) throw serviceError("BRIEFING_NOT_FOUND", "Briefing não encontrado neste workspace.", 404);
        return { briefing: data, fieldCount: BRIEFING_FIELDS.length };
      })
    });
  }

  if (allowed.has("briefing_compare")) {
    tools.briefing_compare = tool({
      description: "Compara campos mapeados do briefing com a ficha atual da empresa e lista conflitos que exigem decisão humana.",
      inputSchema: z.object({ briefingId: z.string().min(1).max(120) }),
      strict: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "briefing_compare", "read", false, input, async () => {
        const sb = requireAiDatabase();
        const briefing = await sb.from("commercial_briefings").select("id,company_id,primary_contact_id,answers").eq("workspace_id", context.workspaceId).eq("id", input.briefingId).maybeSingle();
        if (briefing.error) throw briefing.error;
        if (!briefing.data) throw serviceError("BRIEFING_NOT_FOUND", "Briefing não encontrado neste workspace.", 404);
        const [company, contact] = await Promise.all([
          sb.from("nodere_companies").select("*").eq("workspace_id", context.workspaceId).eq("id", briefing.data.company_id).maybeSingle(),
          briefing.data.primary_contact_id
            ? sb.from("company_contacts").select("*").eq("workspace_id", context.workspaceId).eq("id", briefing.data.primary_contact_id).maybeSingle()
            : Promise.resolve({ data: null, error: null })
        ]);
        if (company.error) throw company.error;
        if (contact.error) throw contact.error;
        const answers = asRecord(briefing.data.answers);
        const conflicts = BRIEFING_FIELDS.flatMap((field) => {
          const currentValue = field.companyColumn ? company.data?.[field.companyColumn] : field.contactColumn ? contact.data?.[field.contactColumn] : undefined;
          const collectedValue = answers[field.key];
          if (!hasValue(currentValue) || !hasValue(collectedValue) || normalizeComparable(currentValue) === normalizeComparable(collectedValue)) return [];
          return [{ fieldKey: field.key, label: field.label, currentValue, collectedValue, decisions: ["keep", "replace", "append"] }];
        });
        return { conflicts, requiresHumanDecision: conflicts.length > 0 };
      })
    });
  }

  if (canWrite && allowed.has("briefing_create")) {
    tools.briefing_create = tool({
      description: "Cria um briefing comercial nativo vinculado a uma empresa. Exige aprovação humana explícita.",
      inputSchema: z.object({
        companyId: z.string().min(1).max(120),
        title: z.string().min(2).max(180).optional(),
        priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
        answers: z.record(z.string(), z.unknown()).optional()
      }),
      strict: true,
      needsApproval: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "briefing_create", "write", true, input, async () => {
        const sb = requireAiDatabase();
        const company = await sb.from("nodere_companies").select("*").eq("workspace_id", context.workspaceId).eq("id", input.companyId).eq("record_state", "active").maybeSingle();
        if (company.error) throw company.error;
        if (!company.data) throw serviceError("COMPANY_NOT_FOUND", "Empresa ativa não encontrada neste workspace.", 404);
        const answers = normalizeBriefingAnswers({ company_name: company.data.name, segment: company.data.category, city: company.data.city, state: company.data.state, website: company.data.website, ...(input.answers ?? {}) });
        const id = randomUUID();
        const code = `BRF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 6).toUpperCase()}`;
        const actorId = context.session.userId || context.session.email || "unknown";
        const row = { id, workspace_id: context.workspaceId, company_id: input.companyId, code, title: input.title || `Briefing comercial — ${company.data.name}`, priority: input.priority, answers, source_snapshot: { company: company.data }, completion_percent: calculateBriefingCompletion(answers), created_by: actorId, updated_by: actorId };
        const { data, error } = await sb.from("commercial_briefings").insert(row).select("id,code,title,status,priority,completion_percent,created_at").single();
        if (error) throw error;
        const version = await sb.from("briefing_versions").insert({ id: randomUUID(), workspace_id: context.workspaceId, briefing_id: id, version: 1, snapshot: row, change_type: "ai_tool_create", change_reason: "Criação aprovada pela NODERE AI", created_by: actorId });
        if (version.error) throw version.error;
        return { receipt: "briefing_created", briefing: data };
      })
    });
  }

  if (canWrite && allowed.has("briefing_update")) {
    tools.briefing_update = tool({
      description: "Atualiza respostas de um briefing existente. Exige aprovação humana e preserva somente as 47 chaves oficiais.",
      inputSchema: z.object({
        briefingId: z.string().min(1).max(120),
        answers: z.record(z.string(), z.unknown()),
        reason: z.string().min(3).max(500)
      }),
      strict: true,
      needsApproval: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "briefing_update", "write", true, input, async () => {
        const sb = requireAiDatabase();
        const current = await sb.from("commercial_briefings").select("*").eq("workspace_id", context.workspaceId).eq("id", input.briefingId).maybeSingle();
        if (current.error) throw current.error;
        if (!current.data) throw serviceError("BRIEFING_NOT_FOUND", "Briefing não encontrado neste workspace.", 404);
        const changed = normalizeBriefingAnswers(input.answers);
        const answers = { ...asRecord(current.data.answers), ...changed };
        const { data, error } = await sb.from("commercial_briefings").update({ answers, completion_percent: calculateBriefingCompletion(answers), updated_by: context.session.userId || context.session.email || "unknown" }).eq("workspace_id", context.workspaceId).eq("id", input.briefingId).select("id,code,status,completion_percent,updated_at").single();
        if (error) throw error;
        return { receipt: "briefing_updated", briefing: data, changedFields: Object.keys(changed), reason: input.reason };
      })
    });
  }

  if (canWrite && allowed.has("briefing_complete")) {
    tools.briefing_complete = tool({
      description: "Conclui um briefing quando todos os campos obrigatórios estão preenchidos. Exige aprovação humana.",
      inputSchema: z.object({ briefingId: z.string().min(1).max(120), reason: z.string().min(3).max(500) }),
      strict: true,
      needsApproval: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "briefing_complete", "write", true, input, async () => {
        const sb = requireAiDatabase();
        const current = await sb.from("commercial_briefings").select("*").eq("workspace_id", context.workspaceId).eq("id", input.briefingId).maybeSingle();
        if (current.error) throw current.error;
        if (!current.data) throw serviceError("BRIEFING_NOT_FOUND", "Briefing não encontrado neste workspace.", 404);
        const answers = asRecord(current.data.answers);
        const missing = missingRequiredBriefingFields(answers);
        if (missing.length) throw serviceError("BRIEFING_REQUIRED_FIELDS", `Campos obrigatórios ausentes: ${missing.map((field) => field.label).join(", ")}.`, 422);
        const { data, error } = await sb.from("commercial_briefings").update({ status: "completed", completion_percent: calculateBriefingCompletion(answers), completed_at: new Date().toISOString(), updated_by: context.session.userId || context.session.email || "unknown" }).eq("workspace_id", context.workspaceId).eq("id", input.briefingId).select("id,code,status,completion_percent,completed_at").single();
        if (error) throw error;
        return { receipt: "briefing_completed", briefing: data, reason: input.reason };
      })
    });
  }

  if (canWrite && allowed.has("briefing_create_version")) {
    tools.briefing_create_version = tool({
      description: "Cria uma nova versão editável preservando o snapshot atual do briefing. Exige aprovação humana.",
      inputSchema: z.object({ briefingId: z.string().min(1).max(120), reason: z.string().min(3).max(500) }),
      strict: true,
      needsApproval: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "briefing_create_version", "write", true, input, async () => {
        const sb = requireAiDatabase();
        const current = await sb.from("commercial_briefings").select("*").eq("workspace_id", context.workspaceId).eq("id", input.briefingId).maybeSingle();
        if (current.error) throw current.error;
        if (!current.data) throw serviceError("BRIEFING_NOT_FOUND", "Briefing não encontrado neste workspace.", 404);
        const version = Number(current.data.current_version || 1) + 1;
        const actorId = context.session.userId || context.session.email || "unknown";
        const saved = await sb.from("briefing_versions").insert({ id: randomUUID(), workspace_id: context.workspaceId, briefing_id: input.briefingId, version, snapshot: current.data, change_type: "ai_tool_version", change_reason: input.reason, created_by: actorId });
        if (saved.error) throw saved.error;
        const { data, error } = await sb.from("commercial_briefings").update({ current_version: version, status: "draft", completed_at: null, updated_by: actorId }).eq("workspace_id", context.workspaceId).eq("id", input.briefingId).select("id,code,status,current_version,updated_at").single();
        if (error) throw error;
        return { receipt: "briefing_version_created", briefing: data, reason: input.reason };
      })
    });
  }

  for (const action of ["briefing_archive", "briefing_restore"] as const) {
    if (!canWrite || !allowed.has(action)) continue;
    tools[action] = tool({
      description: action === "briefing_archive" ? "Arquiva um briefing sem apagá-lo. Exige aprovação humana." : "Restaura um briefing arquivado como rascunho. Exige aprovação humana.",
      inputSchema: z.object({ briefingId: z.string().min(1).max(120), reason: z.string().min(3).max(500) }),
      strict: true,
      needsApproval: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, action, "write", true, input, async () => {
        const archived = action === "briefing_archive";
        const { data, error } = await requireAiDatabase().from("commercial_briefings").update({
          status: archived ? "archived" : "draft",
          archived_at: archived ? new Date().toISOString() : null,
          updated_by: context.session.userId || context.session.email || "unknown"
        }).eq("workspace_id", context.workspaceId).eq("id", input.briefingId).select("id,code,status,archived_at,updated_at").maybeSingle();
        if (error) throw error;
        if (!data) throw serviceError("BRIEFING_NOT_FOUND", "Briefing não encontrado neste workspace.", 404);
        return { receipt: archived ? "briefing_archived" : "briefing_restored", briefing: data, reason: input.reason };
      })
    });
  }

  if (allowed.has("company_dependencies")) {
    tools.company_dependencies = tool({
      description: "Mostra o impacto e as dependências antes de arquivar, mover à lixeira ou excluir uma empresa.",
      inputSchema: z.object({ companyId: z.string().min(1).max(120) }),
      strict: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "company_dependencies", "read", false, input, async () => {
        const dependencies = await aiCompanyDependencies(context.workspaceId, input.companyId);
        return { companyId: input.companyId, dependencies, total: Object.values(dependencies).reduce((sum, value) => sum + value, 0) };
      })
    });
  }

  for (const action of ["company_archive", "company_trash", "company_restore"] as const) {
    if (!canWrite || !allowed.has(action)) continue;
    tools[action] = tool({
      description: action === "company_restore" ? "Restaura uma empresa arquivada ou na lixeira. Exige aprovação." : action === "company_trash" ? "Move uma empresa à lixeira recuperável por 30 dias. Exige aprovação e mostra impacto." : "Arquiva uma empresa sem apagar dependências. Exige aprovação.",
      inputSchema: z.object({ companyId: z.string().min(1).max(120), reason: z.string().min(3).max(500) }),
      strict: true,
      needsApproval: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, action, "write", true, input, async () => {
        const sb = requireAiDatabase();
        const current = await sb.from("nodere_companies").select("*").eq("workspace_id", context.workspaceId).eq("id", input.companyId).maybeSingle();
        if (current.error) throw current.error;
        if (!current.data) throw serviceError("COMPANY_NOT_FOUND", "Empresa não encontrada neste workspace.", 404);
        const actorId = context.session.userId || context.session.email || "unknown";
        const now = new Date().toISOString();
        const update = action === "company_restore"
          ? { record_state: "active", is_archived: false, is_deleted: false, archived_at: null, archived_by: null, trashed_at: null, trashed_by: null, purge_after: null, delete_reason: null }
          : action === "company_trash"
            ? { record_state: "trash", is_archived: false, is_deleted: true, archived_at: null, archived_by: null, trashed_at: now, trashed_by: actorId, purge_after: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), delete_reason: input.reason }
            : { record_state: "archived", is_archived: true, is_deleted: false, archived_at: now, archived_by: actorId, trashed_at: null, trashed_by: null, purge_after: null, delete_reason: input.reason };
        const { data, error } = await sb.from("nodere_companies").update({ ...update, updated_at: now }).eq("workspace_id", context.workspaceId).eq("id", input.companyId).select("id,name,record_state,archived_at,trashed_at,purge_after,updated_at").single();
        if (error) throw error;
        const dependencies = await aiCompanyDependencies(context.workspaceId, input.companyId);
        await writeAiAudit(context, action, "company", input.companyId, current.data, data, input.reason, { dependencies });
        return { receipt: action, company: data, dependencies, recoverable: true };
      })
    });
  }

  if ((role === "owner" || role === "admin") && allowed.has("company_purge")) {
    tools.company_purge = tool({
      description: "Exclui definitivamente uma empresa após retenção, confirmação nominal, ausência de retenção legal e zero dependências. Ação irreversível.",
      inputSchema: z.object({ companyId: z.string().min(1).max(120), confirmation: z.string().min(1).max(180), reason: z.string().min(10).max(500) }),
      strict: true,
      needsApproval: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "company_purge", "destructive", true, input, async () => {
        const sb = requireAiDatabase();
        const current = await sb.from("nodere_companies").select("*").eq("workspace_id", context.workspaceId).eq("id", input.companyId).maybeSingle();
        if (current.error) throw current.error;
        if (!current.data) throw serviceError("COMPANY_NOT_FOUND", "Empresa não encontrada neste workspace.", 404);
        if (current.data.record_state !== "trash") throw serviceError("COMPANY_NOT_IN_TRASH", "Mova a empresa para a lixeira antes da exclusão definitiva.", 409);
        if (current.data.legal_hold) throw serviceError("COMPANY_LEGAL_HOLD", "A empresa está sob retenção legal.", 409);
        if (input.confirmation !== current.data.name && input.confirmation !== "EXCLUIR DEFINITIVAMENTE") throw serviceError("COMPANY_PURGE_CONFIRMATION", "A confirmação não corresponde ao nome da empresa.", 422);
        if (!current.data.purge_after || new Date(current.data.purge_after).getTime() > Date.now()) throw serviceError("COMPANY_RETENTION_ACTIVE", "O prazo de retenção ainda não terminou.", 409);
        const dependencies = await aiCompanyDependencies(context.workspaceId, input.companyId);
        const total = Object.values(dependencies).reduce((sum, value) => sum + value, 0);
        if (total) throw serviceError("COMPANY_DEPENDENCIES_EXIST", `Exclusão bloqueada por ${total} dependência(s).`, 409);
        await writeAiAudit(context, "company_purge", "company", input.companyId, current.data, { purged: true }, input.reason, { dependencies });
        const { error } = await sb.from("nodere_companies").delete().eq("workspace_id", context.workspaceId).eq("id", input.companyId);
        if (error) throw error;
        return { receipt: "company_purged", companyId: input.companyId, recoverable: false };
      })
    });
  }

  if (allowed.has("briefing_generate_pdf")) {
    tools.briefing_generate_pdf = tool({
      description: "Prepara o link autenticado para gerar e baixar o PDF completo de um briefing.",
      inputSchema: z.object({ briefingId: z.string().min(1).max(120) }),
      strict: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "briefing_generate_pdf", "read", false, input, async () => {
        const { data, error } = await requireAiDatabase().from("commercial_briefings").select("id,code,title").eq("workspace_id", context.workspaceId).eq("id", input.briefingId).maybeSingle();
        if (error) throw error;
        if (!data) throw serviceError("BRIEFING_NOT_FOUND", "Briefing não encontrado neste workspace.", 404);
        return { receipt: "briefing_pdf_ready", briefing: data, downloadPath: `/api/backend/briefings/${encodeURIComponent(data.id)}/pdf` };
      })
    });
  }

  if (allowed.has("briefing_export")) {
    tools.briefing_export = tool({
      description: "Prepara exportação integral de briefings em XLSX ou CSV.",
      inputSchema: z.object({ format: z.enum(["xlsx", "csv"]).default("xlsx") }),
      strict: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "briefing_export", "read", false, input, async () => ({ receipt: "briefing_export_ready", format: input.format, downloadPath: `/api/backend/briefings/export.${input.format}` }))
    });
  }

  if (allowed.has("briefing_import")) {
    tools.briefing_import = tool({
      description: "Abre o fluxo seguro de prévia e importação XLSX. A IA não importa silenciosamente.",
      inputSchema: z.object({ confirmed: z.boolean().default(false) }),
      strict: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "briefing_import", "read", false, input, async () => ({ receipt: "briefing_import_ui_ready", confirmed: input.confirmed, pagePath: "/crm/briefings", templatePath: "/api/backend/briefings/import-template.xlsx", requiresFileReview: true }))
    });
  }

  if (allowed.has("briefing_attach_file")) {
    tools.briefing_attach_file = tool({
      description: "Abre o briefing na seção segura de anexos; o binário exige seleção e confirmação humana no navegador.",
      inputSchema: z.object({ briefingId: z.string().min(1).max(120) }),
      strict: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "briefing_attach_file", "read", false, input, async () => ({ receipt: "briefing_attachment_ui_ready", pagePath: `/crm/briefings/${encodeURIComponent(input.briefingId)}#attachments`, requiresHumanFileSelection: true }))
    });
  }

  if (allowed.has("communication_template_list")) {
    tools.communication_template_list = tool({
      description: "Lista modelos ativos de comunicação do workspace por canal.",
      inputSchema: z.object({ channel: z.enum(["email", "whatsapp", "internal"]).optional(), limit: z.number().int().min(1).max(50).default(20) }),
      strict: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "communication_template_list", "read", false, input, async () => {
        let query = requireAiDatabase().from("nodere_communication_templates").select("id,name,channel,category,subject,body_text,body_html,signature,current_version,updated_at").eq("workspace_id", context.workspaceId).eq("active", true).is("archived_at", null).order("updated_at", { ascending: false }).limit(input.limit);
        if (input.channel) query = query.eq("channel", input.channel);
        const { data, error } = await query;
        if (error) throw error;
        return { count: data?.length ?? 0, templates: data ?? [] };
      })
    });
  }

  if (allowed.has("communication_history")) {
    tools.communication_history = tool({
      description: "Resume o histórico imutável de comunicação de uma empresa, sem acessar outro workspace.",
      inputSchema: z.object({ companyId: z.string().min(1).max(120), limit: z.number().int().min(1).max(100).default(30) }),
      strict: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "communication_history", "read", false, input, async () => {
        const { data, error } = await requireAiDatabase().from("communication_events").select("id,event_type,direction,status,subject,body_text,occurred_at").eq("workspace_id", context.workspaceId).eq("company_id", input.companyId).order("occurred_at", { ascending: false }).limit(input.limit);
        if (error) throw error;
        return { count: data?.length ?? 0, events: data ?? [] };
      })
    });
  }

  if (canWrite && allowed.has("communication_create_draft")) {
    tools.communication_create_draft = tool({
      description: "Cria apenas um rascunho na outbox; nunca envia. Exige aprovação e confirmação de base legítima do contato.",
      inputSchema: z.object({
        companyId: z.string().min(1).max(120), channel: z.enum(["email", "whatsapp"]),
        recipient: z.string().min(5).max(320), subject: z.string().max(240).default(""),
        bodyText: z.string().min(1).max(50_000), consentConfirmed: z.literal(true)
      }),
      strict: true,
      needsApproval: true,
      execute: async (input, options) => withToolReceipt(context, options.toolCallId, "communication_create_draft", "write", true, input, async () => {
        if (input.channel === "email" && !z.string().email().safeParse(input.recipient).success) throw serviceError("INVALID_EMAIL", "Destinatário de e-mail inválido.", 422);
        const phone = input.recipient.replace(/\D/g, "");
        if (input.channel === "whatsapp" && phone.length < 12) throw serviceError("INVALID_WHATSAPP", "WhatsApp deve incluir DDI e DDD.", 422);
        const sb = requireAiDatabase();
        const actorId = context.session.userId || context.session.email || "unknown";
        const threadId = randomUUID();
        const outboxId = randomUUID();
        const now = new Date().toISOString();
        const thread = await sb.from("communication_threads").insert({ id: threadId, workspace_id: context.workspaceId, company_id: input.companyId, channel: input.channel, subject: input.subject || null, status: "pending", last_event_at: now, created_by: actorId }).select("id").single();
        if (thread.error) throw thread.error;
        const payload = { recipient: input.channel === "whatsapp" ? phone : input.recipient.trim().toLowerCase(), subject: input.subject, bodyText: input.bodyText, bodyHtml: "", attachmentRefs: [], consentConfirmed: true, consentConfirmedAt: now, consentConfirmedBy: actorId };
        const outbox = await sb.from("communication_outbox").insert({ id: outboxId, workspace_id: context.workspaceId, thread_id: threadId, company_id: input.companyId, channel: input.channel, idempotency_key: buildToolIdempotencyKey(context.conversationId, options.toolCallId), payload, status: "draft", created_by: actorId }).select("id,status").single();
        if (outbox.error) throw outbox.error;
        const event = await sb.from("communication_events").insert({ id: randomUUID(), workspace_id: context.workspaceId, thread_id: threadId, company_id: input.companyId, event_type: "draft_created", direction: "outbound", status: "draft", subject: input.subject || null, body_text: input.bodyText, body_html: "", attachment_refs: [], actor_id: actorId, metadata: { outboxId, source: "nodere-ai" } });
        if (event.error) throw event.error;
        await writeAiAudit(context, "communication_create_draft", "communication_outbox", outboxId, null, { ...outbox.data, payload: "[redacted]" }, "Rascunho aprovado no chat");
        return { receipt: "communication_draft_created", outbox: outbox.data, threadId, sent: false, pagePath: "/crm/communications" };
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

function escapePostgrest(value: string) {
  return value.replace(/[,%()]/g, " ").slice(0, 120);
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
}

async function aiCompanyDependencies(workspaceId: string, companyId: string) {
  const definitions = [
    ["commercial_briefings", "company_id"], ["company_contacts", "company_id"], ["communications", "company_id"],
    ["communication_threads", "company_id"], ["communication_events", "company_id"], ["company_contracts", "company_id"],
    ["calendar_events", "company_id"], ["schedules", "company_id"], ["proposal_versions", "lead_id"],
    ["inbox_messages", "lead_id"], ["cadence_enrollments", "lead_id"], ["nodere_company_notes", "company_id"],
    ["company_files", "company_id"]
  ] as const;
  const sb = requireAiDatabase();
  const counts = await Promise.all(definitions.map(async ([table, column]) => {
    const { count, error } = await sb.from(table).select("id", { head: true, count: "exact" }).eq("workspace_id", workspaceId).eq(column, companyId);
    if (error && !["42P01", "PGRST205"].includes(String(error.code || ""))) throw error;
    return [table, error ? 0 : count ?? 0] as const;
  }));
  return Object.fromEntries(counts) as Record<string, number>;
}

async function writeAiAudit(
  context: ToolContext,
  action: string,
  entityType: string,
  entityId: string,
  beforeState: unknown,
  afterState: unknown,
  reason: string,
  metadata: Record<string, unknown> = {}
) {
  const { error } = await requireAiDatabase().from("nodere_audit_events").insert({
    id: randomUUID(), workspace_id: context.workspaceId,
    actor_id: context.session.userId || context.session.email || "unknown",
    actor_role: context.session.role || "viewer", action,
    entity_type: entityType, entity_id: entityId, reason,
    before_state: beforeState, after_state: afterState,
    metadata: { source: "nodere-ai", executionId: context.executionId, conversationId: context.conversationId, ...metadata }
  });
  if (error) throw error;
}

function hasValue(value: unknown) {
  return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && String(value).trim() !== "";
}

function normalizeComparable(value: unknown) {
  return String(Array.isArray(value) ? value.join(",") : value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
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
