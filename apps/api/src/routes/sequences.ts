import { Router } from "express";
import { z } from "zod";
import {
  SEQUENCE_TEMPLATES,
  activateSequence,
  cancelInstance,
  listInstances,
  sendSequenceEmail
} from "../services/emailSequences.js";
import { getCompany } from "../services/companyStore.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(SEQUENCE_TEMPLATES);
});

router.get("/instances", (_req, res) => {
  res.json(listInstances());
});

router.delete("/instances/:id", (req, res) => {
  const ok = cancelInstance(req.params.id);
  if (!ok) return res.status(404).json({ message: "Sequence instance not found" });
  return res.json({ cancelled: true });
});

// Test-send a single sequence step email
router.post("/instances/:id/send-step", async (req, res, next) => {
  try {
    const body = z.object({ to: z.string().email(), stepIndex: z.number().int().min(0).default(0) }).parse(req.body);
    const instances = listInstances();
    const inst = instances.find((i) => i.id === req.params.id);
    if (!inst) return res.status(404).json({ message: "Instance not found" });

    const template = SEQUENCE_TEMPLATES.find((t) => t.id === inst.templateId);
    const step = template?.steps[body.stepIndex];
    if (!step) return res.status(404).json({ message: "Step not found" });
    if (step.channel !== "email") return res.status(422).json({ message: "Step is not an email step" });

    const company = getCompany(inst.companyId);
    const result = await sendSequenceEmail(body.to, step, {
      empresa: inst.companyName,
      categoria: company?.category ?? ""
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

export default router;
