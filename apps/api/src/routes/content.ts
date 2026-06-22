import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { z } from "zod";
import { getSupabase } from "../db/supabase.js";
import { requireWorkspaceRole } from "../middleware/session.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const adminOnly = requireWorkspaceRole("owner", "admin");
const publicSiteWorkspaceId = process.env.PUBLIC_SITE_WORKSPACE_ID || "default";
const publicHref = z.string().trim().min(1).max(2048).refine(isSafePublicHref, "Link público inválido.");

const pageSchema = z.object({
  slug: z.string().trim().min(1).max(120), title: z.string().trim().min(1).max(200), subtitle: z.string().max(500).optional().nullable(),
  pageType: z.enum(["institutional", "home", "manual", "pricing", "blog"]).optional(), status: z.enum(["draft", "published", "hidden"]).optional(),
  seoTitle: z.string().optional().nullable(), seoDescription: z.string().optional().nullable()
});
const sectionSchema = z.object({
  pageId: z.string().uuid(), sectionKey: z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{0,79}$/i), sectionType: z.enum(["hero", "content", "features", "cta", "faq"]).optional(),
  title: z.string().optional().nullable(), subtitle: z.string().optional().nullable(), body: z.string().optional().nullable(),
  imageUrl: z.string().trim().max(2048).refine((value) => !value || isSafeImageUrl(value), "URL de imagem inválida.").optional().nullable(),
  buttonLabel: z.string().max(120).optional().nullable(), buttonHref: publicHref.optional().nullable(),
  settings: z.record(z.string(), z.unknown()).optional(), sortOrder: z.coerce.number().optional(), visible: z.boolean().optional()
});
const navigationSchema = z.object({
  location: z.enum(["header", "footer", "app"]).default("header"), label: z.string().trim().min(1).max(120), href: publicHref,
  sortOrder: z.coerce.number().optional(), visible: z.boolean().optional()
});

router.get("/pages", async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const slug = String(req.query.slug || "").trim();
    let query = sb.from("nodere_cms_pages").select("*, nodere_cms_sections(*)").eq("workspace_id", publicSiteWorkspaceId).eq("status", "published");
    if (slug) query = query.eq("slug", slug);
    const { data, error } = await query.order("created_at", { ascending: true });
    if (error && isMissingRelation(error)) return res.json({ pages: [] });
    if (error) throw error;
    const pages = (data || []).map((page) => ({ ...page, nodere_cms_sections: [...(page.nodere_cms_sections || [])].filter((item) => item.visible).sort((a, b) => a.sort_order - b.sort_order) }));
    return res.json({ pages });
  } catch (error) { return next(error); }
});

router.get("/navigation", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase().from("nodere_cms_navigation").select("*").eq("workspace_id", publicSiteWorkspaceId).eq("visible", true).eq("location", String(req.query.location || "header")).order("sort_order");
    if (error && isMissingRelation(error)) return res.json({ items: [] });
    if (error) throw error;
    return res.json({ items: data || [] });
  } catch (error) { return next(error); }
});

router.get("/admin/pages", adminOnly, async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase().from("nodere_cms_pages").select("*, nodere_cms_sections(*)").eq("workspace_id", publicSiteWorkspaceId).order("created_at");
    if (error) throw error;
    return res.json({ pages: data || [] });
  } catch (error) { return next(error); }
});

router.post("/admin/pages", adminOnly, async (req, res, next) => {
  try {
    const body = pageSchema.parse(req.body);
    const { data, error } = await requireSupabase().from("nodere_cms_pages").insert(toPageRow(body, publicSiteWorkspaceId)).select("*").single();
    if (error) throw error;
    return res.status(201).json({ page: data });
  } catch (error) { return next(error); }
});

router.patch("/admin/pages/:id", adminOnly, async (req, res, next) => {
  try {
    const body = pageSchema.partial().parse(req.body);
    const { data, error } = await requireSupabase().from("nodere_cms_pages").update(toPageRow(body)).eq("workspace_id", publicSiteWorkspaceId).eq("id", req.params.id).select("*").single();
    if (error) throw error;
    return res.json({ page: data });
  } catch (error) { return next(error); }
});

router.delete("/admin/pages/:id", adminOnly, async (req, res, next) => {
  try {
    const { error } = await requireSupabase().from("nodere_cms_pages").delete().eq("workspace_id", publicSiteWorkspaceId).eq("id", req.params.id);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) { return next(error); }
});

