import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { createSmtpTransport } from "../services/emailSender.js";

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2, "Nome e obrigatorio."),
  email: z.string().email("E-mail invalido."),
  phone: z.string().optional(),
  message: z.string().min(5, "Mensagem e obrigatoria."),
  plan_interest: z.string().optional()
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

router.post("/", async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Dados invalidos." });
  }

  const { name, email, phone, message, plan_interest } = parsed.data;
  const transport = createSmtpTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    user: config.smtp.user,
    pass: config.smtp.pass
  });

  if (!transport || !config.smtp.from) {
    return res.status(503).json({ error: "SMTP nao configurado para envio de contato." });
  }

  try {
    await transport.sendMail({
      from: config.smtp.from,
      replyTo: email,
      to: "comercial@nodere.com.br",
      subject: `[Contato Site] ${name} — ${plan_interest || "Sem plano especificado"}`,
      html: `
        <h2>Novo contato via site</h2>
        <p><b>Nome:</b> ${escapeHtml(name)}</p>
        <p><b>E-mail:</b> ${escapeHtml(email)}</p>
        <p><b>Telefone:</b> ${escapeHtml(phone || "-")}</p>
        <p><b>Plano de interesse:</b> ${escapeHtml(plan_interest || "-")}</p>
        <p><b>Mensagem:</b><br>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `
    });

    return res.json({ message: "Mensagem enviada. Retornaremos em breve!" });
  } catch (error) {
    console.error("[contact]", error);
    return res.status(500).json({ error: "Erro ao enviar mensagem. Tente novamente." });
  }
});

export default router;
