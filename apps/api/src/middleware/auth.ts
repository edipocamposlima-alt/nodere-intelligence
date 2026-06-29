import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { getSupabase } from "../db/supabase.js";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        workspace_id: string;
        role: string;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!config.apiKey) return next();

  const header = req.headers["authorization"] ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (token !== config.apiKey) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Token ausente." });

  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(503).json({ error: "Configure a integração Supabase em Configurações > Integrações" });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Sessão inválida ou expirada." });

    const { data: profile } = await supabase
      .from("nodere_platform_users")
      .select("id, workspace_id, role, active")
      .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)
      .single();

    if (!profile) return res.status(401).json({ error: "Usuário não encontrado." });
    if (!profile.active) return res.status(403).json({ error: "Usuário desativado." });

    req.user = {
      id: profile.id,
      workspace_id: profile.workspace_id,
      role: profile.role
    };

    next();
  } catch (err) {
    console.error("[authenticate]", err);
    return res.status(500).json({ error: "Erro de autenticação." });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const hierarchy = ["viewer", "operator", "manager", "admin", "owner"];
    const userLevel = hierarchy.indexOf(req.user?.role);
    const requiredLevels = roles.map((role) => hierarchy.indexOf(role)).filter((level) => level >= 0);
    const requiredLevel = Math.min(...requiredLevels);

    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: "Permissão insuficiente." });
    }

    next();
  };
}
