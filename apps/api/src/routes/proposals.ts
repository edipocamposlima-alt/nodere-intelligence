import { Router } from "express";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import PDFDocument from "pdfkit";
import { getRequestWorkspaceId, requireWorkspaceMutation, requireWorkspaceRole } from "../middleware/session.js";
import { getSupabase } from "../db/supabase.js";
import { getCompanyAsync } from "../services/companyStore.js";
import { callAI } from "../services/ai.js";
import { logRequestMetric } from "../services/metricsStore.js";
import { isMissingSupabaseSchema } from "../utils/supabaseErrors.js";

const router = Router();
router.use(requireWorkspaceMutation("owner", "admin", "operator"));

const proposalItemSchema = z.object({
  catalog_item_id: z.string().min(1),
  quantity: z.coerce.number().positive().default(1),
  discount_type: z.enum(["none", "percent", "amount"]).default("none"),
  discount_percent: z.coerce.number().min(0).max(100).optional().nullable(),
  discount_amount: z.coerce.number().min(0).optional().nullable(),
  discount_reason: z.string().optional().nullable(),
  customer_item_note: z.string().optional().nullable(),
  internal_item_note: z.string().optional().nullable()
});

const proposalPayloadSchema = z.object({
  lead_id: z.string().min(1),
  title: z.string().min(2).default("Proposta comercial NODERE"),
  service_type: z.string().optional(),
  content: z.string().optional(),
  items: z.array(proposalItemSchema).min(1, "Selecione pelo menos um produto/serviço ativo do catálogo."),
  currency: z.string().default("BRL"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).default("draft"),
  valid_until: z.string().nullable().optional()
});

const systemTemplates = [
  {
    id: "system-google-ads",
    workspace_id: null,
    service_type: "Google Ads",
    name: "Gestão Google Ads",
    content: "# Proposta Google Ads para {{company}}\n\nCidade: {{city}}\nSegmento: {{segment}}\nScore NODERE: {{score}}\n\nRecomendamos uma operação inicial de campanhas de pesquisa local, extensões de chamada e otimização semanal orientada por conversões.",
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
    name: "Pacote Completo NODERE",
    content: "# Plano completo para {{company}}\n\nInclui Google Meu Negócio, Google Ads, landing page, rastreamento e acompanhamento comercial para {{segment}} em {{city}}.",
    variables: ["company", "city", "segment", "score", "phone", "website", "google_rating"]
  }
];

router.get("/", async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado para listar propostas." });
    const workspaceId = getRequestWorkspaceId(req);
    const { data, error } = await sb
      .from("nodere_proposals")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    if (isMissingSupabaseSchema(error)) return res.json([]);
    next(error);
  }
});

