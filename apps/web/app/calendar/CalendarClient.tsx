"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BellRing, CalendarCheck2, CalendarClock, CalendarDays, Check, Filter, Phone, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { CalendarEvent, createCalendarEvent, deleteCalendarEvent, getCalendarEvents, updateCalendarEvent } from "@/lib/api";

const eventTypes = [
  { value: "follow-up", label: "Follow-up", color: "from-blue-500 to-cyan-400", icon: CalendarClock },
  { value: "meeting", label: "Reunião", color: "from-purple-500 to-fuchsia-400", icon: CalendarDays },
  { value: "task", label: "Tarefa", color: "from-amber-400 to-yellow-300", icon: CalendarCheck2 },
  { value: "call", label: "Ligação", color: "from-emerald-500 to-lime-400", icon: Phone },
  { value: "internal", label: "Interno", color: "from-slate-500 to-slate-300", icon: Filter },
  { value: "content_post", label: "Postagem/Conteúdo", color: "from-pink-500 to-rose-400", icon: BellRing }
];

const priorities = [
  { value: "high", label: "Alta", color: "bg-rose-500 text-white" },
  { value: "medium", label: "Média", color: "bg-amber-400 text-slate-950" },
  { value: "low", label: "Baixa", color: "bg-emerald-500 text-white" }
];

const channels = ["WhatsApp", "E-mail", "Ligação", "Reunião", "Visita", "Outro"];

export function CalendarClient() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("pendente");

  useEffect(() => {
    void refresh();
  }, [typeFilter, statusFilter]);

  async function refresh() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const query = params.toString() ? `?${params.toString()}` : "";
      setEvents(await getCalendarEvents(query));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar calendário.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startAt = String(form.get("startAt") || "");
    const endAt = String(form.get("endAt") || startAt);
    setSaving(true);
    try {
      await createCalendarEvent({
        title: String(form.get("title") || "Follow-up"),
        type: String(form.get("type") || "follow-up"),
        priority: String(form.get("priority") || "medium"),
        channel: String(form.get("channel") || "WhatsApp"),
        status: "pendente",
        startAt,
        endAt,
        notes: String(form.get("notes") || "")
      });
      event.currentTarget.reset();
      await refresh();
      setMessage("Evento criado e salvo no banco.");
      requestLocalNotificationPermission();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao criar evento.");
    } finally {
      setSaving(false);
    }
  }

  async function completeEvent(item: CalendarEvent) {
    try {
      await updateCalendarEvent(item.id, { status: "concluido" });
      await refresh();
      setMessage("Evento marcado como concluído.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir o evento.");
    }
  }

  async function removeEvent(item: CalendarEvent) {
    if (!window.confirm(`Excluir o evento "${item.title}"?`)) return;
    try {
      await deleteCalendarEvent(item.id);
      await refresh();
      setMessage("Evento excluído.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o evento.");
    }
  }

  const grouped = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    return {
      late: events.filter((item) => item.status !== "concluido" && new Date(item.start_at) < now),
      today: events.filter((item) => {
        const date = new Date(item.start_at);
        return item.status !== "concluido" && date >= now && date <= todayEnd;
      }),
      next: events.filter((item) => new Date(item.start_at) > todayEnd)
    };
  }, [events]);

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-line bg-panel/90 p-6 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-cyan">
              <CalendarDays className="h-4 w-4" />
              Calendário comercial
            </p>
            <h1 className="mt-2 text-2xl font-black text-white">Agenda e follow-ups</h1>
            <p className="text-sm text-slate-300">Crie compromissos reais, acompanhe atrasados e alimente o sininho com lembretes do dia.</p>
          </div>
          <button onClick={refresh} className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan hover:text-cyan">
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </section>

      <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-panel/80 p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-300">Título</span>
            <input name="title" required placeholder="Ex: Retomar proposta com decisor" className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none focus:border-cyan" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-300">Tipo</span>
            <select name="type" className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none focus:border-cyan">
              {eventTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-300">Prioridade</span>
            <select name="priority" className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none focus:border-cyan">
              {priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-300">Canal</span>
            <select name="channel" className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none focus:border-cyan">
              {channels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-300">Data e hora inicial</span>
            <input name="startAt" required type="datetime-local" className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none focus:border-cyan" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-300">Data e hora final</span>
            <input name="endAt" required type="datetime-local" className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none focus:border-cyan" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-300">Notas</span>
            <textarea name="notes" placeholder="Contexto, combinados, objeções ou próximo passo" className="mt-2 min-h-24 w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none focus:border-cyan" />
          </label>
        </div>
        <button disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-electric px-5 py-3 text-sm font-black text-white shadow-glow disabled:opacity-60 md:w-auto">
          <Plus className="h-4 w-4" />
          {saving ? "Salvando..." : "Criar lembrete"}
        </button>
      </form>

      <section className="grid gap-3 rounded-2xl border border-line bg-panel/80 p-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Filtrar por tipo</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm">
            <option value="">Todos os tipos</option>
            {eventTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm">
            <option value="pendente">Pendentes</option>
            <option value="concluido">Concluídos</option>
            <option value="">Todos</option>
          </select>
        </label>
        <div className="rounded-xl border border-cyan/30 bg-cyan/10 p-3 text-sm text-cyan">
          <p className="font-bold">Sininho operacional</p>
          <p className="mt-1 text-cyan/80">Atrasados: {grouped.late.length} · Hoje: {grouped.today.length} · Próximos: {grouped.next.length}</p>
        </div>
      </section>

      {message && <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">{message}</p>}

      <section className="rounded-2xl border border-line bg-panel/80 p-4">
        <h2 className="text-lg font-bold text-white">Eventos</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Carregando...</p>
        ) : events.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-ink/70 p-5 text-sm text-slate-400">Nenhum evento encontrado para os filtros selecionados. Crie um lembrete para aparecer no calendário e no sininho.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {events.map((item) => {
              const type = eventTypes.find((entry) => entry.value === item.type) ?? eventTypes[0];
              const priority = priorities.find((entry) => entry.value === item.priority) ?? priorities[1];
              const Icon = type.icon;
              const done = item.status === "concluido";
              return (
                <article key={item.id} className={`rounded-xl border border-line bg-ink p-4 ${done ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${type.color} px-3 py-1 text-xs font-black text-white`}>
                        <Icon className="h-3.5 w-3.5" />
                        {type.label}
                      </span>
                      <h3 className={`mt-3 truncate font-bold text-white ${done ? "line-through" : ""}`}>{item.title}</h3>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${priority.color}`}>{priority.label}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{new Date(item.start_at).toLocaleString("pt-BR")}</p>
                  {item.channel && <p className="mt-1 text-xs text-cyan">Canal: {item.channel}</p>}
                  {item.notes && <p className="mt-2 line-clamp-3 text-sm text-slate-400">{item.notes}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.status !== "concluido" && (
                      <button onClick={() => completeEvent(item)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-200">
                        <Check className="h-3.5 w-3.5" />
                        Concluir
                      </button>
                    )}
                    <button onClick={() => removeEvent(item)} className="inline-flex items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-200">
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function requestLocalNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}
