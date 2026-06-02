import { Router, Request, Response, NextFunction } from "express";
import { getOperators, getOperatorRanking, getGoals, setGoals, addOperator } from "../services/operators.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    res.json(await getOperators());
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role } = req.body;
    if (!name) return res.status(400).json({ message: "name obrigatorio" });
    res.status(201).json(await addOperator(name, email ?? "", role));
  } catch (err) {
    next(err);
  }
});

router.get("/ranking", async (_req, res, next) => {
  try {
    res.json(await getOperatorRanking());
  } catch (err) {
    next(err);
  }
});

router.get("/:id/goals", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goals = await getGoals(String(req.params.id));
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
    });
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

export default router;
