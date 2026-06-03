import { Router } from "express";
import { geocodeAddress } from "../services/google.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const address = typeof req.query.address === "string" ? req.query.address.trim() : "";
    if (!address) return res.status(400).json({ message: "Informe address." });
    res.json(await geocodeAddress(address));
  } catch (error) {
    next(error);
  }
});

export default router;
