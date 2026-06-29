import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { getSupabase } from "../db/supabase.js";
import { config } from "../config.js";

const router = Router();

function supabaseOrError() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
  return supabase;
}

router.get("/", authenticate, async (req, res) => {
  try {
    const supabase = supabaseOrError();
    const { data, error } = await supabase
      .from("nodere_platform_users")
      .select("id, name, email, role, active, created_at, last_seen_at")
      .eq("workspace_id", req.user.workspace_id)
      .order("created_at");

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error("[team/list]", err);
    return res.status(500).json({ error: "Erro ao listar usuários." });
  }
});

router.post("/invite", authenticate, requireRole("admin", "owner"), async (req, res) => {
  const { email, name, role = "operator" } = req.body ?? {};
  const validRoles = ["viewer", "operator", "manager", "admin"];

  if (!email || !name) return res.status(400).json({ error: "E-mail e nome obrigatórios." });
  if (!validRoles.includes(role)) return res.status(400).json({ error: "Perfil inválido." });

  try {
    const supabase = supabaseOrError();
    const { data: ws, error: workspaceError } = await supabase
      .from("nodere_workspaces")
      .select("plano")
      .eq("id", req.user.workspace_id)
      .single();

    if (workspaceError || !ws) throw workspaceError ?? new Error("WORKSPACE_NOT_FOUND");

    const { count, error: countError } = await supabase
      .from("nodere_platform_users")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", req.user.workspace_id)
      .eq("active", true);

    if (countError) throw countError;

    const limits: Record<string, number> = { trial: 1, starter: 1, pro: 3, agency: 10, enterprise: 9999 };
    const limit = limits[ws.plano] ?? 1;
    if ((count ?? 0) >= limit) {
      return res.status(402).json({
        error: "Limite de usuários atingido para o plano atual. Faça upgrade para adicionar mais membros."
      });
    }

    const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        name,
        role,
        workspace_id: req.user.workspace_id,
        invited_by: req.user.id
      }
    });

    if (createError) {
      if (createError.message.toLowerCase().includes("already")) {
        return res.status(409).json({ error: "E-mail já cadastrado na plataforma." });
      }
      throw createError;
    }

    await supabase.from("nodere_platform_users").upsert({
      id: authUser.user.id,
      workspace_id: req.user.workspace_id,
      name,
      email,
      role,
      invited_by: req.user.id,
      active: true
    });

    await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo: `${config.frontendUrl}/app/accept-invite` }
    });

    return res.status(201).json({ message: `Convite enviado para ${email}.` });
  } catch (err) {
    console.error("[team/invite]", err);
    return res.status(500).json({ error: "Erro ao convidar usuário." });
  }
});

router.patch("/:userId/role", authenticate, requireRole("admin", "owner"), async (req, res) => {
  const { role } = req.body ?? {};
  const validRoles = ["viewer", "operator", "manager", "admin"];
  if (!validRoles.includes(role)) return res.status(400).json({ error: "Perfil inválido." });

  try {
    const supabase = supabaseOrError();
    const { error } = await supabase
      .from("nodere_platform_users")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", req.params.userId)
      .eq("workspace_id", req.user.workspace_id);

    if (error) throw error;
    return res.json({ message: "Perfil atualizado." });
  } catch (err) {
    console.error("[team/role]", err);
    return res.status(500).json({ error: "Erro ao atualizar perfil." });
  }
});

router.delete("/:userId", authenticate, requireRole("admin", "owner"), async (req, res) => {
  try {
    const supabase = supabaseOrError();
    const { error } = await supabase
      .from("nodere_platform_users")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", req.params.userId)
      .eq("workspace_id", req.user.workspace_id);

    if (error) throw error;
    return res.json({ message: "Usuário desativado." });
  } catch (err) {
    console.error("[team/deactivate]", err);
    return res.status(500).json({ error: "Erro ao desativar usuário." });
  }
});

export default router;
