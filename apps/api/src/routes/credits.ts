import { Router } from "express";
import { getCredits } from "../services/credits.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getCredits());
});

export default router;
