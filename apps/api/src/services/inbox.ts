import { InboxConversation, InboxMessage, MessageStatus } from "../types.js";

export type InboxDirection = "inbound" | "outbound" | "manual";
export type InboxRecordStatus = "unread" | "read" | "flagged" | "resolved";
export type InboxRecordType = "whatsapp" | "email" | "ligacao" | "reuniao" | "interno" | "manual";

export type InboxAttachment = {
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
  companyId?: string;
  leadId?: string;
};

export type WhatsappTemplateKey =
  | "primeira_abordagem"
  | "follow_up"
  | "agendamento"
  | "apresentacao"
  | "proposta"
  | "recuperacao_oportunidade"
  | "pos_venda";

export type WhatsappTemplate = {
  key: WhatsappTemplateKey;
  name: string;
  category: string;
  body: string;
};

export type InboxPersistedPayload = {
  workspaceId: string;
  companyId?: string | null;
  contactId?: string | null;
  type?: InboxRecordType;
  direction?: InboxDirection;
  status?: InboxRecordStatus;
  subject?: string | null;
  body: string;
  phoneFrom?: string | null;
  phoneTo?: string | null;
  flagColor?: string | null;
  sentBy?: string | null;
  sentAt?: string | null;
  providerMessageId?: string | null;
  templateKey?: string | null;
  companyName?: string | null;
  attachments?: InboxAttachment[];
  metadata?: Record<string, unknown>;
};

export const WHATSAPP_TEMPLATES: WhatsappTemplate[] = [
  {
    key: "primeira_abordagem",
    name: "Primeira abordagem",
    category: "Prospecção",
    body: "Olá, tudo bem? Analisei a presença digital da sua empresa e encontrei oportunidades rápidas para atrair mais clientes pelo Google. Posso te mostrar um diagnóstico objetivo?"
  },
  {
    key: "follow_up",
    name: "Follow-up",
    category: "Relacionamento",
    body: "Oi, passando para retomar nosso contato. Conseguiu avaliar as oportunidades que enviei? Posso te ajudar a priorizar os próximos passos."
  },
  {
    key: "agendamento",
    name: "Agendamento",
    category: "Reunião",
    body: "Podemos agendar uma conversa rápida para revisar o diagnóstico e definir um plano de ação? Tenho horários disponíveis ainda esta semana."
  },
  {
    key: "apresentacao",
    name: "Apresentação",
    category: "Solução",
    body: "Preparei uma apresentação simples mostrando como a NODERE pode organizar busca, CRM, anúncios, WhatsApp e relatórios em uma operação comercial mais previsível."
  },
  {
    key: "proposta",
    name: "Proposta",
    category: "Negociação",
    body: "Com base no que conversamos, posso te enviar uma proposta com escopo, investimento e próximos passos. Qual o melhor e-mail para encaminhar?"
  },
  {
    key: "recuperacao_oportunidade",
    name: "Recuperação de oportunidade",
    category: "Reativação",
    body: "Oi, retomando nosso contato. A oportunidade de melhorar captação e presença no Google continua fazendo sentido para vocês? Posso atualizar o diagnóstico com os dados mais recentes."
  },
  {
    key: "pos_venda",
    name: "Pós-venda",
    category: "Relacionamento",
    body: "Como está a experiência até aqui? Quero confirmar se os próximos passos ficaram claros e se existe algum ponto que devemos ajustar para acelerar resultado."
  }
];

export function listWhatsappTemplates() {
  return WHATSAPP_TEMPLATES;
}

export function getWhatsappTemplate(key: string) {
  return WHATSAPP_TEMPLATES.find((template) => template.key === key);
}

export function normalizeAttachments(input: unknown): InboxAttachment[] {
  if (!Array.isArray(input)) return [];
  const attachments: InboxAttachment[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
      const source = item as Record<string, unknown>;
      const name = String(source.name || source.fileName || "").trim();
      const url = String(source.url || source.href || "").trim();
      if (!name || !url) continue;
      const attachment: InboxAttachment = { name, url };
      if (source.mimeType) attachment.mimeType = String(source.mimeType);
      if (Number.isFinite(Number(source.size))) attachment.size = Number(source.size);
      if (source.companyId) attachment.companyId = String(source.companyId);
      if (source.leadId) attachment.leadId = String(source.leadId);
      attachments.push(attachment);
  }
  return attachments;
}

