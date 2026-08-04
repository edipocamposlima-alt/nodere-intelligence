import { Router } from "express";
import { getRequestWorkspaceId, requireWorkspaceMutation } from "../middleware/session.js";
import { consumeCredit, getCredits, getCreditStatus } from "../services/credits.js";
import { getAccountEntitlement } from "../services/entitlements.js";

const router = Router();
router.use(requireWorkspaceMutation("owner", "admin", "operator"));

router.get("/", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    res.json(await getCredits(workspaceId, await getAccountEntitlement({ ...(req as any).session, workspaceId })));
  } catch (error) {
    next(error);
  }
});

router.get("/status", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    res.json(await getCreditStatus(workspaceId, await getAccountEntitlement({ ...(req as any).session, workspaceId })));
  } catch (error) {
    next(error);
  }
});

router.post("/consume", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const entitlement = await getAccountEntitlement({ ...(req as any).session, workspaceId });
    const remaining = await consumeCredit(
      typeof req.body?.type === "string" ? req.body.type : "manual",
      typeof req.body?.description === "string" ? req.body.description : "Uso operacional",
      workspaceId,
      entitlement
    );
    res.json({ remaining });
  } catch (error) {
    next(error);
  }
});

export default router;