router.post("/admin/sections", adminOnly, async (req, res, next) => {
  try {
    const body = sectionSchema.parse(req.body);
    const { data, error } = await requireSupabase().from("nodere_cms_sections").insert(toSectionRow(body, publicSiteWorkspaceId)).select("*").single();
    if (error) throw error;
    return res.status(201).json({ section: data });
  } catch (error) { return next(error); }
});

router.patch("/admin/sections/:id", adminOnly, async (req, res, next) => {
  try {
    const body = sectionSchema.partial().parse(req.body);
    const { data, error } = await requireSupabase().from("nodere_cms_sections").update(toSectionRow(body)).eq("workspace_id", publicSiteWorkspaceId).eq("id", req.params.id).select("*").single();
    if (error) throw error;
    return res.json({ section: data });
  } catch (error) { return next(error); }
});

router.delete("/admin/sections/:id", adminOnly, async (req, res, next) => {
  try {
    const { error } = await requireSupabase().from("nodere_cms_sections").delete().eq("workspace_id", publicSiteWorkspaceId).eq("id", req.params.id);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) { return next(error); }
});

router.get("/admin/navigation", adminOnly, async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase().from("nodere_cms_navigation").select("*").eq("workspace_id", publicSiteWorkspaceId).order("location").order("sort_order");
    if (error) throw error;
    return res.json({ items: data || [] });
  } catch (error) { return next(error); }
});

router.post("/admin/navigation", adminOnly, async (req, res, next) => {
  try {
    const body = navigationSchema.parse(req.body);
    const { data, error } = await requireSupabase().from("nodere_cms_navigation").insert(toNavigationRow(body, publicSiteWorkspaceId)).select("*").single();
    if (error) throw error;
    return res.status(201).json({ item: data });
  } catch (error) { return next(error); }
});

router.patch("/admin/navigation/:id", adminOnly, async (req, res, next) => {
  try {
    const body = navigationSchema.partial().parse(req.body);
    const { data, error } = await requireSupabase().from("nodere_cms_navigation").update(toNavigationRow(body)).eq("workspace_id", publicSiteWorkspaceId).eq("id", req.params.id).select("*").single();
    if (error) throw error;
    return res.json({ item: data });
  } catch (error) { return next(error); }
});

router.delete("/admin/navigation/:id", adminOnly, async (req, res, next) => {
  try {
    const { error } = await requireSupabase().from("nodere_cms_navigation").delete().eq("workspace_id", publicSiteWorkspaceId).eq("id", req.params.id);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) { return next(error); }
});

