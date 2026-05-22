import { config } from "../config.js";
import { Company } from "../types.js";

export const defaultProspectingMessage =
  "Ola, tudo bem? Estive analisando a presenca digital da sua empresa no Google e identifiquei algumas oportunidades que podem ajudar voces a gerar mais contatos e melhorar o posicionamento online. Posso te mostrar rapidamente?";

export function buildWhatsappLink(company: Company, message = defaultProspectingMessage) {
  if (!company.whatsapp && !company.phone) return null;
  const phone = normalizePhone(company.whatsapp ?? company.phone ?? "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export async function sendWhatsappMessage(company: Company, message = defaultProspectingMessage) {
  if (!config.whatsapp.token || !config.whatsapp.phoneNumberId) {
    return {
      mode: "link",
      sent: false,
      reason: "WHATSAPP_CLOUD_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured.",
      link: buildWhatsappLink(company, message)
    };
  }

  const phone = normalizePhone(company.whatsapp ?? company.phone ?? "");
  if (!phone) {
    return { mode: "cloud", sent: false, reason: "Company has no phone or WhatsApp number." };
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${config.whatsapp.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsapp.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { preview_url: false, body: message }
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    return { mode: "cloud", sent: false, status: response.status, error: payload };
  }

  return { mode: "cloud", sent: true, response: payload };
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith(config.whatsapp.defaultCountryCode)) return digits;
  return `${config.whatsapp.defaultCountryCode}${digits}`;
}
