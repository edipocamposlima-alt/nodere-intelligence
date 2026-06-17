import { Router } from "express";
import { getRequestWorkspaceId, requireWorkspaceRole } from "../middleware/session.js";
import { listCompaniesAsync } from "../services/companyStore.js";
import { getAppSettings } from "../services/settingsStore.js";
import { listSearchHistory } from "../db/searchHistory.js";
import { getAuditLog } from "../services/auditLog.js";

const router = Router();

router.get("/export", requireWorkspaceRole("owner", "admin"), async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const payload = {
      app: "NODERE Nexus",
      workspaceId,
      exportedAt: new Date().toISOString(),
      companies: await listCompaniesAsync(workspaceId),
      searches: await listSearchHistory(workspaceId),
      settings: await getAppSettings(workspaceId),
      audit: getAuditLog(500)
    };
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="nodere-backup-${workspaceId}-${Date.now()}.json"`);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
