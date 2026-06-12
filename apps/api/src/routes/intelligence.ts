import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { config } from "../config.js";
import { getSupabase, hasSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId, requireWorkspaceSession } from "../middleware/session.js";
import { getCompanyAsync, updateCompany } from "../services/companyStore.js";

const router = Router();

router.use(requireWorkspaceSession);

router.post("/enrich/:companyId", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const company = await getCompanyAsync(req.params.companyId, workspaceId);
    if (!company) return res.status(404).json({ error: "Lead não encontrado." });

    const apolloKey = await getWorkspaceSecret(workspaceId, "apollo_key", config.enrichment.apolloApiKey);
    const results: Record<string, unknown> = { apollo: null, receita_federal: null };

    if (apolloKey) {
      try {
        const domain = normalizeDomain(company.website);
        const apolloBody: Record<string, unknown> = domain ? { domain } : { name: company.name };
        const apolloRes = await fetch(`${config.enrichment.apolloApiUrl}/organizations/enrich`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": apolloKey },
          body: JSON.stringify(apolloBody),
          signal: AbortSignal.timeout(15000)
        });
        if (apolloRes.ok) {
          const payload = await apolloRes.json();
          const org = payload.organization ?? payload;
          results.apollo = {
            revenue_range: org.annual_revenue_printed || org.revenue || null,
            employee_count: org.estimated_num_employees ? String(org.estimated_num_employees) : null,
            linkedin_url: org.linkedin_url || null,
            phone_direct: org.phone || null,
            founded_year: org.founded_year || null
          };
        }
      } catch (error) {
        console.error("[intelligence/enrich] Apollo error suppressed", error instanceof Error ? error.message : error);
      }
    }

    if (company.cnpj) {
      try {
        const cnpj = String(company.cnpj).replace(/\D/g, "");
        if (cnpj.length === 14) {
          const rfRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { signal: AbortSignal.timeout(10000) });
          if (rfRes.ok) {
            const rf = await rfRes.json();
            results.receita_federal = {
              cnpj_status: rf.descricao_situacao_cadastral || null,
              cnpj_abertura: rf.data_inicio_atividade || null,
              cnae_principal: rf.cnae_fiscal_descricao || null,
              socios: Array.isArray(rf.qsa) ? rf.qsa.map((s: any) => ({ nome: s.nome_socio, cargo: s.qualificacao_socio })) : [],
              email: rf.email || null,
              phone_direct: rf.ddd_telefone_1 && rf.telefone ? `(${rf.ddd_telefone_1}) ${rf.telefone}` : null
            };
          }
        }
      } catch (error) {
        console.error("[intelligence/enrich] Receita Federal error suppressed", error instanceof Error ? error.message : error);
      }
    }

    const apollo = results.apollo as any;
    const receita = results.receita_federal as any;
    const enrichment = {
      workspace_id: workspaceId,
      company_id: company.id,
      source: "combined",
      raw_data: results,
      email: receita?.email || null,
      phone_direct: apollo?.phone_direct || receita?.phone_direct || null,
      linkedin_url: apollo?.linkedin_url || null,
      revenue_range: apollo?.revenue_range || null,
      employee_count: apollo?.employee_count || null,
      founded_year: apollo?.founded_year || null,
      cnpj_status: receita?.cnpj_status || null,
      cnpj_abertura: receita?.cnpj_abertura || null,
      socios: receita?.socios || null,
      cnae_principal: receita?.cnae_principal || null,
      enriched_at: new Date().toISOString()
    };

    await maybeSupabaseUpsert("nodere_lead_enrichments", enrichment, "workspace_id,company_id,source");

    let potentialScore = Number(company.score || 50);
    if (String(apollo?.revenue_range || "").match(/[MB]/i)) potentialScore += 20;
    if (String(receita?.cnpj_status || "").toLowerCase().includes("ativa")) potentialScore += 10;
    potentialScore = Math.min(100, potentialScore);
    await updateCompany(company.id, { score: potentialScore, updatedAt: new Date().toISOString() } as any, workspaceId).catch(() => undefined);

    return res.json({ enrichment, potential_score: potentialScore, message: "Dados enriquecidos com sucesso." });
  } catch (error) {
    return next(error);
  }
});

router.get("/enrichment/:companyId", async (req, res, next) => {
  try {
    const data = await maybeSupabaseSingle("nodere_lead_enrichments", req.params.companyId, getRequestWorkspaceId(req), "enriched_at");
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.post("/diagnose/:companyId", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const company = await getCompanyAsync(req.params.companyId, workspaceId);
    if (!company) return res.status(404).json({ error: "Lead não encontrado." });

    const openaiKey = await getWorkspaceSecret(workspaceId, "openai_key", config.openai.apiKey);
    if (!openaiKey) return res.status(400).json({ error: "Configure a chave OpenAI em Configurações > Integrações." });

    const enrichment = await maybeSupabaseSingle("nodere_lead_enrichments", company.id, workspaceId, "enriched_at");
    const prompt = buildDiagnosticPrompt(company, enrichment);
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: config.openai.model || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 800,
        temperature: 0.3
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!aiResponse.ok) return res.status(500).json({ error: "Não foi possível gerar o diagnóstico. Verifique a chave OpenAI." });
    const aiData = await aiResponse.json();
    const diagnostic = diagnosticSchema.parse(JSON.parse(aiData.choices?.[0]?.message?.content || "{}"));
    const row = {
      id: randomUUID(),
      workspace_id: workspaceId,
      company_id: company.id,
      ...diagnostic,
      pains: diagnostic.pains,
      needs: diagnostic.needs,
      raw_prompt: prompt,
      generated_at: new Date().toISOString()
    };

    await maybeSupabaseUpsert("nodere_lead_diagnostics", row, "workspace_id,company_id");
    await maybeSupabaseInsert("nodere_ai_usage_log", {
      workspace_id: workspaceId,
      user_id: (req as any).session?.userId || null,
      module: "INTEL-04",
      tokens_used: aiData.usage?.total_tokens || 0,
      metadata: { company_id: company.id }
    });

    return res.json(diagnostic);
  } catch (error) {
    console.error("[intelligence/diagnose]", error instanceof Error ? error.message : error);
    return res.status(500).json({ error: "Erro ao gerar diagnóstico." });
  }
});

