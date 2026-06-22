import { Router } from "express";
import { getRequestWorkspaceId, isPrivilegedSession, requireWorkspaceMutation } from "../middleware/session.js";
import { consumeCredit, getCredits, getCreditStatus } from "../services/credits.js";

const router = Router();
router.use(requireWorkspaceMutation("owner", "admin", "operator"));

router.get("/", async (req, res, next) => {
  try {
    res.json(await getCredits(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/status", async (req, res, next) => {
  try {
    if (isPrivilegedSession(req)) {
      return res.json({
        total: 999999,
        used: 0,
        remaining: 999999,
        plan: "Owner/Admin",
        expires_at: null,
        trial_expires_at: null,
        renewal_at: null,
        resetAt: "",
        blocked: false,
        trialExpired: false,
        privileged: true
      });
    }
    res.json(await getCreditStatus(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.post("/consume", async (req, res, next) => {
  try {
    if (isPrivilegedSession(req)) {
      return res.json({ remaining: 999999, privileged: true });
    }
    const remaining = await consumeCredit(
      typeof req.body?.type === "string" ? req.body.type : "manual",
      typeof req.body?.description === "string" ? req.body.description : "Uso operacional",
      getRequestWorkspaceId(req)
    );
    res.json({ remaining });
  } catch (error) {
    next(error);
  }
});

export default router;
