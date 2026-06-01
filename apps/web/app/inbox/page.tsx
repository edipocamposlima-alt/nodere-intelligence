import { getInbox } from "@/lib/api";
import { InboxManualPanel } from "./InboxManualPanel";

export default async function InboxPage() {
  const conversations = await getInbox().catch(() => []);

  const open = conversations.filter((c: any) => c.status !== "resolved");
  const resolved = conversations.filter((c: any) => c.status === "resolved");

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

      <InboxManualPanel initialConversations={conversations} />
    </div>
  );
}
