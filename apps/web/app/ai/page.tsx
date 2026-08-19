"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/NativeLink";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage
} from "ai";
import { ArchiveRestore, Bot, Check, ChevronRight, Coins, History, Maximize2, PanelLeftClose, PanelRightClose, Plus, ShieldCheck, Sparkles, Trash2, X } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage
} from "@/components/ai-elements/prompt-input";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle
} from "@/components/ai-elements/confirmation";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";

type AiMetadata = {
  conversationId: string;
  executionId: string;
  agentId: string;
  modelId: string;
  provider: string;
  routingMode?: "automatic" | "manual";
};

type NodereMessage = UIMessage<AiMetadata>;
type ModelOption = {
  id: string;
  provider: string;
  label: string;
  capabilityTier: string;
  inputCostUsdPerMillion: number;
  cachedInputCostUsdPerMillion: number;
  outputCostUsdPerMillion: number;
  reasoningEffort: string;
};
type AgentOption = {
  id: string;
  label: string;
  description: string;
  defaultModelId: string;
  allowedModelIds: string[];
  allowedTools: string[];
};
type ConversationItem = {
  id: string;
  title: string;
  agent_id: string;
  model_id: string;
  status: "active" | "archived";
  updated_at: string;
};
type Wallet = {
  available: number;
  held: number;
  lifetimeSpent: number;
  creditsPerUsd: number;
  accountType?: "STANDARD" | "OWNER_INTERNAL";
  commercialBlocking?: boolean;
  usageMeteringEnabled?: boolean;
  providerLimitsStillApply?: boolean;
};

