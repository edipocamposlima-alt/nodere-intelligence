import { Router } from "express";
import { z } from "zod";
import { getRequestWorkspaceId, isPrivilegedSession } from "../middleware/session.js";
import { filterUnsavedSearchResults, findExistingCrmLead, searchCompaniesWithMeta } from "../services/companyStore.js";
import { consumeSearch } from "../services/credits.js";
import { listSearchHistory, saveSearch, getSearch, touchSearch } from "../db/searchHistory.js";
import { calculateOpportunityScore } from "../services/scoring.js";
import { config } from "../config.js";
import { markOnboardingStep } from "../services/onboardingStore.js";
import { logRequestMetric } from "../services/metricsStore.js";
import type { Company } from "../types.js";

const router = Router();
const apolloSearchSchema = z.object({
  type: z.enum(["companies", "people"]).default("companies"),
  companyName: z.string().optional(),
  domain: z.string().optional(),
  personName: z.string().optional(),
  title: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  page: z.coerce.number().min(1).max(20).default(1),
  perPage: z.coerce.number().min(1).max(25).default(10)
}).refine(
  (input) => [input.companyName, input.domain, input.personName, input.title, input.city, input.state].some((value) => value && value.trim().length >= 2),
  { message: "Informe pelo menos empresa, domínio, pessoa, cargo, cidade ou estado para buscar no Apollo." }
);