router.get("/diagnostic/:companyId", async (req, res, next) => {
  try {
    const data = await maybeSupabaseSingle("nodere_lead_diagnostics", req.params.companyId, getRequestWorkspaceId(req), "generated_at");
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.get("/radar", async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.json([]);
    const { data, error } = await sb
      .from("nodere_growth_radar_alerts")
      .select("*")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) {
    return next(error);
  }
});

router.post("/competitors/:companyId", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const company = await getCompanyAsync(req.params.companyId, workspaceId);
    if (!company) return res.status(404).json({ error: "Lead não encontrado." });
    if (!company.category || !company.city) return res.status(400).json({ error: "Lead precisa ter segmento e cidade para análise competitiva." });

    const googleKey = await getWorkspaceSecret(workspaceId, "google_places_key", config.google.placesKey);
    if (!googleKey) return res.status(400).json({ error: "Configure Google Places no backend ou nas integrações." });

    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", `${company.category} ${company.city}`);
    url.searchParams.set("language", "pt-BR");
    url.searchParams.set("key", googleKey);
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const payload = await response.json();
    const competitors = (payload.results || [])
      .filter((item: any) => item.name !== company.name)
      .slice(0, 5)
      .map((item: any) => ({ name: item.name, rating: item.rating || null, total_ratings: item.user_ratings_total || 0 }));
    const avg = competitors.length ? competitors.reduce((sum: number, item: any) => sum + Number(item.rating || 0), 0) / competitors.length : null;
    return res.json({
      competitors,
      avg_competitor_rating: avg ? Number(avg.toFixed(1)) : null,
      lead_score: company.score,
      gap_message: avg && company.score
        ? `${company.name} tem score ${company.score}, enquanto a média dos concorrentes é ${Math.round(avg * 10)}.`
        : "Dados insuficientes para comparação."
    });
  } catch (error) {
    return next(error);
  }
});

async function getWorkspaceSecret(workspaceId: string, key: string, fallback?: string) {
  if (!hasSupabase()) return fallback;
  const sb = getSupabase()!;
  const { data } = await sb.from("nodere_workspace_settings").select("value").eq("workspace_id", workspaceId).eq("key", key).maybeSingle();
  return String(data?.value || fallback || "");
}

async function maybeSupabaseUpsert(table: string, row: Record<string, unknown>, onConflict: string) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from(table).upsert(row, { onConflict });
  if (error) throw error;
}

async function maybeSupabaseInsert(table: string, row: Record<string, unknown>) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from(table).insert(row);
  if (error) throw error;
}

async function maybeSupabaseSingle(table: string, companyId: string, workspaceId: string, orderColumn: string) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from(table)
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("company_id", companyId)
    .order(orderColumn, { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

function normalizeDomain(value?: string) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  try {
    return new URL(clean.startsWith("http") ? clean : `https://${clean}`).hostname.replace(/^www\./, "");
  } catch {
    return clean.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  }
}

function buildDiagnosticPrompt(company: any, enrichment: any) {
  return `Você é um especialista em inteligência comercial para agências de marketing digital brasileiras.

Analise a empresa abaixo e gere um diagnóstico comercial em português brasileiro.

DADOS DA EMPRESA:
- Nome: ${company.name}
- Segmento: ${company.category || "não informado"}
- Cidade: ${company.city || "não informada"}
- Site: ${company.website || "não possui"}
- Score de presença digital: ${company.score || "não calculado"}/100
${enrichment ? `- Faturamento estimado: ${enrichment.revenue_range || "desconhecido"}
- Funcionários estimados: ${enrichment.employee_count || "desconhecido"}
- CNPJ status: ${enrichment.cnpj_status || "desconhecido"}
- CNAE: ${enrichment.cnae_principal || "desconhecido"}` : ""}

Responda SOMENTE em JSON com esta estrutura:
{"summary":"resumo em 2-3 frases","pains":["dor 1","dor 2","dor 3"],"needs":["necessidade 1","necessidade 2","necessidade 3"],"recommended_product":"produto indicado","propensity":"Alta | Média | Baixa","approach_tip":"dica de abordagem"}`;
}

const diagnosticSchema = z.object({
  summary: z.string().default(""),
  pains: z.array(z.string()).default([]),
  needs: z.array(z.string()).default([]),
  recommended_product: z.string().default(""),
  propensity: z.string().default("Média"),
  approach_tip: z.string().default("")
});

export default router;