router.post("/admin/assets", adminOnly, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Selecione uma imagem." });
    const detectedMime = detectImageMime(req.file.buffer);
    if (!detectedMime || detectedMime !== req.file.mimetype) {
      return res.status(415).json({ message: "Formato inválido. Envie PNG, JPEG, WebP ou GIF legítimo." });
    }
    const sb = requireSupabase();
    const workspaceId = publicSiteWorkspaceId;
    const path = `${workspaceId}/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const bucket = await sb.storage.getBucket("site-assets");
    if (bucket.error) {
      return res.status(503).json({ message: "Crie o bucket público site-assets no Supabase Storage.", detail: bucket.error.message });
    }
    if (!bucket.data.public) {
      return res.status(503).json({ message: "O bucket site-assets existe, mas precisa ser público para imagens institucionais." });
    }
    const uploaded = await sb.storage.from("site-assets").upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (uploaded.error) return res.status(503).json({ message: "Crie o bucket público site-assets no Supabase Storage.", detail: uploaded.error.message });
    const fileUrl = sb.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
    const { data, error } = await sb.from("nodere_cms_assets").insert({ id: randomUUID(), workspace_id: workspaceId, file_name: req.file.originalname, file_url: fileUrl, mime_type: req.file.mimetype, file_size: req.file.size }).select("*").single();
    if (error) throw error;
    return res.status(201).json({ asset: data });
  } catch (error) { return next(error); }
});

router.get("/admin/plans", adminOnly, async (_req, res, next) => {
  try {
    const { data, error } = await requireSupabase().from("nodere_plan_limits").select("*").order("plan");
    if (error) throw error;
    return res.json({ plans: data || [] });
  } catch (error) { return next(error); }
});

router.patch("/admin/plans/:id", adminOnly, async (req, res, next) => {
  try {
    const body = z.object({ seatsLimit: z.coerce.number().min(0).optional(), creditsLimit: z.coerce.number().min(0).optional(), modules: z.array(z.string()).optional(), features: z.record(z.string(), z.unknown()).optional() }).parse(req.body);
    const updates = { ...(body.seatsLimit !== undefined ? { seats_limit: body.seatsLimit } : {}), ...(body.creditsLimit !== undefined ? { credits_limit: body.creditsLimit } : {}), ...(body.modules !== undefined ? { modules: body.modules } : {}), ...(body.features !== undefined ? { features: body.features } : {}) };
    const { data, error } = await requireSupabase().from("nodere_plan_limits").update(updates).eq("id", req.params.id).select("*").single();
    if (error) throw error;
    return res.json({ plan: data });
  } catch (error) { return next(error); }
});

router.use((error: unknown, _req: Request, _res: Response, next: NextFunction) => {
  if (isMissingRelation(error)) {
    return next(Object.assign(
      new Error("CMS ainda não foi preparado no Supabase. Aplique packages/database/block_admin_cms.sql no SQL Editor."),
      { status: 503, code: "CMS_SCHEMA_REQUIRED" }
    ));
  }
  return next(error);
});

function toPageRow(body: Partial<z.infer<typeof pageSchema>>, workspaceId?: string) {
  return { ...(workspaceId ? { workspace_id: workspaceId } : {}), ...(body.slug !== undefined ? { slug: normalizeSlug(body.slug) } : {}), ...(body.title !== undefined ? { title: body.title } : {}), ...(body.subtitle !== undefined ? { subtitle: body.subtitle } : {}), ...(body.pageType !== undefined ? { page_type: body.pageType } : {}), ...(body.status !== undefined ? { status: body.status } : {}), ...(body.seoTitle !== undefined ? { seo_title: body.seoTitle } : {}), ...(body.seoDescription !== undefined ? { seo_description: body.seoDescription } : {}) };
}
function toSectionRow(body: Partial<z.infer<typeof sectionSchema>>, workspaceId?: string) {
  return { ...(workspaceId ? { workspace_id: workspaceId } : {}), ...(body.pageId !== undefined ? { page_id: body.pageId } : {}), ...(body.sectionKey !== undefined ? { section_key: body.sectionKey } : {}), ...(body.sectionType !== undefined ? { section_type: body.sectionType } : {}), ...(body.title !== undefined ? { title: body.title } : {}), ...(body.subtitle !== undefined ? { subtitle: body.subtitle } : {}), ...(body.body !== undefined ? { body: body.body } : {}), ...(body.imageUrl !== undefined ? { image_url: body.imageUrl } : {}), ...(body.buttonLabel !== undefined ? { button_label: body.buttonLabel } : {}), ...(body.buttonHref !== undefined ? { button_href: body.buttonHref } : {}), ...(body.settings !== undefined ? { settings: body.settings } : {}), ...(body.sortOrder !== undefined ? { sort_order: body.sortOrder } : {}), ...(body.visible !== undefined ? { visible: body.visible } : {}) };
}
function toNavigationRow(body: Partial<z.infer<typeof navigationSchema>>, workspaceId?: string) {
  return { ...(workspaceId ? { workspace_id: workspaceId } : {}), ...(body.location !== undefined ? { location: body.location } : {}), ...(body.label !== undefined ? { label: body.label } : {}), ...(body.href !== undefined ? { href: body.href } : {}), ...(body.sortOrder !== undefined ? { sort_order: body.sortOrder } : {}), ...(body.visible !== undefined ? { visible: body.visible } : {}) };
}
function requireSupabase() { const sb = getSupabase(); if (!sb) throw Object.assign(new Error("Supabase não configurado."), { status: 503 }); return sb; }
function isMissingRelation(error: unknown) { return ["42P01", "PGRST205"].includes(String((error as { code?: string })?.code || "")); }
function isSafePublicHref(value: string) {
  return (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:") || value.startsWith("https://");
}
function normalizeSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "pagina";
}
function isSafeImageUrl(value: string) {
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    const supabaseHost = new URL(process.env.SUPABASE_URL || "https://qhopjggnbzewuuktqntp.supabase.co").hostname;
    return url.protocol === "https:" && url.hostname === supabaseHost;
  } catch { return false; }
}
function detectImageMime(buffer: Buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return "image/png";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))) return "image/gif";
  return null;
}

export default router;
