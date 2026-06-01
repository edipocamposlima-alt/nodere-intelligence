import { Router } from "express";
import { getDashboardMetricsAsync } from "../services/companyStore.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    res.json(await getDashboardMetricsAsync());
  } catch (err) {
    next(err);
  }
});

export default router;
