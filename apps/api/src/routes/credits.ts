import { Router } from "express";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { consumeCredit, getCredits, getCreditStatus } from "../services/credits.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await getCredits(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/status", async (req, res, next) => {
  try {
    res.json(await getCreditStatus(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.post("/consume", async (req, res, next) => {
  try {
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
