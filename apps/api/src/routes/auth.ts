import { Router } from "express";
import { getSupabase } from "../db/supabase.js";
import { config } from "../config.js";

const router = Router();

function supabaseOrError() {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  return supabase;
}

router.post("/register", async (req, res) => {
  const { name, email, password, company } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Preencha nome, e-mail e senha." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
  }

  try {
    const supabase = supabaseOrError();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { name, company: company || name }
    });

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        return res.status(409).json({ error: "E-mail já cadastrado." });
      }
      throw error;
    }

    return res.status(201).json({
      message: "Conta criada. Verifique seu e-mail para confirmar o cadastro.",
      userId: data.user.id
    });
  } catch (err) {
    console.error("[auth/register]", err);
    return res.status(500).json({ error: "Erro ao criar conta. Tente novamente." });
  }
});

router.post("/login", async (_req, res) => {
  return res.status(200).json({ message: "Use o cliente Supabase no frontend para login." });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: "E-mail obrigatório." });

  try {
    const supabase = supabaseOrError();
    await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${config.frontendUrl}/app/reset-password` }
    });
    return res.status(200).json({
      message: "Se o e-mail existir, você receberá as instruções de recuperação."
    });
  } catch (err) {
    console.error("[auth/forgot-password]", err);
    return res.status(200).json({
      message: "Se o e-mail existir, você receberá as instruções de recuperação."
    });
  }
});

router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Token ausente." });

  try {
    const supabase = supabaseOrError();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Sessão inválida." });

    const { data: profile } = await supabase
      .from("nodere_platform_users")
      .select("*")
      .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)
      .single();

    if (!profile) return res.status(404).json({ error: "Perfil não encontrado." });

    const { data: workspace } = await supabase
      .from("nodere_workspaces")
      .select("*")
      .eq("id", profile.workspace_id)
      .single();

    return res.status(200).json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      workspace,
      avatar_url: profile.avatar_url
    });
  } catch (err) {
    console.error("[auth/me]", err);
    return res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
