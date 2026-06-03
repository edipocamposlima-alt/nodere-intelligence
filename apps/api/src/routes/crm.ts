import { Router } from "express";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { listCompaniesAsync, updateStatus } from "../services/companyStore.js";

const router = Router();

router.get("/cards", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
    const stage = String(req.query.stage || "");
    const ownerId = String(req.query.owner_id || "");
    const city = String(req.query.city || "").toLowerCase();
    const q = String(req.query.q || "").toLowerCase();
    const minScore = Number(req.query.min_score || 0);
    const sort = String(req.query.sort || "score");
    const order = String(req.query.order || "desc") === "asc" ? 1 : -1;
    const all = await listCompaniesAsync(getRequestWorkspaceId(req));
    const filtered = all.filter((item) =>
      (!stage || item.status === stage) &&
      (!ownerId || (item as any).ownerId === ownerId) &&
      (!city || item.city.toLowerCase().includes(city)) &&
      (!q || item.name.toLowerCase().includes(q)) &&
      item.score >= minScore
    );
    filtered.sort((a, b) => {
      const av = sort === "company_name" ? a.name : sort === "created_at" ? a.createdAt : a.score;
      const bv = sort === "company_name" ? b.name : sort === "created_at" ? b.createdAt : b.score;
      return String(av).localeCompare(String(bv), "pt-BR", { numeric: true }) * order;
    });
    const start = (page - 1) * limit;
    res.json({ data: filtered.slice(start, start + limit), page, limit, total: filtered.length });
  } catch (error) {
    next(error);
  }
});

router.patch("/cards/bulk-stage", async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const stage = String(req.body?.stage || "Novo Lead");
    const updated = [];
    for (const id of ids) {
      const item = await updateStatus(id, stage as any, getRequestWorkspaceId(req));
      if (item) updated.push(item);
    }
    res.json({ updated });
  } catch (error) {
    next(error);
  }
});

export default router;
