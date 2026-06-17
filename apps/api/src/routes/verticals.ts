import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireWorkspaceRole } from "../middleware/session.js";
import { getSupabase } from "../db/supabase.js";
import { callAI } from "../services/ai.js";

const router = Router();

const defaults = [
  { id: "healthcare", service_type: "healthcare", segment_keywords: ["clínica", "médico", "dentista", "saúde"], system_prompt: "Diagnostique negócios de saúde com foco em confiança local, avaliações, Google Ads e agendamento.", score_weights: {} },
  { id: "restaurants", service_type: "restaurants", segment_keywords: ["restaurante", "bar", "pizzaria", "lanchonete"], system_prompt: "Diagnostique restaurantes com foco em presença local, delivery, avaliações e campanhas de intenção imediata.", score_weights: {} },
  { id: "real_estate", service_type: "real_estate", segment_keywords: ["imobiliária", "corretor", "imóveis"], system_prompt: "Diagnostique negócios imobiliários com foco em geração de leads, landing pages e campanhas por região.", score_weights: {} },
  { id: "legal", service_type: "legal", segment_keywords: ["advocacia", "advogado", "jurídico"], system_prompt: "Diagnostique escritórios jurídicos com foco em autoridade, SEO local e captação ética.", score_weights: {} },
  { id: "ecommerce", service_type: "ecommerce", segment_keywords: ["loja", "e-commerce", "marketplace"], system_prompt: "Diagnostique e-commerces com foco em performance, tracking, remarketing e conversão.", score_weights: {} },
  { id: "generic", service_type: "generic", segment_keywords: ["empresa"], system_prompt: "Diagnostique empresas B2B com foco em presença digital, Google Ads e CRM.", score_weights: {} }
];

router.get("/", async (_req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.json(defaults);
    const { data, error } = await sb.from("vertical_prompts").select("*").order("service_type");
    if (error) throw error;
    res.json(data?.length ? data : defaults);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireWorkspaceRole("owner", "admin"), async (req, res, next) => {
  try {
    const body = z.object({
      segment_keywords: z.array(z.string()).optional(),
      system_prompt: z.string().min(10).optional(),
      score_weights: z.record(z.unknown()).optional()
    }).parse(req.body);
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ message: "Supabase não configurado." });
    const row = { id: req.params.id, service_type: req.params.id, ...body, updated_at: new Date().toISOString() };
    const { data, error } = await sb.from("vertical_prompts").upsert(row).select("*").single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/test", requireWorkspaceRole("owner", "admin"), async (req, res, next) => {
  try {
    const sample = req.body?.lead ?? { name: "Clínica Exemplo", segment: "clínica odontológica", city: "Caxias do Sul", score: 62 };
    const prompt = `Gere diagnóstico curto para lead de teste: ${JSON.stringify(sample)}`;
    const ai = await callAI("Você é especialista NODERE em diagnósticos verticais.", prompt);
    res.json({ id: randomUUID(), output: ai.content, provider: ai.provider });
  } catch (error) {
    next(error);
  }
});

export default router;
