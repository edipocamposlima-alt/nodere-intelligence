"use client";

import { FormEvent, useState } from "react";
import { Archive, MessageCircle, Plus, Send } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_URL = getApiBaseUrl();

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `API HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function InboxManualPanel({ initialConversations }: { initialConversations: any[] }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    try {
      const conversation = await api<any>("/inbox", {
        method: "POST",
        body: JSON.stringify({
          phone: String(form.get("phone") || "").replace(/\D/g, ""),
          companyName: String(form.get("companyName") || ""),
          message: String(form.get("message") || "")
        })
      });
      setConversations((items) => [conversation, ...items.filter((item) => item.phone !== conversation.phone)]);
      target?.reset();
      setMessage("Conversa manual criada.");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar conversa.");
    }
  }

  async function archive(phone: string) {
    try {
      await api(`/inbox/${phone}/resolve`, { method: "PATCH" });
      setConversations((items) => items.map((item) => item.phone === phone ? { ...item, status: "resolved" } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível arquivar.");
    }
  }

  async function reply(phone: string, text: string) {
    try {
      const response = await api<any>(`/inbox/${phone}/reply`, { method: "POST", body: JSON.stringify({ message: text }) });
      setMessage(response?.whatsapp?.mode === "link" ? "WhatsApp oficial não configurado. Use o link gerado via wa.me." : "Resposta registrada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível responder.");
    }
  }

  return (
    <section className="space-y-5">
      <form onSubmit={createConversation} className="rounded-lg border border-line bg-panel/90 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4 text-cyan" />
          Criar conversa manual
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_2fr_auto]">
          <input name="phone" required placeholder="WhatsApp/telefone" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
          <input name="companyName" placeholder="Empresa/lead" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
          <input name="message" required placeholder="Cole ou escreva a conversa/mensagem" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
          <button className="rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white">Salvar</button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Uso manual enquanto WhatsApp Cloud API/webhook não estiver configurado.</p>
      </form>

      {message && <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}
      {error && <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-200">{error}</p>}

      {conversations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-12 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-500">Nenhuma conversa ainda.</p>
          <p className="mt-1 text-xs text-slate-600">Crie uma conversa manual ou configure o webhook WhatsApp Cloud API.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const lastMessage = conv.lastMessage ?? conv.messages?.at?.(-1);
            const text = `Olá! Retomando nosso contato sobre a presença digital da ${conv.companyName || "sua empresa"}.`;
            return (
              <article key={conv.phone} className="rounded-lg border border-line bg-panel/90 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-white">{conv.companyName || conv.phone}</p>
                    <p className="mt-1 text-xs text-slate-500">{conv.phone} · {conv.status}</p>
                    {lastMessage && <p className="mt-3 rounded-md bg-ink px-3 py-2 text-sm text-slate-300">{lastMessage.body}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => reply(conv.phone, text)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-white"><Send className="h-4 w-4" />Responder</button>
                    <a target="_blank" href={`https://wa.me/${conv.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`} className="inline-flex items-center gap-2 rounded-lg bg-success px-3 py-2 text-xs font-semibold text-ink"><MessageCircle className="h-4 w-4" />wa.me</a>
                    <button onClick={() => archive(conv.phone)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-white"><Archive className="h-4 w-4" />Arquivar</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
