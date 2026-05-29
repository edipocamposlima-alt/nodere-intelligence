import { Router } from "express";
import { getPipelineReport, getForecastReport, getMonthlyTrends } from "../services/reports.js";

const router = Router();

router.get("/pipeline", (_req, res) => {
  res.json(getPipelineReport());
});

router.get("/forecast", (_req, res) => {
  res.json(getForecastReport());
});

router.get("/trends", (_req, res) => {
  res.json(getMonthlyTrends());
});

export default router;
