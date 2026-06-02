import { Router } from "express";
import { getRequestWorkspaceId } from "../middleware/session.js";
import {
  getPipelineReport,
  getForecastReport,
  getMonthlyTrends,
  getFunnelReport,
  getLeadsReport,
  getPerformanceReport,
  getOperatorsReport
} from "../services/reports.js";

const router = Router();

router.get("/pipeline", async (req, res, next) => {
  try {
    res.json(await getPipelineReport(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/forecast", async (req, res, next) => {
  try {
    res.json(await getForecastReport(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/trends", async (req, res, next) => {
  try {
    res.json(await getMonthlyTrends(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/funnel", async (req, res, next) => {
  try {
    res.json(await getFunnelReport(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/leads", async (req, res, next) => {
  try {
    const period = typeof req.query.period === "string" ? req.query.period : "30d";
    res.json(await getLeadsReport(getRequestWorkspaceId(req), period));
  } catch (error) {
    next(error);
  }
});

router.get("/performance", async (req, res, next) => {
  try {
    res.json(await getPerformanceReport(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/operators", async (req, res, next) => {
  try {
    res.json(await getOperatorsReport(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

export default router;
