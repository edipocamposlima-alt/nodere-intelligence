import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

type RawBodyRequest = Request & { rawBody?: Buffer };

export function isValidMetaSignature(rawBody: Buffer | undefined, signature: string, secret: string | undefined) {
  if (!rawBody || !signature || !secret || !signature.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export function requireMetaWebhookSignature(req: RawBodyRequest, res: Response, next: NextFunction) {
  if (!config.meta.appSecret) {
    return res.status(503).json({ message: "Webhook Meta não configurado." });
  }
  const signature = String(req.headers["x-hub-signature-256"] || "");
  if (!isValidMetaSignature(req.rawBody, signature, config.meta.appSecret)) {
    return res.status(401).json({ message: "Assinatura do webhook inválida." });
  }
  return next();
}
