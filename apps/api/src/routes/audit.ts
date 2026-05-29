import { Router } from "express";
import { getAuditLog } from "../services/auditLog.js";

const router = Router();

router.get("/", (req, res) => {
  const limit = Math.min(500, Number(req.query.limit ?? 100));
  res.json(getAuditLog(limit));
});

export default router;