const searchSchema = z.object({
  mode: z.enum(["places", "cnpj", "global"]).optional(),
  companyName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  segment: z.string().optional(),
  keyword: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(1).max(50).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxRating: z.coerce.number().min(0).max(5).optional(),
  hasWebsite: z.boolean().nullable().optional(),
  hasWhatsApp: z.boolean().nullable().optional(),
  minReviews: z.coerce.number().min(0).optional(),
  sortBy: z.enum(["relevance", "rating", "review_count", "nodere_score"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional()
}).refine(
  (input) => [input.companyName, input.city, input.state, input.segment, input.keyword].some((value) => value && value.trim().length >= 2),
  { message: "Informe nome da empresa, segmento, cidade, estado ou palavra-chave." }
);

router.get("/", async (req, res, next) => {
  try {
    res.json(await listSearchHistory(getRequestWorkspaceId(req)));
  } catch (err) { next(err); }
});

router.get("/cnpj", async (req, res, next) => {
  try {
    const cnpj = cleanCnpj(String(req.query.q || req.query.cnpj || ""));
    if (!cnpj || !isValidCnpj(cnpj)) {
      return res.status(400).json({ message: "CNPJ inválido. Informe um CNPJ completo com 14 dígitos." });
    }

    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.status === "ERROR") {
      return res.status(502).json({ message: payload?.message || "ReceitaWS não retornou dados para este CNPJ." });
    }

    const base = {
      id: `cnpj-${cnpj}`,
      name: payload.fantasia || payload.nome || `CNPJ ${cnpj}`,
      category: payload.atividade_principal?.[0]?.text || "Empresa",
      city: payload.municipio || "",
      state: payload.uf || "",
      address: [payload.logradouro, payload.numero, payload.bairro, payload.municipio, payload.uf].filter(Boolean).join(", "),
      phone: normalizePhone(payload.telefone || ""),
      whatsapp: normalizeWhatsapp(payload.telefone || ""),
      website: "",
      cnpj,
      legalName: payload.nome,
      razaoSocial: payload.nome,
      nomeFantasia: payload.fantasia,
      cnaePrincipal: payload.atividade_principal?.[0]?.text,
      cnaesSecundarios: payload.atividades_secundarias?.map?.((item: { text?: string }) => item.text).filter(Boolean) ?? [],
      porte: payload.porte,
      naturezaJuridica: payload.natureza_juridica,
      dataAbertura: payload.abertura,
      situacaoCadastral: payload.situacao,
      capitalSocial: payload.capital_social,
      customFields: { socios: payload.qsa ?? [] },
      status: "Novo Lead" as const,
      score: 0,
      opportunityLevel: "Baixa" as const,
      detectedOpportunities: [],
      suggestions: [],
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const company = { ...base, ...calculateOpportunityScore(base) };
    const duplicate = await findExistingCrmLead(company, getRequestWorkspaceId(req));
    if (duplicate) {
      return res.json({
        company: duplicate.company,
        existing: true,
        message: "Lead já consta no banco de dados NODERE.",
        source: "crm"
      });
    }
    return res.json({ company, source: "receitaws" });
  } catch (error) {
    return next(error);
  }
});


router.post("/apollo", async (req, res, next) => {
  try {
    if (!config.enrichment.apolloApiKey) {
      return res.status(503).json({
        configured: false,
        code: "APOLLO_NOT_CONFIGURED",
        error: "Apollo.io não configurado. Configure sua chave em Integrações.",
        message: "Apollo.io não está configurado neste workspace. Defina APOLLO_API_KEY no Render/Admin para executar busca real.",
        results: [],
        count: 0
      });
    }

    const input = apolloSearchSchema.parse(req.body);
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": config.enrichment.apolloApiKey
    };
    const endpoint = input.type === "people" ? "/mixed_people/search" : "/mixed_companies/search";
    const payload = input.type === "people"
      ? {
          q_person_name: input.personName || undefined,
          q_keywords: [input.companyName, input.title].filter(Boolean).join(" ") || undefined,
          person_titles: input.title ? [input.title] : undefined,
          organization_locations: [input.city, input.state, input.country].filter(Boolean),
          page: input.page,
          per_page: input.perPage
        }
      : {
          q_organization_name: input.companyName || undefined,
          q_organization_domains: input.domain || undefined,
          organization_locations: [input.city, input.state, input.country].filter(Boolean),
          page: input.page,
          per_page: input.perPage
        };

    const response = await fetch(`${config.enrichment.apolloApiUrl}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });
    const rawText = await response.text();
    let raw: any = {};
    try {
      raw = rawText ? JSON.parse(rawText) : {};
    } catch {
      raw = { message: rawText.slice(0, 260) };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        code: response.status === 403 ? "APOLLO_FORBIDDEN" : response.status === 401 ? "APOLLO_INVALID_KEY" : "APOLLO_HTTP_ERROR",
        message: response.status === 403
          ? "Apollo.io recusou este endpoint. Verifique se a chave tem plano/API com acesso a busca de empresas/pessoas."
          : raw?.message || raw?.error || `Apollo.io retornou HTTP ${response.status}`,
        detail: sanitizeApolloDetail(rawText)
      });
    }

    const rows = input.type === "people"
      ? (Array.isArray(raw.people) ? raw.people : [])
      : (Array.isArray(raw.organizations) ? raw.organizations : Array.isArray(raw.accounts) ? raw.accounts : []);

    const results = rows.slice(0, input.perPage).map((item: any, index: number) => input.type === "people"
      ? {
          id: `apollo-person-${item.id || index}`,
          type: "person",
          name: item.name || [item.first_name, item.last_name].filter(Boolean).join(" "),
          title: item.title || item.headline || "",
          companyName: item.organization?.name || item.account?.name || item.organization_name || "",
          email: item.email || "",
          linkedin: normalizeLinkedInUrl(item.linkedin_url),
          city: item.city || "",
          state: item.state || "",
          source: "apollo"
        }
      : {
          id: `apollo-company-${item.id || index}`,
          type: "company",
          name: item.name || item.organization_name || item.account_name || "",
          domain: item.primary_domain || item.website_url || item.domain || "",
          linkedin: normalizeLinkedInUrl(item.linkedin_url || item.linkedin),
          city: item.city || item.raw_address || "",
          state: item.state || "",
          employeeCount: item.estimated_num_employees || item.num_employees || item.employee_count || "",
          revenueRange: item.annual_revenue_printed || item.revenue_range || "",
          source: "apollo"
        });

    return res.json({ source: "apollo", type: input.type, count: results.length, results });
  } catch (error) {
    return next(error);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const search = await getSearch(req.params.id, getRequestWorkspaceId(req));
    if (!search) return res.status(404).json({ message: "Search not found" });
    return res.json(search);
  } catch (err) { return next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const input = searchSchema.parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    if (!isPrivilegedSession(req)) {
      await consumeSearch([input.companyName, input.segment, input.keyword, input.city, input.state].filter(Boolean).join(" "), workspaceId);
    }
    const result = await searchCompaniesWithMeta(input, workspaceId);
    const filteredByCrm = await filterUnsavedSearchResults(result.companies as Company[], workspaceId);
    const companies = filterAndSortCompanies(filteredByCrm.companies as Company[], input);
    const companyIds = companies.map((c) => c.id);
    if (companies.length > 0) {
      await markOnboardingStep(workspaceId, "search").catch(() => undefined);
    }

    const saved = await saveSearch(
      {
        city: input.city || "",
        state: input.state,
        segment: input.segment || input.companyName || input.keyword || "Busca livre",
        keyword: input.keyword || input.companyName
      },
      companies.length,
      result.source,
      companyIds,
      workspaceId
    );
    logRequestMetric(req, "search_performed", null, {
      query: [input.companyName, input.segment, input.keyword, input.city, input.state].filter(Boolean).join(" "),
      resultCount: companies.length,
      source: result.source
    });

    res.status(201).json({
      search: {
        id: saved.id,
        ...input,
        createdAt: saved.createdAt,
        resultCount: companies.length,
        source: result.source,
        warning: (result as any).warning,
        error: (result as any).error,
        existingCount: filteredByCrm.duplicates.length,
        existingMessage: filteredByCrm.duplicates.length ? "Lead já consta no banco de dados NODERE." : undefined
      },
      companies,
      duplicates: filteredByCrm.duplicates.map((item) => ({
        id: item.company.id,
        name: item.company.name,
        existingId: item.existing.id,
        reason: item.reason,
        message: "Lead já consta no banco de dados NODERE."
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/rerun", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const saved = await getSearch(req.params.id, workspaceId);
    if (!saved) return res.status(404).json({ message: "Search not found" });

    const result = await searchCompaniesWithMeta({
      city: saved.city,
      state: saved.state,
      segment: saved.segment,
      keyword: saved.keyword
    }, workspaceId);
    const filteredByCrm = await filterUnsavedSearchResults(result.companies as Company[], workspaceId);
    const companies = filterAndSortCompanies(filteredByCrm.companies as Company[], {});
    if (companies.length > 0) {
      await markOnboardingStep(workspaceId, "search").catch(() => undefined);
    }

    const companyIds = companies.map((c) => c.id);
    if (!isPrivilegedSession(req)) {
      await consumeSearch(`${saved.segment} em ${saved.city} (rerun)`, workspaceId);
    }
    await touchSearch(saved.id, companies.length, result.source, companyIds, workspaceId);
    logRequestMetric(req, "search_performed", null, {
      query: `${saved.segment} em ${saved.city}`,
      resultCount: companies.length,
      source: result.source,
      rerun: true
    });

    return res.json({
      search: {
        id: saved.id,
        city: saved.city,
        state: saved.state,
        segment: saved.segment,
        keyword: saved.keyword,
        lastRanAt: saved.lastRanAt,
        resultCount: companies.length,
        source: result.source,
        warning: (result as any).warning,
        existingCount: filteredByCrm.duplicates.length,
        existingMessage: filteredByCrm.duplicates.length ? "Lead já consta no banco de dados NODERE." : undefined
      },
      companies,
      duplicates: filteredByCrm.duplicates.map((item) => ({
        id: item.company.id,
        name: item.company.name,
        existingId: item.existing.id,
        reason: item.reason,
        message: "Lead já consta no banco de dados NODERE."
      }))
    });
  } catch (error) {
    return next(error);
  }
});

export default router;


function sanitizeApolloDetail(value: string) {
  return String(value || "")
    .replace(/sk-[A-Za-z0-9_-]+|AIza[0-9A-Za-z_-]+|[A-Za-z0-9_-]{24,}/g, "[secret]")
    .slice(0, 260);
}

function normalizeLinkedInUrl(value?: string) {
  if (!value) return "";
  const clean = String(value).trim();
  if (!clean) return "";
  try {
    const url = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
    if (!url.hostname.includes("linkedin.com")) return "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}
function cleanCnpj(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCnpj(value: string) {
  const cnpj = cleanCnpj(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = (base: string, factors: number[]) => {
    const sum = factors.reduce((total, factor, index) => total + Number(base[index]) * factor, 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const d1 = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(cnpj.slice(0, 12) + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${d1}${d2}`);
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

function normalizeWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  return local.length === 11 && local[2] === "9" ? (digits.startsWith("55") ? `+${digits}` : `+55${digits}`) : "";
}

function filterAndSortCompanies<T extends { rating?: number; reviewCount?: number; website?: string; whatsapp?: string; score?: number; nodereScore?: number }>(companies: T[], input: Partial<z.infer<typeof searchSchema>>) {
  const filtered = companies.filter((company) => {
    if (input.minRating !== undefined && (company.rating ?? 0) < input.minRating) return false;
    if (input.maxRating !== undefined && (company.rating ?? 0) > input.maxRating) return false;
    if (input.minReviews !== undefined && (company.reviewCount ?? 0) < input.minReviews) return false;
    if (input.hasWebsite !== null && input.hasWebsite !== undefined && Boolean(company.website) !== input.hasWebsite) return false;
    if (input.hasWhatsApp !== null && input.hasWhatsApp !== undefined && Boolean(company.whatsapp) !== input.hasWhatsApp) return false;
    return true;
  });
  const dir = input.sortDir === "asc" ? 1 : -1;
  const sortBy = input.sortBy || "nodere_score";
  return filtered.sort((a, b) => {
    const av = sortBy === "rating" ? (a.rating ?? 0) : sortBy === "review_count" ? (a.reviewCount ?? 0) : sortBy === "relevance" ? (a.score ?? 0) : (a.nodereScore ?? (a.score ?? 0) * 10);
    const bv = sortBy === "rating" ? (b.rating ?? 0) : sortBy === "review_count" ? (b.reviewCount ?? 0) : sortBy === "relevance" ? (b.score ?? 0) : (b.nodereScore ?? (b.score ?? 0) * 10);
    return (av - bv) * dir;
  });
}




