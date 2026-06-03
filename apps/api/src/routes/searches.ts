import { Router } from "express";
import { z } from "zod";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { searchCompaniesWithMeta } from "../services/companyStore.js";
import { consumeSearch } from "../services/credits.js";
import { listSearchHistory, saveSearch, getSearch, touchSearch } from "../db/searchHistory.js";
import { calculateOpportunityScore } from "../services/scoring.js";

const router = Router();

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
  radiusKm: z.coerce.number().min(1).max(50).optional()
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
    return res.json({ company, source: "receitaws" });
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
    await consumeSearch([input.companyName, input.segment, input.keyword, input.city, input.state].filter(Boolean).join(" "), workspaceId);
    const result = await searchCompaniesWithMeta(input, workspaceId);
    const companyIds = result.companies.map((c) => c.id);

    const saved = await saveSearch(
      {
        city: input.city || "",
        state: input.state,
        segment: input.segment || input.companyName || input.keyword || "Busca livre",
        keyword: input.keyword || input.companyName
      },
      result.companies.length,
      result.source,
      companyIds,
      workspaceId
    );

    res.status(201).json({
      search: {
        id: saved.id,
        ...input,
        createdAt: saved.createdAt,
        resultCount: result.companies.length,
        source: result.source,
        warning: (result as any).warning,
        error: (result as any).error
      },
      companies: result.companies
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

    const companyIds = result.companies.map((c) => c.id);
    await consumeSearch(`${saved.segment} em ${saved.city} (rerun)`, workspaceId);
    await touchSearch(saved.id, result.companies.length, result.source, companyIds, workspaceId);

    return res.json({
      search: {
        id: saved.id,
        city: saved.city,
        state: saved.state,
        segment: saved.segment,
        keyword: saved.keyword,
        lastRanAt: saved.lastRanAt,
        resultCount: result.companies.length,
        source: result.source,
        warning: (result as any).warning
      },
      companies: result.companies
    });
  } catch (error) {
    return next(error);
  }
});

export default router;

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