export function buildInboxRow(payload: InboxPersistedPayload) {
  const attachments = normalizeAttachments(payload.attachments);
  const metadata = {
    ...(payload.metadata ?? {}),
    ...(payload.providerMessageId ? { providerMessageId: payload.providerMessageId } : {}),
    ...(payload.templateKey ? { templateKey: payload.templateKey } : {}),
    ...(payload.companyName ? { companyName: payload.companyName } : {}),
    attachments
  };

  return {
    workspace_id: payload.workspaceId,
    company_id: payload.companyId || null,
    contact_id: payload.contactId || null,
    type: payload.type ?? "whatsapp",
    direction: payload.direction ?? "manual",
    status: payload.status ?? (payload.direction === "inbound" ? "unread" : "read"),
    subject: payload.subject || null,
    body: payload.body,
    content: payload.body,
    channel: payload.type ?? "whatsapp",
    lead_id: payload.companyId || null,
    phone_from: payload.phoneFrom || null,
    phone_to: payload.phoneTo || null,
    flag_color: payload.flagColor || null,
    sent_by: payload.sentBy || null,
    sent_at: payload.sentAt || new Date().toISOString(),
    metadata
  };
}

export function sortInboxChronologically<T extends { sent_at?: string | null; created_at?: string | null; createdAt?: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const left = new Date(a.sent_at || a.created_at || a.createdAt || 0).getTime();
    const right = new Date(b.sent_at || b.created_at || b.createdAt || 0).getTime();
    return left - right;
  });
}

const conversations = new Map<string, InboxConversation>();

const SLA_HOURS = 24;

function slaDeadline(): string {
  const d = new Date();
  d.setHours(d.getHours() + SLA_HOURS);
  return d.toISOString();
}

function messageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getConversation(phone: string): InboxConversation | undefined {
  return conversations.get(phone);
}

export function listConversations(): InboxConversation[] {
  return [...conversations.values()].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export function getOrCreateConversation(phone: string, companyId?: string, companyName?: string): InboxConversation {
  if (!conversations.has(phone)) {
    conversations.set(phone, {
      phone,
      companyId,
      companyName,
      status: "open",
      slaDeadline: slaDeadline(),
      lastMessageAt: new Date().toISOString(),
      messages: []
    });
  }
  return conversations.get(phone)!;
}

export function addInboundMessage(phone: string, body: string, providerMessageId?: string): InboxMessage {
  const conv = getOrCreateConversation(phone);
  const msg: InboxMessage = {
    id: messageId(),
    conversationPhone: phone,
    direction: "inbound",
    body,
    status: "delivered",
    providerMessageId,
    createdAt: new Date().toISOString()
  };
  conv.messages.push(msg);
  conv.lastMessageAt = msg.createdAt;
  if (conv.status === "resolved") {
    conv.status = "open";
    conv.slaDeadline = slaDeadline();
  }
  return msg;
}

export function addOutboundMessage(phone: string, body: string, providerMessageId?: string): InboxMessage {
  const conv = getOrCreateConversation(phone);
  const msg: InboxMessage = {
    id: messageId(),
    conversationPhone: phone,
    direction: "outbound",
    body,
    status: "sent",
    providerMessageId,
    createdAt: new Date().toISOString()
  };
  conv.messages.push(msg);
  conv.lastMessageAt = msg.createdAt;
  return msg;
}

export function updateMessageStatus(providerMessageId: string, status: MessageStatus): void {
  for (const conv of conversations.values()) {
    const msg = conv.messages.find((m) => m.providerMessageId === providerMessageId);
    if (msg) {
      msg.status = status;
      return;
    }
  }
}

export function resolveConversation(phone: string): boolean {
  const conv = conversations.get(phone);
  if (!conv) return false;
  conv.status = "resolved";
  return true;
}

export function getSlaStatus(conv: InboxConversation): "ok" | "urgent" | "overdue" {
  const remaining = new Date(conv.slaDeadline).getTime() - Date.now();
  if (remaining < 0) return "overdue";
  if (remaining < 2 * 60 * 60 * 1000) return "urgent";
  return "ok";
}

export function parseWebhookPayload(body: unknown): Array<{ phone: string; messageId: string; text: string }> {
  const results: Array<{ phone: string; messageId: string; text: string }> = [];
  try {
    const entry = (body as any)?.entry?.[0];
    const changes = entry?.changes ?? [];
    for (const change of changes) {
      const messages = change?.value?.messages ?? [];
      for (const msg of messages) {
        if (msg.type === "text" && msg.text?.body) {
          results.push({
            phone: msg.from,
            messageId: msg.id,
            text: msg.text.body
          });
        }
      }
    }
  } catch {
    // malformed webhook — ignore
  }
  return results;
}

export function parseStatusUpdate(body: unknown): Array<{ messageId: string; status: MessageStatus }> {
  const results: Array<{ messageId: string; status: MessageStatus }> = [];
  try {
    const entry = (body as any)?.entry?.[0];
    const changes = entry?.changes ?? [];
    for (const change of changes) {
      const statuses = change?.value?.statuses ?? [];
      for (const s of statuses) {
        const status = s.status as MessageStatus;
        if (["sent", "delivered", "read", "failed"].includes(status)) {
          results.push({ messageId: s.id, status });
        }
      }
    }
  } catch {
    // malformed webhook — ignore
  }
  return results;
}
