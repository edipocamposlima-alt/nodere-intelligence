import { Router } from "express";
import { z } from "zod";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { searchCompaniesWithMeta } from "../services/companyStore.js";
import { consumeSearch } from "../services/credits.js";
import { listSearchHistory, saveSearch, getSearch, touchSearch } from "../db/searchHistory.js";

const router = Router();

const searchSchema = z.object({
  companyName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  segment: z.string().optional(),
  keyword: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional()
}).refine(
  (input) => [input.companyName, input.city, input.state, input.segment, input.keyword].some((value) => value && value.trim().length >= 2),
  { message: "Informe nome da empresa, segmento, cidade, estado ou palavra-chave." }
);

router.get("/", async (req, res, next) => {
  try {
    res.json(await listSearchHistory(getRequestWorkspaceId(req)));
  } catch (err) { next(err); }
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
    const result = await searchCompaniesWithMeta(input, workspaceId);
    const companyIds = result.companies.map((c) => c.id);

    consumeSearch([input.companyName, input.segment, input.keyword, input.city, input.state].filter(Boolean).join(" "));

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
    consumeSearch(`${saved.segment} em ${saved.city} (rerun)`);
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
