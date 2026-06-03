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
import { getRequestWorkspaceId } from "../middleware/session.js";
import { getSupabase } from "../db/supabase.js";
import { randomUUID } from "node:crypto";

const router = Router();

router.get("/", (_req, res) => {
  res.json(SEQUENCE_TEMPLATES);
});

router.get("/cadences", async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.json([]);
    const { data, error } = await sb.from("cadence_templates").select("*").eq("workspace_id", getRequestWorkspaceId(req)).order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.post("/cadences", async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2),
      steps: z.array(z.object({
        day: z.number().min(0),
        channel: z.enum(["whatsapp", "email", "system"]),
        action: z.enum(["send_template", "reminder", "move_stage"]),
        template_id: z.string().optional(),
        message: z.string().optional(),
        stage: z.string().optional()
      })).default([]),
      active: z.boolean().default(true)
    }).parse(req.body);
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado para cadências." });
    const { data, error } = await sb.from("cadence_templates").insert({
      id: randomUUID(),
      workspace_id: getRequestWorkspaceId(req),
      ...body
    }).select("*").single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/cadences/:id/enroll/:leadId", async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado para cadências." });
    const { data: cadence, error: cadenceError } = await sb.from("cadence_templates").select("*").eq("id", req.params.id).eq("workspace_id", getRequestWorkspaceId(req)).maybeSingle();
    if (cadenceError) throw cadenceError;
    if (!cadence) return res.status(404).json({ message: "Cadência não encontrada." });
    const firstStep = Array.isArray(cadence.steps) ? cadence.steps[0] : undefined;
    const next = new Date();
    next.setDate(next.getDate() + Number(firstStep?.day || 0));
    const { data, error } = await sb.from("cadence_enrollments").insert({
      id: randomUUID(),
      workspace_id: getRequestWorkspaceId(req),
      lead_id: req.params.leadId,
      cadence_id: req.params.id,
      next_action_at: next.toISOString(),
      status: "active"
    }).select("*").single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/cadences/enrollments/:id", async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado." });
    const status = req.body?.status === "paused" ? "paused" : req.body?.status === "active" ? "active" : "completed";
    const { data, error } = await sb.from("cadence_enrollments").update({ status }).eq("id", req.params.id).eq("workspace_id", getRequestWorkspaceId(req)).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Inscrição não encontrada." });
    res.json(data);
  } catch (error) {
    next(error);
  }
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
