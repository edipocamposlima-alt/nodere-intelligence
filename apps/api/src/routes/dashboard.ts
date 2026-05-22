import { Router } from "express";
import { getDashboardMetrics } from "../services/companyStore.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getDashboardMetrics());
});

export default router;
