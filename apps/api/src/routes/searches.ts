import { Router } from "express";
import { z } from "zod";
import { searchCompaniesWithMeta } from "../services/companyStore.js";
import { consumeSearch } from "../services/credits.js";
import { listSearchHistory, saveSearch, getSearch, touchSearch } from "../db/searchHistory.js";

const router = Router();

const searchSchema = z.object({
  city: z.string().min(2),
  state: z.string().optional(),
  segment: z.string().min(2),
  keyword: z.string().optional()
});

router.get("/", async (_req, res, next) => {
  try {
    res.json(await listSearchHistory());
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const search = await getSearch(req.params.id);
    if (!search) return res.status(404).json({ message: "Search not found" });
    return res.json(search);
  } catch (err) { return next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const input = searchSchema.parse(req.body);
    const result = await searchCompaniesWithMeta(input);
    const companyIds = result.companies.map((c) => c.id);

    consumeSearch(`${input.segment} em ${input.city}`);

    const saved = await saveSearch(input, result.companies.length, result.source, companyIds);

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
    const saved = await getSearch(req.params.id);
    if (!saved) return res.status(404).json({ message: "Search not found" });

    const result = await searchCompaniesWithMeta({
      city: saved.city,
      state: saved.state,
      segment: saved.segment,
      keyword: saved.keyword
    });

    const companyIds = result.companies.map((c) => c.id);
    consumeSearch(`${saved.segment} em ${saved.city} (rerun)`);
    await touchSearch(saved.id, result.companies.length, result.source, companyIds);

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
