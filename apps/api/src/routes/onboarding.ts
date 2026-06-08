import { Router } from "express";
import { z } from "zod";
import { getRequestWorkspaceId, requireWorkspaceSession } from "../middleware/session.js";
import { getOnboardingStatus, markOnboardingStep } from "../services/onboardingStore.js";

const router = Router();

router.get("/status", requireWorkspaceSession, async (req, res, next) => {
  try {
    const status = await getOnboardingStatus(getRequestWorkspaceId(req));
    res.json(status);
  } catch (error) {
    next(error);
  }
});

router.patch("/step", requireWorkspaceSession, async (req, res, next) => {
  try {
    const body = z.object({ step: z.enum(["search", "crm", "proposal"]) }).parse(req.body);
    const status = await markOnboardingStep(getRequestWorkspaceId(req), body.step);
    res.json(status);
  } catch (error) {
    next(error);
  }
});

export default router;
