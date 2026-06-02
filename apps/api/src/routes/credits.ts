import { Router } from "express";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { consumeCredit, getCredits, getCreditStatus } from "../services/credits.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(getCredits(getRequestWorkspaceId(req)));
});

router.get("/status", (req, res) => {
  res.json(getCreditStatus(getRequestWorkspaceId(req)));
});

router.post("/consume", (req, res, next) => {
  try {
    const remaining = consumeCredit(
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
