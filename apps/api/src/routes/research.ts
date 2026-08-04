import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId, requireWorkspaceMutation, requireWorkspaceRole } from "../middleware/session.js";
import { getCompanyAsync, updateCompany } from "../services/companyStore.js";
import { emitDomainEvent } from "../services/domainEvents.js";
import { runPublicResearch } from "../services/publicResearch.js";
import { consumeSearch } from "../services/credits.js";
import { getAccountEntitlement } from "../services/entitlements.js";

const router = Router();
const runSchema = z.object({
  query: z.string().trim().min(2).max(500),
  companyId: z.string().trim().min(1).max(200).optional().nullable(),
  mode: z.enum(["quick", "complete", "batch", "refresh"]).default("complete")
});

router.get("/", requireWorkspaceRole("owner", "admin", "operator", "viewer"), async (req, res, next) => {
  try {
    const sb = requireDatabase();
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 30)));
    let query = sb.from("nodere_research_runs").select("*").eq("workspace_id", getRequestWorkspaceId(req)).order("created_at", { ascending: false }).limit(limit);
    if (req.query.companyId) query = query.eq("company_id", String(req.query.companyId));
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) { next(error); }
});

router.post("/run", requireWorkspaceMutation("owner", "admin", "operator"), async (req: any, res, next) => {
  try {
    const input = runSchema.parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    const company = input.companyId ? await getCompanyAsync(input.companyId, workspaceId) : null;
    if (input.companyId && !company) return res.status(404).json({ message: "Empresa não encontrada neste workspace." });
    const entitlement = await getAccountEntitlement({ ...req.session, workspaceId });
    await consumeSearch(`pesquisa pública: ${input.query}`, workspaceId, entitlement);
    const id = randomUUID();
    const result = await runPublicResearch({ query: input.query, company, mode: input.mode });
    const row = {
      id,
      workspace_id: workspaceId,
      company_id: company?.id || null,
      query: input.query,
      mode: input.mode,
      status: "review",
      facts: result.facts,
      signals: result.signals,
      inferences: result.inferences,
      opportunities: result.opportunities,
      recommended_services: result.recommendedServices,
      sources: result.sources,
      identity_confidence: result.identityConfidence,
      data_confidence: result.dataConfidence,
      commercial_score: result.commercialScore,
      requested_by: req.session?.userId || req.session?.email || null,
      metadata: { provider: result.provider, providerWarning: result.providerWarning || null, reviewRequired: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await requireDatabase().from("nodere_research_runs").insert(row).select("*").single();
    if (error) throw error;
    await emitDomainEvent({ workspaceId, aggregateType: "company", aggregateId: company?.id || id, eventType: "research.completed", actorId: row.requested_by, payload: { researchRunId: id, sourceCount: result.sources.length, commercialScore: result.commercialScore, reviewRequired: true } });
    res.status(201).json(data);
  } catch (error) { next(error); }
});

router.post("/batch", requireWorkspaceMutation("owner", "admin", "operator"), async (req: any, res, next) => {
  try {
    const input = z.object({ queries: z.array(z.string().trim().min(2).max(500)).min(1).max(20) }).parse(req.body ?? {});
    const workspaceId = getRequestWorkspaceId(req);
    const entitlement = await getAccountEntitlement({ ...req.session, workspaceId });
    const uniqueQueries = [...new Set(input.queries.map((query) => query.trim()))];
    const rows = [];
    for (const query of uniqueQueries) {
      await consumeSearch(`pesquisa pública em lote: ${query}`, workspaceId, entitlement);
      const result = await runPublicResearch({ query, company: null, mode: "batch" });
      rows.push({
        id: randomUUID(), workspace_id: workspaceId, company_id: null, query, mode: "batch", status: "review",
        facts: result.facts, signals: result.signals, inferences: result.inferences, opportunities: result.opportunities,
        recommended_services: result.recommendedServices, sources: result.sources,
        identity_confidence: result.identityConfidence, data_confidence: result.dataConfidence, commercial_score: result.commercialScore,
        requested_by: req.session?.userId || req.session?.email || null,
        metadata: { provider: result.provider, providerWarning: result.providerWarning || null, reviewRequired: true, batchSize: uniqueQueries.length },
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      });
    }
    const { data, error } = await requireDatabase().from("nodere_research_runs").insert(rows).select("*");
    if (error) throw error;
    await emitDomainEvent({ workspaceId, aggregateType: "research_batch", aggregateId: randomUUID(), eventType: "research.batch_completed", actorId: req.session?.userId || null, payload: { count: rows.length, sourceCount: rows.reduce((sum, row) => sum + row.sources.length, 0) } });
    return res.status(201).json({ count: data?.length || 0, runs: data || [] });
  } catch (error) { return next(error); }
});

router.post("/:id/approve", requireWorkspaceMutation("owner", "admin", "operator"), async (req: any, res, next) => {
  try {
    z.object({ confirmed: z.literal(true) }).parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    const { data, error } = await requireDatabase().from("nodere_research_runs").update({ status: "approved", approved_by: req.session?.userId || req.session?.email || null, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("workspace_id", workspaceId).eq("id", req.params.id).eq("status", "review").select("*").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(409).json({ message: "Pesquisa não está aguardando revisão ou não pertence ao workspace." });
    await emitDomainEvent({ workspaceId, aggregateType: "research", aggregateId: req.params.id, eventType: "research.approved", actorId: req.session?.userId || null, payload: { companyId: data.company_id } });
    res.json(data);
  } catch (error) { next(error); }
});

router.post("/:id/persist", requireWorkspaceMutation("owner", "admin", "operator"), async (req: any, res, next) => {
  try {
    z.object({ confirmed: z.literal(true) }).parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    const sb = requireDatabase();
    const { data: run, error } = await sb.from("nodere_research_runs").select("*").eq("workspace_id", workspaceId).eq("id", req.params.id).maybeSingle();
    if (error) throw error;
    if (!run || run.status !== "approved") return res.status(409).json({ message: "A pesquisa precisa ser aprovada antes de persistir." });
    if (!run.company_id) return res.status(400).json({ message: "Esta pesquisa não está vinculada a uma empresa." });
    const company = await getCompanyAsync(String(run.company_id), workspaceId);
    if (!company) return res.status(404).json({ message: "Empresa não encontrada." });
    const facts = Array.isArray(run.facts) ? run.facts : [];
    const opportunities = Array.isArray(run.opportunities) ? run.opportunities : [];
    const summary = facts.map((item: any) => item.statement).filter(Boolean).slice(0, 8).join(" ");
    const updated = await updateCompany(company.id, {
      businessSummary: summary || company.businessSummary,
      commercialScore: Number(run.commercial_score || company.commercialScore || 0),
      opportunitySignals: opportunities.map((item: any) => String(item.statement || "")).filter(Boolean),
      enrichmentSources: (run.sources || []).map((source: any) => String(source.url || "")).filter(Boolean)
    }, workspaceId);
    const now = new Date().toISOString();
    const { data, error: updateError } = await sb.from("nodere_research_runs").update({ status: "persisted", persisted_at: now, updated_at: now }).eq("workspace_id", workspaceId).eq("id", req.params.id).select("*").single();
    if (updateError) throw updateError;
    await emitDomainEvent({ workspaceId, aggregateType: "company", aggregateId: company.id, eventType: "research.persisted", actorId: req.session?.userId || null, payload: { researchRunId: req.params.id } });
    res.json({ research: data, company: updated });
  } catch (error) { next(error); }
});

function requireDatabase() {
  const sb = getSupabase();
  if (!sb) {
    const error = new Error("Supabase não configurado para persistir pesquisas.") as Error & { status?: number };
    error.status = 503;
    throw error;
  }
  return sb;
}

export default router;