export default function NodereAiPage() {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState("commercial-copilot");
  const [modelId, setModelId] = useState("openai:gpt-5.6-terra");
  const [routingMode, setRoutingMode] = useState<"automatic" | "manual">("automatic");
  const [loadingShell, setLoadingShell] = useState(true);
  const [shellError, setShellError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [historyView, setHistoryView] = useState<"active" | "archived">("active");

  const transport = useMemo(() => new DefaultChatTransport<NodereMessage>({
    api: "/api/backend/ai/chat",
    prepareSendMessagesRequest: ({ id, messages, trigger, messageId }) => ({
      body: {
        id,
        messages,
        trigger,
        messageId,
        conversationId,
        agentId,
        modelId,
        routingMode,
        requestId: crypto.randomUUID()
      }
    })
  }), [agentId, conversationId, modelId, routingMode]);

  const refreshOperationalData = useCallback(async () => {
    const [registryResponse, conversationsResponse, walletResponse] = await Promise.all([
      fetch("/api/backend/ai/registry", { cache: "no-store" }),
      fetch(`/api/backend/ai/conversations?limit=30&status=${historyView}`, { cache: "no-store" }),
      fetch("/api/backend/ai/wallet", { cache: "no-store" })
    ]);
    if (!registryResponse.ok || !conversationsResponse.ok || !walletResponse.ok) {
      const failed = [registryResponse, conversationsResponse, walletResponse].find((response) => !response.ok)!;
      const payload = await failed.json().catch(() => ({}));
      throw new Error(payload.message || "A infraestrutura AI-first ainda não está disponível.");
    }
    const registry = await registryResponse.json();
    const conversationRows = await conversationsResponse.json();
    const walletPayload = await walletResponse.json();
    setModels(registry.models || []);
    setAgents(registry.agents || []);
    setConversations(conversationRows || []);
    setWallet(walletPayload);
    setAgentId((current) => registry.agents?.some((agent: AgentOption) => agent.id === current)
      ? current
      : (registry.agents?.[0]?.id || current));
    setModelId((current) => registry.models?.some((model: ModelOption) => model.id === current)
      ? current
      : (registry.models?.[0]?.id || current));
  }, [historyView]);

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
    error,
    addToolApprovalResponse
  } = useChat<NodereMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onFinish: ({ message }) => {
      if (message.metadata?.conversationId) setConversationId(message.metadata.conversationId);
      void refreshOperationalData().catch(() => undefined);
    }
  });

  useEffect(() => {
    let cancelled = false;
    setLoadingShell(true);
    refreshOperationalData()
      .then(() => {
        if (!cancelled) setShellError("");
      })
      .catch((loadError) => {
        if (!cancelled) setShellError(loadError instanceof Error ? loadError.message : "Falha ao carregar a NODERE AI.");
      })
      .finally(() => {
        if (!cancelled) setLoadingShell(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshOperationalData]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const syncPanels = () => {
      setHistoryOpen(desktop.matches);
      setDetailsOpen(desktop.matches);
    };
    syncPanels();
    desktop.addEventListener("change", syncPanels);
    return () => desktop.removeEventListener("change", syncPanels);
  }, []);

  const selectedAgent = agents.find((agent) => agent.id === agentId);
  const allowedModels = models.filter((model) => !selectedAgent || selectedAgent.allowedModelIds.includes(model.id));
  const selectedModel = models.find((model) => model.id === modelId);
  const blocked = !wallet || (wallet.commercialBlocking !== false && wallet.available <= 0);
  const busy = status === "submitted" || status === "streaming";

  async function submitPrompt(message: PromptInputMessage) {
    const text = message.text.trim();
    if (!text || blocked || busy) return;
    await sendMessage({ text });
  }

  async function openConversation(item: ConversationItem) {
    if (busy) return;
    const response = await fetch(`/api/backend/ai/conversations/${encodeURIComponent(item.id)}`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    const restored = (payload.messages || [])
      .filter((message: { role?: string }) => message.role === "user" || message.role === "assistant")
      .map((message: { id: string; role: "user" | "assistant"; parts: NodereMessage["parts"] }) => ({
        id: message.id,
        role: message.role,
        parts: message.parts
      })) as NodereMessage[];
    setConversationId(item.id);
    setAgentId(item.agent_id);
    setModelId(item.model_id);
    setMessages(restored);
  }

  function newConversation() {
    if (busy) return;
    setConversationId(null);
    setMessages([]);
  }

  function toggleHistory() {
    setFocusMode(false);
    setHistoryOpen((value) => !value);
    if (window.innerWidth < 1280) setDetailsOpen(false);
  }

  function toggleDetails() {
    setFocusMode(false);
    setDetailsOpen((value) => !value);
    if (window.innerWidth < 1280) setHistoryOpen(false);
  }

  async function moveConversation(item: ConversationItem, nextStatus: "active" | "archived") {
    if (busy) return;
    const response = await fetch(`/api/backend/ai/conversations/${encodeURIComponent(item.id)}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setShellError(payload.message || "Não foi possível atualizar a conversa.");
      return;
    }
    if (conversationId === item.id) newConversation();
    await refreshOperationalData();
  }

  const historyPanel = (
    <>
      <button type="button" onClick={newConversation} disabled={busy} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:opacity-50">
        <Plus className="h-4 w-4" /> Nova conversa
      </button>
      <div className="mt-4 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
          <History className="h-4 w-4" /> Histórico
        </div>
        <div className="flex rounded-lg border border-line p-0.5 text-[10px] font-bold">
          <button type="button" onClick={() => setHistoryView("active")} className={`rounded-md px-2 py-1.5 ${historyView === "active" ? "bg-emerald-400/15 text-emerald-200" : "text-slate-400"}`}>Ativas</button>
          <button type="button" onClick={() => setHistoryView("archived")} className={`rounded-md px-2 py-1.5 ${historyView === "archived" ? "bg-emerald-400/15 text-emerald-200" : "text-slate-400"}`}>Lixeira</button>
        </div>
      </div>
      <div className="nodere-tools-scroll mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">
        {conversations.map((item) => (
          <div key={item.id} className={`group flex items-center gap-1 rounded-lg pr-1 transition ${conversationId === item.id ? "bg-emerald-400/15" : "hover:bg-white/5"}`}>
            <button type="button" disabled={item.status === "archived"} onClick={() => void openConversation(item)} className={`min-w-0 flex-1 px-3 py-2.5 text-left text-sm ${conversationId === item.id ? "text-white" : "text-slate-300"}`}>
              <span className="block truncate font-semibold">{item.title}</span>
              <span className="mt-1 block text-[10px] text-slate-500">{new Date(item.updated_at).toLocaleString("pt-BR")}</span>
            </button>
            <button
              type="button"
              onClick={() => void moveConversation(item, item.status === "archived" ? "active" : "archived")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-transparent text-slate-400 hover:border-line hover:text-emerald-200"
              aria-label={item.status === "archived" ? `Restaurar conversa ${item.title}` : `Mover conversa ${item.title} para a lixeira`}
              title={item.status === "archived" ? "Restaurar" : "Mover para lixeira"}
            >
              {item.status === "archived" ? <ArchiveRestore className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        ))}
        {!loadingShell && conversations.length === 0 && <p className="px-3 py-6 text-center text-xs text-slate-500">{historyView === "archived" ? "A lixeira está vazia." : "Nenhuma conversa salva."}</p>}
      </div>
    </>
  );

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-150px)] w-full max-w-[1800px] flex-col gap-4 px-3 py-4 md:px-6">
      <header className="nodere-ai-hero rounded-2xl border border-emerald-400/20 p-4 shadow-card md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-emerald-300/30 bg-emerald-400/10 text-emerald-300">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">NODERE AI · operação comercial</p>
              <h1 className="mt-1 text-xl font-black text-white md:text-2xl">Converse, analise e opere com rastreabilidade</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">A IA consulta o CRM por ferramentas autorizadas. Alterações persistentes pedem sua aprovação e retornam recibo.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 font-bold text-emerald-100">
              <ShieldCheck className="h-4 w-4" /> Workspace isolado
            </span>
            <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-bold ${blocked ? "border-rose-400/30 bg-rose-500/10 text-rose-100" : "border-cyan-400/25 bg-cyan-400/10 text-cyan-100"}`}>
              <Coins className="h-4 w-4" /> {wallet?.accountType === "OWNER_INTERNAL" ? "Uso técnico medido · sem bloqueio comercial" : wallet ? `${wallet.available.toLocaleString("pt-BR", { maximumFractionDigits: 4 })} créditos` : "Saldo indisponível"}
            </span>
          </div>
        </div>
      </header>

      {shellError && (
        <section className="rounded-xl border border-amber-300/35 bg-amber-300/10 p-4 text-sm text-amber-100" role="alert">
          <p className="font-bold">Gateway AI-first indisponível</p>
          <p className="mt-1">{shellError}</p>
        </section>
      )}

      {!focusMode && historyOpen && (
        <div className="fixed inset-0 z-[70] xl:hidden" role="dialog" aria-modal="true" aria-label="Histórico de conversas">
          <button type="button" className="absolute inset-0 bg-black/55" onClick={() => setHistoryOpen(false)} aria-label="Fechar histórico" />
          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col border-r border-line bg-panel p-3 shadow-2xl">
            <div className="mb-2 flex justify-end"><button type="button" className="grid h-10 w-10 place-items-center rounded-lg border border-line" onClick={() => setHistoryOpen(false)} aria-label="Fechar histórico"><X className="h-4 w-4" /></button></div>
            {historyPanel}
          </aside>
        </div>
      )}

      {!focusMode && detailsOpen && (
        <div className="fixed inset-0 z-[70] xl:hidden" role="dialog" aria-modal="true" aria-label="Detalhes da NODERE AI">
          <button type="button" className="absolute inset-0 bg-black/55" onClick={() => setDetailsOpen(false)} aria-label="Fechar detalhes" />
          <aside className="absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-2xl border-t border-line bg-panel p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3"><h2 className="font-black">Detalhes da operação</h2><button type="button" className="grid h-10 w-10 place-items-center rounded-lg border border-line" onClick={() => setDetailsOpen(false)} aria-label="Fechar detalhes"><X className="h-4 w-4" /></button></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <section className="rounded-xl border border-line bg-ink/40 p-4"><p className="text-xs font-black uppercase text-emerald-300">Agente</p><p className="mt-2 font-bold">{selectedAgent?.label || "Carregando…"}</p><p className="mt-1 text-sm text-slate-400">{selectedAgent?.description}</p></section>
              <section className="rounded-xl border border-line bg-ink/40 p-4"><p className="text-xs font-black uppercase text-cyan-300">Modelo</p><p className="mt-2 font-bold">{routingMode === "automatic" ? "Seleção automática" : selectedModel?.label || "Carregando…"}</p><p className="mt-1 text-sm text-slate-400">{wallet?.accountType === "OWNER_INTERNAL" ? "Uso técnico medido; limites do provedor continuam válidos." : `${wallet?.available || 0} créditos disponíveis.`}</p></section>
            </div>
          </aside>
        </div>
      )}

      <div className={`grid min-h-[680px] flex-1 gap-4 ${focusMode || (!historyOpen && !detailsOpen) ? "xl:grid-cols-[minmax(0,1fr)]" : historyOpen && detailsOpen ? "xl:grid-cols-[250px_minmax(0,1fr)_280px]" : historyOpen ? "xl:grid-cols-[250px_minmax(0,1fr)]" : "xl:grid-cols-[minmax(0,1fr)_280px]"}`}>
        {!focusMode && historyOpen && <aside className="hidden min-h-0 flex-col rounded-2xl border border-line bg-panel/75 p-3 xl:flex">{historyPanel}</aside>}

        <main className="nodere-ai-chat-surface flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-line shadow-card">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-3 md:px-4">
            <div className="flex items-center gap-1">
              <button type="button" onClick={toggleHistory} className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-panel text-slate-300 hover:border-emerald-400" aria-label={historyOpen ? "Recolher histórico" : "Mostrar histórico"} title={historyOpen ? "Recolher histórico" : "Mostrar histórico"}><PanelLeftClose className="h-4 w-4" /></button>
              <button type="button" onClick={toggleDetails} className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-panel text-slate-300 hover:border-cyan-400" aria-label={detailsOpen ? "Recolher detalhes" : "Mostrar detalhes"} title={detailsOpen ? "Recolher detalhes" : "Mostrar detalhes"}><PanelRightClose className="h-4 w-4" /></button>
              <button type="button" onClick={() => setFocusMode((value) => !value)} className={`grid h-10 w-10 place-items-center rounded-lg border bg-panel ${focusMode ? "border-emerald-400 text-emerald-300" : "border-line text-slate-300"}`} aria-label="Alternar modo foco" title="Modo foco"><Maximize2 className="h-4 w-4" /></button>
            </div>
            <label className="min-w-0 flex-1 md:max-w-xs">
              <span className="sr-only">Agente</span>
              <select value={agentId} onChange={(event) => {
                const nextAgent = agents.find((agent) => agent.id === event.target.value);
                setAgentId(event.target.value);
                if (nextAgent) setModelId(nextAgent.defaultModelId);
              }} disabled={busy} className="min-h-10 w-full rounded-lg border border-line bg-panel px-3 text-sm font-bold text-white outline-none focus:border-emerald-400">
                {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.label}</option>)}
              </select>
            </label>
            <label className="min-w-0 flex-1 md:max-w-[220px]">
              <span className="sr-only">Roteamento de modelo</span>
              <select value={routingMode} onChange={(event) => setRoutingMode(event.target.value as "automatic" | "manual")} disabled={busy} className="min-h-10 w-full rounded-lg border border-line bg-panel px-3 text-sm font-bold text-white outline-none focus:border-[var(--nodere-gold-soft)]">
                <option value="automatic">Modelo automático</option>
                <option value="manual">Escolha manual</option>
              </select>
            </label>
            <label className="min-w-0 flex-1 md:max-w-xs">
              <span className="sr-only">Modelo</span>
              <select value={modelId} onChange={(event) => setModelId(event.target.value)} disabled={busy || routingMode === "automatic"} className="min-h-10 w-full rounded-lg border border-line bg-panel px-3 text-sm font-bold text-white outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">
                {allowedModels.map((model) => <option key={model.id} value={model.id}>{model.label} · {model.capabilityTier}</option>)}
              </select>
            </label>
            {routingMode === "automatic" && <span className="w-full text-xs text-slate-400">A NODERE seleciona o modelo por complexidade, ferramentas e custo antes de cada resposta.</span>}
          </div>

          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto w-full max-w-4xl gap-6 p-4 md:p-6">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<Bot className="h-8 w-8" />}
                  title="O que vamos operar hoje?"
                  description="Peça um resumo do pipeline, encontre leads ou prepare uma próxima ação. A IA consultará apenas os dados autorizados."
                >
                  <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                    {["Resuma os gargalos do meu pipeline", "Liste os leads mais recentes", "Quais oportunidades precisam de follow-up?", "Ajude a priorizar os próximos contatos"].map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => !blocked && !busy && void sendMessage({ text: suggestion })} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-line bg-panel/80 px-4 text-left text-sm font-semibold text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/10 disabled:opacity-50" disabled={blocked || busy}>
                        {suggestion}<ChevronRight className="h-4 w-4 shrink-0 text-emerald-300" />
                      </button>
                    ))}
                  </div>
                </ConversationEmptyState>
              ) : messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, index) => {
                      if (part.type === "text") return <MessageResponse key={`${message.id}-text-${index}`}>{part.text}</MessageResponse>;
                      if (!isToolUIPart(part)) return null;
                      const approval = "approval" in part ? part.approval : undefined;
                      const output = "output" in part ? part.output : undefined;
                      const errorText = "errorText" in part ? part.errorText : undefined;
                      return (
                        <Tool key={part.toolCallId} defaultOpen={part.state === "approval-requested"} className="border-line bg-panel/80">
                          {part.type === "dynamic-tool" ? (
                            <ToolHeader type="dynamic-tool" state={part.state} toolName={part.toolName} />
                          ) : (
                            <ToolHeader type={part.type} state={part.state} />
                          )}
                          <ToolContent>
                            <ToolInput input={part.input} />
                            <Confirmation approval={approval} state={part.state} className="border-amber-300/30 bg-amber-300/10">
                              <ConfirmationRequest>
                                <ConfirmationTitle>Esta ação altera dados do workspace. Revise os parâmetros acima antes de autorizar.</ConfirmationTitle>
                                <ConfirmationActions>
                                  <ConfirmationAction variant="outline" onClick={() => approval && void addToolApprovalResponse({ id: approval.id, approved: false, reason: "Negado pelo usuário" })}>
                                    <X className="h-4 w-4" /> Negar
                                  </ConfirmationAction>
                                  <ConfirmationAction onClick={() => approval && void addToolApprovalResponse({ id: approval.id, approved: true })}>
                                    <Check className="h-4 w-4" /> Autorizar
                                  </ConfirmationAction>
                                </ConfirmationActions>
                              </ConfirmationRequest>
                              <ConfirmationAccepted>Ação autorizada. O recibo será registrado após a execução.</ConfirmationAccepted>
                              <ConfirmationRejected>Ação negada. Nenhuma alteração foi executada.</ConfirmationRejected>
                            </Confirmation>
                            <ToolOutput output={output} errorText={errorText} />
                          </ToolContent>
                        </Tool>
                      );
                    })}
                  </MessageContent>
                </Message>
              ))}
              {error && <p className="rounded-xl border border-rose-400/35 bg-rose-500/10 p-3 text-sm text-rose-100" role="alert">{error.message}</p>}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t border-line bg-ink/70 p-3 md:p-4">
            {blocked ? (
              <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100 sm:flex-row sm:items-center sm:justify-between">
                <span>Sem créditos disponíveis. Nenhuma chamada ao provedor será iniciada.</span>
                <Link href="/billing" className="font-black underline underline-offset-4">Ver planos</Link>
              </div>
            ) : (
              <PromptInput onSubmit={submitPrompt} className="mx-auto max-w-4xl rounded-xl border border-line bg-panel">
                <PromptInputBody>
                  <PromptInputTextarea placeholder="Peça uma análise ou uma ação comercial…" disabled={busy} />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools>
                    <span className="px-2 text-[11px] text-slate-500">Enter envia · Shift+Enter quebra linha</span>
                  </PromptInputTools>
                  <PromptInputSubmit status={status} onStop={stop} />
                </PromptInputFooter>
              </PromptInput>
            )}
          </div>
        </main>

        {!focusMode && detailsOpen && <aside className="hidden min-h-0 flex-col gap-3 xl:flex">
          <section className="rounded-2xl border border-line bg-panel/75 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Agente ativo</p>
            <h2 className="mt-2 font-black text-white">{selectedAgent?.label || "Carregando…"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{selectedAgent?.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedAgent?.allowedTools.map((toolName) => <span key={toolName} className="rounded-md border border-line bg-white/5 px-2 py-1 text-[10px] text-slate-300">{toolName}</span>)}
            </div>
          </section>
          <section className="rounded-2xl border border-line bg-panel/75 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">Modelo e custo</p>
            <h2 className="mt-2 font-black text-white">{routingMode === "automatic" ? "Seleção automática" : selectedModel?.label || "Carregando…"}</h2>
            {routingMode === "automatic" && <p className="mt-2 text-xs leading-5 text-slate-400">Tarefas simples usam o modelo eficiente; análises e operações complexas escalam automaticamente.</p>}
            {selectedModel && routingMode === "manual" && <div className="mt-3 space-y-2 text-xs text-slate-400">
              <div className="flex justify-between gap-3"><span>Entrada / 1M</span><strong className="text-slate-200">US$ {selectedModel.inputCostUsdPerMillion.toFixed(2)}</strong></div>
              <div className="flex justify-between gap-3"><span>Cache / 1M</span><strong className="text-slate-200">US$ {selectedModel.cachedInputCostUsdPerMillion.toFixed(2)}</strong></div>
              <div className="flex justify-between gap-3"><span>Saída / 1M</span><strong className="text-slate-200">US$ {selectedModel.outputCostUsdPerMillion.toFixed(2)}</strong></div>
              <div className="flex justify-between gap-3"><span>Raciocínio</span><strong className="text-slate-200">{selectedModel.reasoningEffort}</strong></div>
            </div>}
          </section>
          <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-xs leading-5 text-slate-300">
            <p className="font-black text-emerald-200">Como a cobrança funciona</p>
            <p className="mt-2">A NODERE reserva um teto antes da chamada, captura o custo calculado pelos tokens usados e devolve automaticamente a diferença.</p>
          </section>
        </aside>}
      </div>
    </div>
  );
}
