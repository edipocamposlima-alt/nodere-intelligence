import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getRequestWorkspaceId, requireWorkspaceRole } from "../middleware/session.js";
import { getSupabase } from "../db/supabase.js";
import { getCompanyAsync } from "../services/companyStore.js";
import { callAI } from "../services/ai.js";
import { logRequestMetric } from "../services/metricsStore.js";

const router = Router();

const systemTemplates = [
  {
    id: "system-google-ads",
    workspace_id: null,
    service_type: "Google Ads",
    name: "Gestão Google Ads",
    content: "# Proposta Google Ads para {{company}}\n\nCidade: {{city}}\nSegmento: {{segment}}\nScore NODERI: {{score}}\n\nRecomendamos uma operação inicial de campanhas de pesquisa local, extensões de chamada e otimização semanal orientada por conversões.",
    variables: ["company", "city", "segment", "score", "phone", "website", "google_rating"]
  },
  {
    id: "system-gbp",
    workspace_id: null,
    service_type: "Google Meu Negócio",
    name: "Otimização Google Meu Negócio",
    content: "# Diagnóstico Google Meu Negócio — {{company}}\n\nNota Google: {{google_rating}}\nSite: {{website}}\n\nEscopo: revisão do perfil, categorias, descrição, fotos, postagens, respostas a avaliações e plano de melhoria local.",
    variables: ["company", "city", "segment", "score", "phone", "website", "google_rating"]
  },
  {
    id: "system-landing-page",
    workspace_id: null,
    service_type: "Landing Page",
    name: "Landing Page de Conversão",
    content: "# Landing Page para {{company}}\n\nObjetivo: capturar leads qualificados em {{city}} para o segmento {{segment}}.\n\nInclui copy, estrutura responsiva, rastreamento e integração com campanhas.",
    variables: ["company", "city", "segment", "score", "phone", "website", "google_rating"]
  },
  {
    id: "system-pagespeed",
    workspace_id: null,
    service_type: "PageSpeed Audit",
    name: "Auditoria PageSpeed",
    content: "# Auditoria técnica — {{company}}\n\nSite analisado: {{website}}\n\nVamos priorizar velocidade, acessibilidade, SEO técnico e boas práticas para melhorar conversão e performance de mídia paga.",
    variables: ["company", "city", "segment", "score", "phone", "website", "google_rating"]
  },
  {
    id: "system-complete",
    workspace_id: null,
    service_type: "Complete Package",
    name: "Pacote Completo NODERI",
    content: "# Plano completo para {{company}}\n\nInclui Google Meu Negócio, Google Ads, landing page, rastreamento e acompanhamento comercial para {{segment}} em {{city}}.",
    variables: ["company", "city", "segment", "score", "phone", "website", "google_rating"]
  }
];

router.get("/templates", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const sb = getSupabase();
    let workspaceTemplates: any[] = [];
    if (sb) {
      const { data, error } = await sb
        .from("proposal_templates")
        .select("*")
        .or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`)
        .order("created_at", { ascending: false });
      if (!error) workspaceTemplates = data ?? [];
    }
    const ids = new Set(workspaceTemplates.map((item) => item.id));
    res.json([...systemTemplates.filter((item) => !ids.has(item.id)), ...workspaceTemplates]);
  } catch (error) {
    next(error);
  }
});

router.post("/templates", requireWorkspaceRole("owner", "admin"), async (req, res, next) => {
  try {
    const body = z.object({
      service_type: z.string().min(2),
      name: z.string().min(2),
      content: z.string().min(5),
      variables: z.array(z.string()).optional()
    }).parse(req.body);
    const template = { id: randomUUID(), workspace_id: getRequestWorkspaceId(req), ...body, variables: body.variables ?? [] };
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado para salvar templates." });
    const { data, error } = await sb.from("proposal_templates").insert(template).select("*").single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/templates/:id", requireWorkspaceRole("owner", "admin"), async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado." });
    const { data, error } = await sb
      .from("proposal_templates")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .eq("workspace_id", getRequestWorkspaceId(req))
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Template não encontrado." });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete("/templates/:id", requireWorkspaceRole("owner", "admin"), async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado." });
    const { error } = await sb.from("proposal_templates").delete().eq("id", req.params.id).eq("workspace_id", getRequestWorkspaceId(req));
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post("/generate", async (req, res, next) => {
  try {
    const body = z.object({
      template_id: z.string(),
      lead_id: z.string(),
      enhance: z.boolean().optional()
    }).parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    const lead = await getCompanyAsync(body.lead_id, workspaceId);
    if (!lead) return res.status(404).json({ message: "Lead não encontrado." });
    const template = await resolveTemplate(body.template_id, workspaceId);
    if (!template) return res.status(404).json({ message: "Template não encontrado." });
    let rendered = interpolate(template.content, {
      company: lead.name,
      city: lead.city,
      segment: lead.category,
      score: String(lead.score),
      phone: lead.phone || "",
      website: lead.website || "",
      google_rating: lead.rating ? String(lead.rating) : ""
    });
    if (body.enhance) {
      const ai = await callAI("Você é consultor comercial NODERI. Melhore a proposta mantendo dados reais e tom profissional.", rendered);
      rendered = ai.content;
    }
    logRequestMetric(req, "proposal_generated", lead.id, {
      templateId: body.template_id,
      enhanced: Boolean(body.enhance)
    });
    res.json({ content: rendered, template, leadId: lead.id });
  } catch (error) {
    next(error);
  }
});

router.post("/versions", async (req, res, next) => {
  try {
    const body = z.object({
      lead_id: z.string(),
      content: z.string().min(5),
      service_type: z.string().optional(),
      generated_by: z.enum(["user", "ai"]).default("user")
    }).parse(req.body);
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado para versionamento." });
    const workspaceId = getRequestWorkspaceId(req);
    const { count } = await sb.from("proposal_versions").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("lead_id", body.lead_id);
    const row = { id: randomUUID(), workspace_id: workspaceId, version_number: (count ?? 0) + 1, ...body };
    const { data, error } = await sb.from("proposal_versions").insert(row).select("*").single();
    if (error) throw error;
    logRequestMetric(req, "proposal_generated", body.lead_id, {
      serviceType: body.service_type || null,
      generatedBy: body.generated_by,
      version: row.version_number
    });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/leads/:id", async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.json([]);
    const { data, error } = await sb
      .from("proposal_versions")
      .select("id, lead_id, version_number, service_type, generated_by, created_at")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("lead_id", req.params.id)
      .order("version_number", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.get("/leads/:id/:version", async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado." });
    const { data, error } = await sb
      .from("proposal_versions")
      .select("*")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("lead_id", req.params.id)
      .eq("version_number", Number(req.params.version))
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Versão não encontrada." });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

async function resolveTemplate(id: string, workspaceId: string) {
  const system = systemTemplates.find((item) => item.id === id);
  if (system) return system;
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from("proposal_templates").select("*").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  return data;
}

function interpolate(content: string, variables: Record<string, string>) {
  return content.replace(/\{\{(\w+)\}\}/g, (_match, key) => variables[key] ?? "");
}

export default router;
