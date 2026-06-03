"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { CalendarEvent, createCalendarEvent, getCalendarEvents } from "@/lib/api";

const eventTypes = ["follow-up", "meeting", "task", "call", "internal", "content_post"];
const priorities = ["high", "medium", "low"];

export function CalendarClient() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      setEvents(await getCalendarEvents());
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
    try {
      await createCalendarEvent({
        title: String(form.get("title") || "Follow-up"),
        type: String(form.get("type") || "follow-up"),
        priority: String(form.get("priority") || "medium"),
        startAt,
        endAt,
        notes: String(form.get("notes") || "")
      });
      event.currentTarget.reset();
      await refresh();
      setMessage("Evento criado e salvo no banco.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao criar evento.");
    }
  }

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
            <p className="text-sm text-slate-300">Crie compromissos reais e acompanhe o histórico de contatos do workspace.</p>
          </div>
          <button onClick={refresh} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan hover:text-cyan">
            Atualizar
          </button>
        </div>
      </section>

      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-line bg-panel/80 p-4 md:grid-cols-6">
        <input name="title" required placeholder="Título" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <select name="type" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm">
          {eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select name="priority" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm">
          {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <input name="startAt" required type="datetime-local" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <input name="endAt" required type="datetime-local" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-bold text-white">
          <Plus className="h-4 w-4" />
          Novo evento
        </button>
        <textarea name="notes" placeholder="Notas do evento" className="md:col-span-6 min-h-20 rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
      </form>

      {message && <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">{message}</p>}

      <section className="rounded-2xl border border-line bg-panel/80 p-4">
        <h2 className="text-lg font-bold text-white">Eventos</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Carregando...</p>
        ) : events.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Nenhum evento cadastrado ainda.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {events.map((item) => (
              <article key={item.id} className="rounded-xl border border-line bg-ink p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-white">{item.title}</h3>
                  <span className="rounded-full bg-cyan/15 px-2 py-1 text-xs font-bold text-cyan">{item.type}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{new Date(item.start_at).toLocaleString("pt-BR")}</p>
                {item.notes && <p className="mt-2 text-sm text-slate-400">{item.notes}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
