import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId } from "../middleware/session.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    let query = requireSupabase()
      .from("catalog_items")
      .select("*")
      .eq("workspace_id", workspaceId);
    if (req.query.type) query = query.eq("type", String(req.query.type));
    if (req.query.status) query = query.eq("status", String(req.query.status));
    if (req.query.category) query = query.eq("category", String(req.query.category));
    if (req.query.q) query = query.ilike("name", `%${String(req.query.q)}%`);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = catalogSchema.parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    const code = body.code?.trim() || await nextCatalogCode(workspaceId, body.category, body.type);
    const row = {
      id: randomUUID(),
      workspace_id: workspaceId,
      ...mapCatalogInput(body),
      code
    };
    const { data, error } = await requireSupabase().from("catalog_items").insert(row).select("*").single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const body = catalogSchema.partial().parse(req.body);
    const { data, error } = await requireSupabase()
      .from("catalog_items")
      .update({ ...mapCatalogInput(body), updated_at: new Date().toISOString() })
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase()
      .from("catalog_items")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

const catalogSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2),
  commercialName: z.string().optional().nullable(),
  category: z.string().min(2),
  subcategory: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  type: z.enum(["product", "service"]),
  status: z.enum(["active", "inactive"]).default("active"),
  descriptionShort: z.string().min(2),
  descriptionFull: z.string().optional().nullable(),
  cost: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
  scope: z.string().optional().nullable(),
  deliverables: z.string().optional().nullable(),
  sla: z.string().optional().nullable(),
  stockCurrent: z.coerce.number().optional().nullable(),
  keywords: z.array(z.string()).optional()
});

function mapCatalogInput(input: Partial<z.infer<typeof catalogSchema>>) {
  const row: Record<string, unknown> = {};
  const map: Record<string, string> = {
    commercialName: "commercial_name",
    descriptionShort: "description_short",
    descriptionFull: "description_full",
    stockCurrent: "stock_current"
  };
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) row[map[key] ?? key] = value;
  }
  return row;
}

async function nextCatalogCode(workspaceId: string, category: string, type: "product" | "service") {
  const prefix = prefixFor(category, type);
  const { data, error } = await requireSupabase()
    .from("catalog_items")
    .select("code")
    .eq("workspace_id", workspaceId)
    .ilike("code", `${prefix}-%`);
  if (error) throw error;
  const max = (data ?? []).reduce((current, item) => {
    const match = String(item.code || "").match(/-(\d+)$/);
    return Math.max(current, match ? Number(match[1]) : 0);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

function prefixFor(category: string, type: "product" | "service") {
  const normalized = category.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (normalized.includes("marketing")) return "MKT";
  if (normalized.includes("tecnologia")) return "TEC";
  if (normalized.includes("consultoria")) return "CON";
  if (normalized.includes("informatica")) return "INF";
  if (normalized.includes("automacao")) return "AUT";
  return type === "service" ? "SRV" : "PRD";
}

function requireSupabase() {
  const sb = getSupabase();
  if (!sb) {
    const error = new Error("Supabase não configurado para catálogo.") as Error & { status?: number; code?: string };
    error.status = 503;
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  return sb;
}

export default router;
