import { Router, Request, Response, NextFunction } from "express";
import { getOperators, getOperatorRanking, getGoals, setGoals, addOperator } from "../services/operators.js";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { requireWorkspaceRole } from "../middleware/session.js";
import { createWorkspaceUser, updateWorkspaceUser } from "../services/userStore.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    res.json(await getOperators(getRequestWorkspaceId(_req)));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role } = req.body;
    if (!name) return res.status(400).json({ message: "name obrigatorio" });
    res.status(201).json(await addOperator(name, email ?? "", role, getRequestWorkspaceId(req)));
  } catch (err) {
    next(err);
  }
});

router.post("/invite", requireWorkspaceRole("owner", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, password } = req.body;
    if (!email) return res.status(400).json({ message: "email obrigatório" });
    const generatedPassword = password || `Nodere@${Math.random().toString(36).slice(2, 8)}`;
    const user = await createWorkspaceUser(getRequestWorkspaceId(req), {
      name: name || String(email).split("@")[0],
      email,
      password: generatedPassword,
      role: "operator"
    });
    res.status(201).json({
      user,
      temporaryPassword: password ? undefined : generatedPassword,
      message: "Operador criado. Envie a senha temporária por canal seguro; convite por e-mail exige SMTP/Supabase Auth configurado."
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/role", requireWorkspaceRole("owner"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.body?.role === "owner" ? "owner" : req.body?.role === "admin" ? "admin" : "operator";
    const user = await updateWorkspaceUser(getRequestWorkspaceId(req), String(req.params.id), { role });
    if (!user) return res.status(404).json({ message: "Operador não encontrado." });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireWorkspaceRole("owner"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await updateWorkspaceUser(getRequestWorkspaceId(req), String(req.params.id), { active: false });
    if (!user) return res.status(404).json({ message: "Operador não encontrado." });
    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
});

router.get("/ranking", async (_req, res, next) => {
  try {
    res.json(await getOperatorRanking(getRequestWorkspaceId(_req)));
  } catch (err) {
    next(err);
  }
});

router.get("/:id/goals", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goals = await getGoals(String(req.params.id), getRequestWorkspaceId(req));
    if (!goals) return res.status(404).json({ message: "Nenhuma meta definida para este operador" });
    res.json(goals);
  } catch (err) {
    next(err);
  }
});

router.put("/:id/goals", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetSearches, targetContacts, targetDeals, targetRevenueBRL } = req.body;
    const goal = await setGoals({
      operatorId: String(req.params.id),
      targetSearches: Number(targetSearches ?? 20),
      targetContacts: Number(targetContacts ?? 15),
      targetDeals: Number(targetDeals ?? 3),
      targetRevenueBRL: Number(targetRevenueBRL ?? 36000)
    }, getRequestWorkspaceId(req));
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

export default router;
