import { Router } from "express";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { getDashboardMetricsAsync } from "../services/companyStore.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await getDashboardMetricsAsync(getRequestWorkspaceId(req)));
  } catch (err) {
    next(err);
  }
});

export default router;
