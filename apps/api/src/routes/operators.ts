import { Router, Request, Response, NextFunction } from "express";
import { getOperators, getOperatorRanking, getGoals, setGoals, addOperator } from "../services/operators.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getOperators());
});

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role } = req.body;
    if (!name) return res.status(400).json({ message: "name obrigatório" });
    res.status(201).json(addOperator(name, email ?? "", role));
  } catch (err) {
    next(err);
  }
});

router.get("/ranking", (_req, res) => {
  res.json(getOperatorRanking());
});

router.get("/:id/goals", (req: Request, res: Response) => {
  const goals = getGoals(String(req.params.id));
  if (!goals) return res.status(404).json({ message: "Nenhuma meta definida para este operador" });
  res.json(goals);
});

router.put("/:id/goals", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetSearches, targetContacts, targetDeals, targetRevenueBRL } = req.body;
    const goal = setGoals({
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
