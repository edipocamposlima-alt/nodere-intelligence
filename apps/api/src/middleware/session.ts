import { NextFunction, Request, Response } from "express";
import { extractBearerToken, verifySessionToken } from "../services/adminSession.js";

export function attachSession(request: Request, _response: Response, next: NextFunction) {
  const session = verifySessionToken(extractBearerToken(request.headers.authorization));
  if (session) {
    (request as any).session = session;
  }
  next();
}

export function getRequestWorkspaceId(request: Request) {
  return ((request as any).session?.workspaceId as string | undefined) || "default";
}

