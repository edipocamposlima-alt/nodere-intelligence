import nodemailer from "nodemailer";
import { config } from "../config.js";

export function createSmtpTransport(input?: {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
}) {
  const host = input?.host || config.smtp.host;
  const port = input?.port || config.smtp.port;
  const user = input?.user || config.smtp.user;
  const pass = input?.pass || config.smtp.pass;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function sendAutomationEmail(input: {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
}) {
  const transport = createSmtpTransport();
  if (!transport) {
    console.warn("[EMAIL] SMTP not configured. Email not sent to:", input.to);
    return { sent: false, reason: "SMTP not configured" };
  }
  try {
    await transport.sendMail({
      from: `"${input.fromName || "NODERI Nexus"}" <${input.fromEmail || config.smtp.from || config.smtp.user}>`,
      to: input.to,
      subject: input.subject,
      html: input.body.replace(/\n/g, "<br />")
    });
    return { sent: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Erro desconhecido ao enviar e-mail.";
    console.error("[EMAIL] Send failed:", reason);
    return { sent: false, reason };
  }
}
