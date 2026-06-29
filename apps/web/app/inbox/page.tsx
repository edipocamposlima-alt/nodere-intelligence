import { Clock, MessageCircle, UserCircle } from "lucide-react";
import { getInbox } from "@/lib/api";
import type { InboxConversation } from "@/lib/types";

function SlaChip({ status }: { status: "ok" | "urgent" | "overdue" }) {
  const map = {
    ok: "border-success/30 bg-success/10 text-emerald-300",
    urgent: "border-warning/30 bg-warning/10 text-yellow-300",
    overdue: "border-danger/30 bg-danger/10 text-red-300"
  } as const;
  const label = { ok: "No prazo", urgent: "Urgente", overdue: "SLA vencido" };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
}

function ConversationStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-electric/20 text-blue-300",
    resolved: "bg-success/20 text-emerald-300",
    pending: "bg-warning/20 text-yellow-300"
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] ?? "bg-white/10 text-slate-400"}`}>
      {status}
    </span>
  );
}

export default async function InboxPage() {
  const conversations = await getInbox().catch(() => []);

  const open = conversations.filter((c) => c.status !== "resolved");
  const resolved = conversations.filter((c) => c.status === "resolved");

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Caixa de entrada</h2>
          <p className="mt-1 text-sm text-slate-400">
            {open.length} conversa{open.length !== 1 ? "s" : ""} aberta{open.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-panel/90 px-4 py-2 text-center">
          <p className="text-xs text-slate-400">SLA: 24h</p>
          <p className="text-lg font-semibold text-white">{conversations.length}</p>
          <p className="text-xs text-slate-500">conversas</p>
        </div>
      </div>

      {conversations.length === 0 && (
        <div className="rounded-lg border border-dashed border-line p-12 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-500">Nenhuma conversa ainda.</p>
          <p className="mt-1 text-xs text-slate-600">
            Configure o webhook WhatsApp Cloud API para receber mensagens aqui.
          </p>
        </div>
      )}

      {open.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Abertas</h3>
          {open.map((conv) => (
            <ConversationCard key={conv.phone} conv={conv} />
          ))}
        </section>
      )}

      {resolved.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resolvidas</h3>
          {resolved.map((conv) => (
            <ConversationCard key={conv.phone} conv={conv} />
          ))}
        </section>
      )}
    </div>
  );
}

function ConversationCard({ conv }: { conv: InboxConversation & { slaStatus?: "ok" | "urgent" | "overdue"; messageCount?: number; lastMessage?: InboxConversation["messages"][number] | null } }) {
  const lastMessage = conv.lastMessage;
  const relativeTime = lastMessage
    ? new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(
        Math.round((new Date(lastMessage.createdAt).getTime() - Date.now()) / 60000),
        "minute"
      )
    : null;

  return (
    <div className="rounded-lg border border-line bg-panel/90 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
            <UserCircle className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-white">{conv.companyName ?? conv.phone}</p>
              <ConversationStatusBadge status={conv.status} />
              {conv.slaStatus && conv.status !== "resolved" && <SlaChip status={conv.slaStatus} />}
            </div>
            <p className="text-xs text-slate-500">{conv.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {relativeTime && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {relativeTime}
            </span>
          )}
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
            {conv.messageCount} msg
          </span>
        </div>
      </div>
      {lastMessage && (
        <p className="mt-3 truncate rounded-md bg-ink px-3 py-2 text-xs text-slate-400">
          {lastMessage.direction === "inbound" ? "← " : "→ "}
          {lastMessage.body}
        </p>
      )}
      {conv.assignedTo && (
        <p className="mt-2 text-xs text-slate-600">Atribuído: {conv.assignedTo}</p>
      )}
    </div>
  );
}
