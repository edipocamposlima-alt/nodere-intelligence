import { Router } from "express";
import { z } from "zod";
import { searchCompaniesWithMeta } from "../services/companyStore.js";

const router = Router();

const schema = z.object({
  city: z.string().min(2),
  state: z.string().optional(),
  segment: z.string().min(2),
  keyword: z.string().optional()
});

router.post("/", async (req, res, next) => {
  try {
    const input = schema.parse(req.body);
    const result = await searchCompaniesWithMeta(input);
    res.status(201).json({
      search: {
        ...input,
        createdAt: new Date().toISOString(),
        resultCount: result.companies.length,
        source: result.source,
        warning: result.warning,
        error: result.error
      },
      companies: result.companies
    });
  } catch (error) {
    next(error);
  }
});

export default router;
