import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
  createCatalogItem,
  createProposal,
  listCatalogItems,
  listProposalAudit,
  listProposals,
  getProposal,
  proposalPdfBuffer,
  updateCatalogItem,
  updateProposal
} from "../services/commercial.js";

const router = Router();

router.use(authenticate);

router.get("/context", (req, res) => {
  res.json({
    userId: req.user.id,
    workspaceId: req.user.workspace_id,
    role: req.user.role,
    canManageCatalog: ["admin", "owner"].includes(req.user.role),
    canWriteProposals: ["operator", "manager", "admin", "owner"].includes(req.user.role)
  });
});

router.get("/catalog", async (req, res, next) => {
  try {
    const activeOnly = req.query.activeOnly === "true";
    res.json(await listCatalogItems(req.user, activeOnly));
  } catch (error) {
    next(error);
  }
});

router.post("/catalog", requireRole("admin", "owner"), async (req, res, next) => {
  try {
    res.status(201).json(await createCatalogItem(req.user, req.body));
  } catch (error) {
    next(error);
  }
});

router.patch("/catalog/:id", requireRole("admin", "owner"), async (req, res, next) => {
  try {
    const item = await updateCatalogItem(req.user, String(req.params.id), req.body);
    if (!item) return res.status(404).json({ error: "Item nao encontrado." });
    return res.json(item);
  } catch (error) {
    return next(error);
  }
});

router.get("/proposals", async (req, res, next) => {
  try {
    res.json(await listProposals(req.user));
  } catch (error) {
    next(error);
  }
});

router.post("/proposals", requireRole("operator"), async (req, res, next) => {
  try {
    res.status(201).json(await createProposal(req.user, req.body));
  } catch (error) {
    next(error);
  }
});

router.get("/proposals/:id", async (req, res, next) => {
  try {
    const proposal = await getProposal(req.user, String(req.params.id));
    if (!proposal) return res.status(404).json({ error: "Proposta nao encontrada." });
    return res.json(proposal);
  } catch (error) {
    return next(error);
  }
});

router.patch("/proposals/:id", requireRole("operator"), async (req, res, next) => {
  try {
    const proposal = await updateProposal(req.user, String(req.params.id), req.body);
    if (!proposal) return res.status(404).json({ error: "Proposta nao encontrada." });
    return res.json(proposal);
  } catch (error) {
    return next(error);
  }
});

router.get("/proposals/:id/audit", async (req, res, next) => {
  try {
    const audit = await listProposalAudit(req.user, String(req.params.id));
    if (!audit) return res.status(404).json({ error: "Proposta nao encontrada." });
    return res.json(audit);
  } catch (error) {
    return next(error);
  }
});

router.get("/proposals/:id/pdf", async (req, res, next) => {
  try {
    const proposal = await getProposal(req.user, String(req.params.id));
    if (!proposal) return res.status(404).json({ error: "Proposta nao encontrada." });

    const pdf = proposalPdfBuffer(proposal);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="proposta-${proposal.id}.pdf"`);
    return res.send(pdf);
  } catch (error) {
    return next(error);
  }
});

export default router;
