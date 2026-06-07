"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, SlotInfo, View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { BellRing, CalendarDays, Check, Clock, Edit3, Megaphone, Phone, Plus, Trash2, X } from "lucide-react";
import { CalendarEvent, createCalendarEvent, deleteCalendarEvent, getCalendarEvents, getCompanies, updateCalendarEvent } from "@/lib/api";
import { Company } from "@/lib/types";
import { RichTextEditor, RichTextPreview } from "@/components/RichTextEditor";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales: { "pt-BR": ptBR }
});

const eventTypes = [
  { value: "reuniao", label: "Reunião", color: "#8B5CF6", icon: CalendarDays },
  { value: "followup", label: "Follow-up", color: "#3B82F6", icon: Clock },
  { value: "tarefa", label: "Tarefa", color: "#EAB308", icon: Check },
  { value: "ligacao", label: "Ligação", color: "#22C55E", icon: Phone },
  { value: "interno", label: "Interno", color: "#6B7280", icon: BellRing },
  { value: "postagem", label: "Postagem", color: "#EC4899", icon: Megaphone }
];

const aliases: Record<string, string> = {
  "follow-up": "followup",
  meeting: "reuniao",
  task: "tarefa",
  call: "ligacao",
  internal: "interno",
  content_post: "postagem"
};

const priorities = [
  { value: "alta", label: "Alta", color: "bg-rose-500 text-white" },
  { value: "media", label: "Média", color: "bg-amber-400 text-slate-950" },
  { value: "baixa", label: "Baixa", color: "bg-emerald-500 text-white" }
];

const priorityAliases: Record<string, string> = { high: "alta", medium: "media", low: "baixa" };
const messages = {
  today: "Hoje",
  previous: "Anterior",
  next: "Próximo",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Nenhum evento neste período.",
  showMore: (total: number) => `+${total} mais`
};

type CalendarItem = CalendarEvent & { start: Date; end: Date; resource: CalendarEvent };

function normalizeType(value?: string) {
  return aliases[String(value || "")] || value || "followup";
}

function normalizePriority(value?: string) {
  return priorityAliases[String(value || "")] || value || "media";
}

