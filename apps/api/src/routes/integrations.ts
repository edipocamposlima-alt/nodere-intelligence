import { Router } from "express";
import { getIntegrationStatus } from "../services/integrationStatus.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getIntegrationStatus());
});

router.get("/health", (_req, res) => {
  const integrations = getIntegrationStatus();
  res.json({
    readyForRealSearch: integrations.filter((item) => item.required).every((item) => item.configured),
    configured: integrations.filter((item) => item.configured).length,
    total: integrations.length,
    integrations
  });
});

export default router;
