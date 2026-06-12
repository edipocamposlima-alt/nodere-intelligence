import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId } from "../middleware/session.js";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

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


router.post("/:id/images", upload.single("image"), async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Envie uma imagem no campo image." });
    if (!file.mimetype.startsWith("image/")) return res.status(422).json({ message: "O arquivo precisa ser uma imagem." });
    const sb = requireSupabase();
    const storagePath = `${workspaceId}/${String(req.params.id)}/${randomUUID()}-${safeStorageFileName(file.originalname || "catalogo.png")}`;
    const { error: uploadError } = await sb.storage.from("catalog-images").upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });
    if (uploadError) return res.status(500).json({ message: "Não foi possível enviar a imagem. Verifique se o bucket catalog-images existe no Supabase Storage.", detail: uploadError.message });
    const imageUrl = getPublicStorageUrl("catalog-images", storagePath);
    const { data: current, error: loadError } = await sb
      .from("catalog_items")
      .select("images")
      .eq("workspace_id", workspaceId)
      .eq("id", req.params.id)
      .maybeSingle();
    if (loadError) throw loadError;
    const images = Array.isArray(current?.images) ? [...current.images, imageUrl] : [imageUrl];
    const { data, error } = await sb
      .from("catalog_items")
      .update({ image_url: imageUrl, images, updated_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) { return next(error); }
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
  features: z.string().optional().nullable(),
  benefits: z.string().optional().nullable(),
  differentials: z.string().optional().nullable(),
  targetAudience: z.string().optional().nullable(),
  useCases: z.string().optional().nullable(),
  cost: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
  commissionPct: z.coerce.number().optional().nullable(),
  maxDiscountPct: z.coerce.number().optional().nullable(),
  promotionalPrice: z.coerce.number().optional().nullable(),
  promotionExpiresAt: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  deliveryDays: z.coerce.number().optional().nullable(),
  warranty: z.string().optional().nullable(),
  exchangePolicy: z.string().optional().nullable(),
  cancellationPolicy: z.string().optional().nullable(),
  paymentConditions: z.string().optional().nullable(),
  installmentsAvailable: z.coerce.number().optional().nullable(),
  unitMeasure: z.string().optional().nullable(),
  weightKg: z.coerce.number().optional().nullable(),
  heightCm: z.coerce.number().optional().nullable(),
  widthCm: z.coerce.number().optional().nullable(),
  lengthCm: z.coerce.number().optional().nullable(),
  color: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  voltage: z.string().optional().nullable(),
  technicalSpecs: z.string().optional().nullable(),
  executionTime: z.string().optional().nullable(),
  scope: z.string().optional().nullable(),
  limitations: z.string().optional().nullable(),
  deliverables: z.string().optional().nullable(),
  complexity: z.string().optional().nullable(),
  sla: z.string().optional().nullable(),
  stockCurrent: z.coerce.number().optional().nullable(),
  stockMin: z.coerce.number().optional().nullable(),
  stockMax: z.coerce.number().optional().nullable(),
  stockLocation: z.string().optional().nullable(),
  marketSegment: z.string().optional().nullable(),
  campaignUrl: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional()
});

function mapCatalogInput(input: Partial<z.infer<typeof catalogSchema>>) {
  const row: Record<string, unknown> = {};
  const map: Record<string, string> = {
    commercialName: "commercial_name",
    descriptionShort: "description_short",
    descriptionFull: "description_full",
    targetAudience: "target_audience",
    useCases: "use_cases",
    commissionPct: "commission_pct",
    maxDiscountPct: "max_discount_pct",
    promotionalPrice: "promotional_price",
    promotionExpiresAt: "promotion_expires_at",
    deliveryDays: "delivery_days",
    exchangePolicy: "exchange_policy",
    cancellationPolicy: "cancellation_policy",
    paymentConditions: "payment_conditions",
    installmentsAvailable: "installments_available",
    unitMeasure: "unit_measure",
    weightKg: "weight_kg",
    heightCm: "height_cm",
    widthCm: "width_cm",
    lengthCm: "length_cm",
    technicalSpecs: "technical_specs",
    executionTime: "execution_time",
    stockCurrent: "stock_current",
    stockMin: "stock_min",
    stockMax: "stock_max",
    stockLocation: "stock_location",
    marketSegment: "market_segment",
    campaignUrl: "campaign_url"
  };
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    const column = map[key] ?? key;
    if (column === "promotion_expires_at" && value === "") {
      row[column] = null;
      continue;
    }
    row[column] = value;
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


function safeStorageFileName(value: string) {
  const cleaned = String(value || "arquivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned || "arquivo";
}


async function ensureStorageBucket(bucket: string) {
  const sb = requireSupabase();
  const { data } = await sb.storage.getBucket(bucket);
  if (data) return;
  await sb.storage.createBucket(bucket, { public: true }).catch(() => undefined);
}
function getPublicStorageUrl(bucket: string, storagePath: string) {
  const { data } = requireSupabase().storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
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




