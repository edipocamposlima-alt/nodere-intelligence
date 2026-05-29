import { InboxConversation, InboxMessage, MessageStatus } from "../types.js";

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
