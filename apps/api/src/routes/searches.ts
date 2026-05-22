import { Router } from "express";
import { z } from "zod";
import { searchCompanies } from "../services/companyStore.js";

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
    const result = await searchCompanies(input);
    res.status(201).json({
      search: { ...input, createdAt: new Date().toISOString(), resultCount: result.length },
      companies: result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