function toInputDate(value?: string | Date) {
  const date = value ? new Date(value) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CalendarClient({
  companyId,
  compact = false,
  defaultType = "followup",
  lockedType
}: {
  companyId?: string;
  compact?: boolean;
  defaultType?: string;
  lockedType?: string;
}) {
  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [notes, setNotes] = useState("");
  const [typeFilter, setTypeFilter] = useState(lockedType || "");
  const [statusFilter, setStatusFilter] = useState("pendente");
  const [view, setView] = useState<View>("month");

  useEffect(() => {
    void refresh();
    getCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, [companyId, lockedType, typeFilter, statusFilter]);

  async function refresh() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (companyId) params.set("company_id", companyId);
      if (lockedType) params.set("type", lockedType);
      else if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const data = await getCalendarEvents(params.toString() ? `?${params.toString()}` : "");
      setEvents(data.map((event) => ({
        ...event,
        type: normalizeType(event.type),
        priority: normalizePriority(event.priority),
        start: new Date(event.start_at),
        end: new Date(event.end_at),
        resource: event
      })));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar calendário.");
    } finally {
      setLoading(false);
    }
  }

  function openNew(slot?: SlotInfo) {
    setSelectedSlot(slot || null);
    setSelectedEvent(null);
    setNotes("");
    setShowModal(true);
  }

  function openEdit(event: CalendarItem) {
    setSelectedEvent(event.resource);
    setSelectedSlot(null);
    setNotes(event.resource.notes || "");
    setShowModal(true);
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      type: lockedType || String(form.get("type") || defaultType),
      priority: String(form.get("priority") || "media"),
      companyId: String(form.get("companyId") || companyId || "") || undefined,
      channel: String(form.get("channel") || ""),
      status: String(form.get("status") || "pendente"),
      startAt: new Date(String(form.get("startAt") || "")).toISOString(),
      endAt: new Date(String(form.get("endAt") || "")).toISOString(),
      notes
    };
    setSaving(true);
    try {
      if (selectedEvent) await updateCalendarEvent(selectedEvent.id, payload);
      else await createCalendarEvent(payload);
      setShowModal(false);
      setSelectedEvent(null);
      setSelectedSlot(null);
      await refresh();
      setMessage(selectedEvent ? "Evento atualizado." : "Evento criado.");
      requestLocalNotificationPermission();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar evento.");
    } finally {
      setSaving(false);
    }
  }

  async function markDone() {
    if (!selectedEvent) return;
    await updateCalendarEvent(selectedEvent.id, { status: "concluido" });
    setShowModal(false);
    await refresh();
  }

  async function removeEvent() {
    if (!selectedEvent || !confirm(`Excluir "${selectedEvent.title}"?`)) return;
    await deleteCalendarEvent(selectedEvent.id);
    setShowModal(false);
    await refresh();
  }

  const upcoming = useMemo(() => events.filter((event) => event.end >= new Date()).slice(0, 6), [events]);
  const height = compact ? 420 : "calc(100vh - 260px)";

  return (
    <main className={compact ? "space-y-4" : "space-y-6 p-4 md:p-8"}>
      {!compact && (
        <section className="rounded-2xl border border-line bg-panel/90 p-6 shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan"><CalendarDays className="h-4 w-4" /> Calendário comercial</p>
              <h1 className="mt-2 text-2xl font-black text-white">Agenda interativa</h1>
              <p className="text-sm text-slate-300">Mês, semana, dia e agenda em português, com eventos ligados a empresas.</p>
            </div>
            <button onClick={() => openNew()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-electric px-5 py-3 text-sm font-black text-white shadow-glow">
              <Plus className="h-4 w-4" /> Novo evento
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-panel/80 p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {lockedType ? (
            <span className="rounded-lg border border-pink-400/40 bg-pink-500/15 px-3 py-2 text-sm font-bold text-pink-100">
              {eventTypes.find((type) => type.value === lockedType)?.label || lockedType}
            </span>
          ) : (
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white">
              <option value="">Todos os tipos</option>
              {eventTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          )}
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white">
            <option value="pendente">Pendentes</option>
            <option value="concluido">Concluídos</option>
            <option value="">Todos</option>
          </select>
          {compact && <button onClick={() => openNew()} className="rounded-lg bg-electric px-4 py-2 text-sm font-bold text-white">Novo evento</button>}
          {loading && <span className="text-sm text-slate-400">Carregando...</span>}
        </div>
        <div className="calendar-shell overflow-hidden rounded-xl border border-line bg-white p-2 text-slate-950">
          <Calendar<CalendarItem>
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height }}
            messages={messages}
            culture="pt-BR"
            view={view}
            onView={setView}
            selectable
            onSelectSlot={(slot) => openNew(slot)}
            onSelectEvent={openEdit}
            eventPropGetter={(event) => ({ style: { backgroundColor: eventTypes.find((type) => type.value === normalizeType(event.type))?.color || "#3B82F6", border: "none" } })}
          />
        </div>
      </section>

      {compact && (
        <section className="rounded-2xl border border-line bg-panel/80 p-4">
          <h3 className="font-bold text-white">Próximos eventos deste cliente</h3>
          <div className="mt-3 space-y-2">
            {upcoming.length === 0 && <p className="text-sm text-slate-400">Nenhum próximo evento.</p>}
            {upcoming.map((event) => (
              <button key={event.id} onClick={() => openEdit(event)} className="w-full rounded-lg border border-line bg-ink p-3 text-left">
                <p className="font-semibold text-white">{event.title}</p>
                <p className="text-xs text-slate-400">{new Date(event.start_at).toLocaleString("pt-BR")}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {message && <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">{message}</p>}

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <form onSubmit={saveEvent} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-panel p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">{selectedEvent ? "Editar evento" : "Novo evento"}</h2>
                <p className="text-sm text-slate-400">Registre compromissos, follow-ups, tarefas ou postagens.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-line p-2 text-slate-300"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">Título<input required name="title" defaultValue={selectedEvent?.title || ""} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white outline-none focus:border-cyan" /></label>
              <label className="space-y-2 text-sm text-slate-300">Tipo<select name="type" defaultValue={normalizeType(selectedEvent?.type || lockedType || defaultType)} disabled={Boolean(lockedType)} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white disabled:opacity-70">{eventTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
              <label className="space-y-2 text-sm text-slate-300">Prioridade<select name="priority" defaultValue={normalizePriority(selectedEvent?.priority)} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white">{priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}</select></label>
              <label className="space-y-2 text-sm text-slate-300">Empresa<select name="companyId" defaultValue={selectedEvent?.company_id || companyId || ""} disabled={Boolean(companyId)} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white"><option value="">Sem empresa vinculada</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
              <label className="space-y-2 text-sm text-slate-300">Início<input required type="datetime-local" name="startAt" defaultValue={toInputDate(selectedEvent?.start_at || selectedSlot?.start)} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white" /></label>
              <label className="space-y-2 text-sm text-slate-300">Fim<input required type="datetime-local" name="endAt" defaultValue={toInputDate(selectedEvent?.end_at || selectedSlot?.end || selectedSlot?.start)} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white" /></label>
              <label className="space-y-2 text-sm text-slate-300">Canal<input name="channel" defaultValue={selectedEvent?.channel || "WhatsApp"} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white" /></label>
              <label className="space-y-2 text-sm text-slate-300">Status<select name="status" defaultValue={selectedEvent?.status || "pendente"} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white"><option value="pendente">Pendente</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select></label>
              <div className="md:col-span-2"><p className="mb-2 text-sm text-slate-300">Notas</p><RichTextEditor value={notes} onChange={setNotes} minHeight={170} placeholder="Contexto, combinados, objeções ou próximo passo" /></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-electric px-5 py-3 text-sm font-black text-white"><Edit3 className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}</button>
              {selectedEvent && <button type="button" onClick={() => void markDone()} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white">Concluir</button>}
              {selectedEvent && <button type="button" onClick={() => void removeEvent()} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-black text-white"><Trash2 className="h-4 w-4" /> Excluir</button>}
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export function CompanyMiniCalendar({ companyId }: { companyId: string }) {
  return <CalendarClient companyId={companyId} compact />;
}

function requestLocalNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") void Notification.requestPermission();
}
