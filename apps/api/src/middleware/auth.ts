import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!config.apiKey) return next();

  const header = req.headers["authorization"] ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (token !== config.apiKey) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
}
