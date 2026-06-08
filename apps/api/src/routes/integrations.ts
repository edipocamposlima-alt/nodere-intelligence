import { Router } from "express";
import { config } from "../config.js";
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

router.get("/status", (_req, res) => {
  const integrations = getIntegrationStatus();
  res.json({
    ok: true,
    readyForRealSearch: integrations.filter((item) => item.required).every((item) => item.configured),
    configured: integrations.filter((item) => item.configured).length,
    total: integrations.length,
    checkedAt: new Date().toISOString(),
    integrations
  });
});

router.get("/bling/connect", (_req, res) => {
  if (!config.marketplace.blingClientId || !config.marketplace.blingClientSecret) {
    return res.status(503).json({
      code: "BLING_NOT_CONFIGURED",
      message: "Configure BLING_CLIENT_ID e BLING_CLIENT_SECRET no Render para conectar o Bling ERP."
    });
  }
  const redirectUri = `${config.frontendUrl.replace(/\/+$/, "")}/integrations?platform=bling`;
  const url = new URL("https://www.bling.com.br/Api/v3/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.marketplace.blingClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", "nodere-bling");
  return res.redirect(url.toString());
});

router.get("/rdstation/connect", (_req, res) => {
  if (!config.marketplace.rdStationClientId || !config.marketplace.rdStationClientSecret) {
    return res.status(503).json({
      code: "RDSTATION_NOT_CONFIGURED",
      message: "Configure RDSTATION_CLIENT_ID e RDSTATION_CLIENT_SECRET no Render para conectar o RD Station."
    });
  }
  const redirectUri = `${config.frontendUrl.replace(/\/+$/, "")}/integrations?platform=rdstation`;
  const url = new URL("https://api.rd.services/auth/dialog");
  url.searchParams.set("client_id", config.marketplace.rdStationClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", "nodere-rdstation");
  return res.redirect(url.toString());
});

export default router;