router.post("/", requireWorkspaceRole("owner", "admin", "operator"), async (req, res, next) => {
  try {
    const body = proposalPayloadSchema.parse(req.body ?? {});
    const workspaceId = getRequestWorkspaceId(req);
    const lead = await getCompanyAsync(body.lead_id, workspaceId);
    if (!lead) return res.status(404).json({ message: "Lead não encontrado para gerar proposta." });
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado para salvar propostas." });
    const commercial = await buildCommercialSnapshot(sb, workspaceId, body.items);
    const row = {
      id: randomUUID(),
      workspace_id: workspaceId,
      lead_id: lead.id,
      title: body.title,
      status: body.status,
      service_type: body.service_type || lead.category || null,
      content: body.content || buildDefaultProposalContent(lead, commercial.items),
      items: commercial.items,
      subtotal: commercial.subtotal,
      discount: commercial.discount,
      total: commercial.total,
      currency: body.currency || "BRL",
      valid_until: body.valid_until || null,
      version: 1,
      created_by: String((req as any).session?.userId || (req as any).admin?.userId || ""),
      metadata: { lead_name: lead.name, lead_city: lead.city, lead_state: lead.state, commercial_snapshot: true }
    };
    const { data, error } = await sb.from("nodere_proposals").insert(row).select("*").single();
    if (error) throw error;
    await insertProposalAudit(workspaceId, row.created_by, "proposal_created", row.id, {
      lead_id: lead.id,
      total: row.total,
      items: commercial.items.map(auditItem)
    }).catch(() => undefined);
    logRequestMetric(req, "proposal_generated", lead.id, { proposalId: row.id, source: "block05" });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

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
      const ai = await callAI("Você é consultor comercial NODERE. Melhore a proposta mantendo dados reais e tom profissional.", rendered);
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
    if (isMissingSupabaseSchema(error)) return res.json([]);
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

router.get("/:id", async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado." });
    const { data, error } = await sb
      .from("nodere_proposals")
      .select("*")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("id", req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Proposta não encontrada." });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireWorkspaceRole("owner", "admin", "operator"), async (req, res, next) => {
  try {
    const body = proposalPayloadSchema.partial().parse(req.body ?? {});
    const workspaceId = getRequestWorkspaceId(req);
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado." });
    const updates: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() };
    if (body.items) {
      const commercial = await buildCommercialSnapshot(sb, workspaceId, body.items);
      updates.items = commercial.items;
      updates.subtotal = commercial.subtotal;
      updates.discount = commercial.discount;
      updates.total = commercial.total;
    }
    const { data, error } = await sb
      .from("nodere_proposals")
      .update(updates)
      .eq("workspace_id", workspaceId)
      .eq("id", req.params.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Proposta não encontrada." });
    await insertProposalAudit(workspaceId, String((req as any).session?.userId || ""), "proposal_updated", String(req.params.id), { status: data.status, items: Array.isArray(data.items) ? data.items.map(auditItem) : [] }).catch(() => undefined);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/pdf", async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado." });
    const workspaceId = getRequestWorkspaceId(req);
    const { data, error } = await sb
      .from("nodere_proposals")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Proposta não encontrada." });
    const lead = data.lead_id ? await getCompanyAsync(String(data.lead_id), workspaceId).catch(() => null) : null;
    const pdf = await renderProposalPdf(data, lead, "proposal");
    await insertProposalAudit(workspaceId, String((req as any).session?.userId || ""), "proposal_pdf_generated", String(req.params.id), { lead_id: data.lead_id }).catch(() => undefined);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="proposta-nodere-${safeFileName(data.title || data.id)}.pdf"`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/contract-pdf", async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado." });
    const workspaceId = getRequestWorkspaceId(req);
    const { data, error } = await sb
      .from("nodere_proposals")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Proposta não encontrada." });
    const lead = data.lead_id ? await getCompanyAsync(String(data.lead_id), workspaceId).catch(() => null) : null;
    const pdf = await renderProposalPdf(data, lead, "contract");
    await insertProposalAudit(workspaceId, String((req as any).session?.userId || ""), "contract_pdf_generated", String(req.params.id), { lead_id: data.lead_id }).catch(() => undefined);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="contrato-nodere-${safeFileName(data.title || data.id)}.pdf"`);
    res.send(pdf);
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

async function buildCommercialSnapshot(sb: NonNullable<ReturnType<typeof getSupabase>>, workspaceId: string, inputItems: Array<z.infer<typeof proposalItemSchema>>) {
  const ids = [...new Set(inputItems.map((item) => item.catalog_item_id))];
  const { data, error } = await sb
    .from("catalog_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .in("id", ids);
  if (error) throw error;
  const catalogById = new Map((data ?? []).map((item: any) => [String(item.id), item]));
  const items = inputItems.map((item) => {
    const catalog = catalogById.get(item.catalog_item_id);
    if (!catalog) {
      const err = new Error("Produto/serviço inativo ou inexistente. Selecione apenas itens ativos do catálogo.") as Error & { status?: number };
      err.status = 422;
      throw err;
    }
    return buildSnapshotItem(catalog, item);
  });
  const subtotal = items.reduce((sum, item) => sum + item.gross_total, 0);
  const discount = items.reduce((sum, item) => sum + item.discount_amount, 0);
  const total = items.reduce((sum, item) => sum + item.final_total, 0);
  return { items, subtotal, discount, total };
}

function buildSnapshotItem(catalog: any, input: z.infer<typeof proposalItemSchema>) {
  const quantity = Number(input.quantity || 0);
  const unitPrice = Number(catalog.promotional_price ?? catalog.price ?? 0);
  const grossTotal = roundMoney(unitPrice * quantity);
  const requestedPercent = Number(input.discount_percent || 0);
  const requestedAmount = Number(input.discount_amount || 0);
  const discountType = input.discount_type || "none";
  if (discountType === "percent" && requestedAmount > 0) throw validationError("Informe desconto por percentual OU por valor, nunca os dois.");
  if (discountType === "amount" && requestedPercent > 0) throw validationError("Informe desconto por percentual OU por valor, nunca os dois.");
  if (discountType === "percent" && requestedPercent <= 0) throw validationError("Informe o percentual de desconto.");
  if (discountType === "amount" && requestedAmount <= 0) throw validationError("Informe o valor do desconto.");
  const hasDiscount = discountType !== "none";
  if (hasDiscount && !String(input.discount_reason || "").trim()) throw validationError("Informe o motivo do desconto.");
  const maxDiscountPct = Number(catalog.max_discount_pct ?? 0);
  if (discountType === "percent" && maxDiscountPct > 0 && requestedPercent > maxDiscountPct) {
    throw validationError(`Desconto acima do máximo permitido para ${catalog.name}.`);
  }
  const discountAmount = discountType === "percent" ? roundMoney(grossTotal * (requestedPercent / 100)) : discountType === "amount" ? roundMoney(requestedAmount) : 0;
  if (discountAmount > grossTotal) throw validationError("Desconto não pode ser maior que o valor bruto do item.");
  return {
    catalog_item_id: catalog.id,
    product_service_id: catalog.id,
    snapshot_name: catalog.name,
    snapshot_description: catalog.description_short || catalog.description_full || "",
    snapshot_commercial_guidance: catalog.commercial_guidance || catalog.scope || catalog.deliverables || "",
    snapshot_billing_unit: catalog.billing_unit || catalog.unit_measure || "unit",
    snapshot_unit_price: unitPrice,
    snapshot_payment_terms: catalog.payment_conditions || "",
    snapshot_payment_method: catalog.payment_method || "",
    snapshot_execution_deadline: catalog.execution_deadline || catalog.execution_time || (catalog.delivery_days ? `${catalog.delivery_days} dias` : ""),
    quantity,
    gross_total: grossTotal,
    discount_type: discountType,
    discount_percent: discountType === "percent" ? requestedPercent : null,
    discount_amount: discountAmount,
    discount_reason: input.discount_reason || null,
    final_total: roundMoney(grossTotal - discountAmount),
    customer_item_note: input.customer_item_note || "",
    internal_item_note: [input.internal_item_note, hasDiscount ? `Desconto aplicado: ${formatMoney(discountAmount)}. Motivo: ${input.discount_reason}` : ""].filter(Boolean).join("\n")
  };
}

function validationError(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 422;
  return err;
}

function roundMoney(value: number) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function auditItem(item: any) {
  return {
    product_service_id: item.product_service_id || item.catalog_item_id,
    name: item.snapshot_name,
    quantity: item.quantity,
    unit_price: item.snapshot_unit_price,
    gross_total: item.gross_total,
    discount_type: item.discount_type,
    discount_percent: item.discount_percent,
    discount_amount: item.discount_amount,
    discount_reason: item.discount_reason,
    final_total: item.final_total
  };
}

function buildDefaultProposalContent(lead: any, items: any[] = []) {
  return [
    `Proposta comercial para ${lead.name}`,
    "",
    `Segmento: ${lead.category || "Não informado"}`,
    `Cidade: ${lead.city || ""}${lead.state ? `/${lead.state}` : ""}`,
    "",
    items.length ? `Itens selecionados: ${items.map((item) => item.snapshot_name).join(", ")}.` : "Escopo inicial: diagnóstico comercial, priorização de oportunidades digitais e execução de campanhas orientadas por conversão.",
    "A NODERE acompanha indicadores, follow-ups e próximos passos dentro do CRM."
  ].join("\n");
}

function safeFileName(value: string) {
  return String(value || "proposta").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function findNoderePdfIcon() {
  const candidates = [
    path.resolve(process.cwd(), "../web/public/android-chrome-192x192.png"),
    path.resolve(process.cwd(), "apps/web/public/android-chrome-192x192.png"),
    path.resolve(process.cwd(), "public/android-chrome-192x192.png")
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function insertProposalAudit(workspaceId: string, userId: string, action: string, resourceId: string, metadata: Record<string, unknown>) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("nodere_audit_logs").insert({
    workspace_id: workspaceId,
    user_id: userId || null,
    action,
    resource_type: "proposal",
    resource_id: resourceId,
    metadata
  });
}

async function renderProposalPdf(proposal: any, lead: any, documentType: "proposal" | "contract" = "proposal") {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const logoPath = findNoderePdfIcon();
    if (logoPath) doc.image(logoPath, 48, 44, { width: 28, height: 28 });
    doc.fillColor("#00382F").fontSize(22).text("NODERE", logoPath ? 86 : 48, 48, { continued: false });
    doc.moveDown(0.4);
    doc.fillColor("#00D69E").fontSize(12).text(documentType === "contract" ? "Contrato comercial" : "Proposta comercial", { continued: false });
    doc.moveDown(1);
    doc.fillColor("#111827").fontSize(18).text(String(proposal.title || "Proposta comercial"));
    if (lead?.name) doc.fontSize(12).fillColor("#374151").text(`Cliente: ${lead.name}`);
    if (lead?.city || lead?.state) doc.text(`Localidade: ${[lead.city, lead.state].filter(Boolean).join(" / ")}`);
    doc.moveDown();
    doc.fontSize(11).fillColor("#1F2937").text(String(proposal.content || ""), { align: "left" });

    const items = Array.isArray(proposal.items) ? proposal.items : [];
    if (items.length) {
      doc.moveDown();
      doc.fillColor("#00382F").fontSize(13).text("Itens da proposta");
      doc.moveDown(0.4);
      items.forEach((item: any) => {
        const name = item.snapshot_name || item.description || "Item do catálogo";
        const description = item.snapshot_description || "";
        const guidance = item.snapshot_commercial_guidance || "";
        doc.fillColor("#111827").fontSize(10).text(name, { continued: false });
        if (description) doc.fillColor("#374151").fontSize(9).text(description);
        if (guidance) doc.fillColor("#374151").fontSize(9).text(`Orientação: ${guidance}`);
        doc.fillColor("#111827").fontSize(9).text(`Qtd./horas: ${item.quantity} ${item.snapshot_billing_unit || ""} | Unitário: ${formatMoney(item.snapshot_unit_price || item.unit_price || 0)} | Bruto: ${formatMoney(item.gross_total ?? item.total ?? 0)} | Desconto: ${formatMoney(item.discount_amount || 0)} | Final: ${formatMoney(item.final_total ?? item.total ?? 0)}`);
        if (item.customer_item_note) doc.fillColor("#374151").fontSize(9).text(`Observação: ${item.customer_item_note}`);
        if (item.snapshot_payment_terms) doc.fillColor("#374151").fontSize(9).text(`Condições: ${item.snapshot_payment_terms}`);
        if (item.snapshot_payment_method) doc.fillColor("#374151").fontSize(9).text(`Forma de pagamento: ${item.snapshot_payment_method}`);
        if (item.snapshot_execution_deadline) doc.fillColor("#374151").fontSize(9).text(`Prazo: ${item.snapshot_execution_deadline}`);
        doc.moveDown(0.4);
      });
    }

    doc.moveDown();
    doc.fillColor("#374151").fontSize(10).text(`Subtotal: ${formatMoney(proposal.subtotal || 0)}`);
    doc.fillColor("#374151").fontSize(10).text(`Descontos: ${formatMoney(proposal.discount || 0)}`);
    doc.fillColor("#00382F").fontSize(12).text(`Total: ${formatMoney(proposal.total || 0)}`);
    if (proposal.valid_until) doc.fillColor("#6B7280").fontSize(9).text(`Validade: ${new Date(proposal.valid_until).toLocaleDateString("pt-BR")}`);
    doc.moveDown(2);
    doc.fillColor("#6B7280").fontSize(9).text("Documento gerado automaticamente pela plataforma NODERE.");
    doc.end();
  });
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default router;
