"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, SlotInfo, View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { BellRing, CalendarDays, Check, Clock, Edit3, ListChecks, Megaphone, Phone, Plus, Presentation, RefreshCw, RotateCcw, Send, Trash2, UserRound, X } from "lucide-react";
import { CalendarEvent, createCalendarEvent, deleteCalendarEvent, getCalendarEvents, getCompanies, getOperators, updateCalendarEvent } from "@/lib/api";
import { Company, Operator } from "@/lib/types";
import { RichTextEditor, RichTextPreview } from "@/components/RichTextEditor";
import { useAuth } from "@/context/AuthProvider";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales: { "pt-BR": ptBR }
});

const eventTypes = [
  { value: "ligacao", label: "Ligacao", color: "#22C55E", icon: Phone },
  { value: "reuniao", label: "Reuniao", color: "#8B5CF6", icon: CalendarDays },
  { value: "demonstracao", label: "Demonstracao", color: "#06B6D4", icon: Presentation },
  { value: "proposta", label: "Proposta", color: "#F59E0B", icon: Send },
  { value: "retorno", label: "Retorno", color: "#3B82F6", icon: RotateCcw },
  { value: "pos_venda", label: "Pos-venda", color: "#10B981", icon: Check },
  { value: "followup", label: "Follow-up", color: "#3B82F6", icon: Clock },
  { value: "tarefa", label: "Tarefa", color: "#EAB308", icon: ListChecks },
  { value: "interno", label: "Interno", color: "#6B7280", icon: BellRing },
  { value: "postagem", label: "Postagem", color: "#EC4899", icon: Megaphone }
];

const aliases: Record<string, string> = {
  "follow-up": "followup",
  meeting: "reuniao",
  task: "tarefa",
  call: "ligacao",
  internal: "interno",
  content_post: "postagem",
  demo: "demonstracao",
  demonstracao: "demonstracao",
  proposal: "proposta",
  follow_up: "followup",
  after_sale: "pos_venda"
};

const statuses = [
  { value: "pendente", label: "Pendente", className: "bg-amber-400 text-slate-950" },
  { value: "confirmado", label: "Confirmado", className: "bg-cyan text-slate-950" },
  { value: "realizado", label: "Realizado", className: "bg-emerald-500 text-white" },
  { value: "cancelado", label: "Cancelado", className: "bg-rose-500 text-white" },
  { value: "reagendado", label: "Reagendado", className: "bg-violet-500 text-white" }
];

const priorities = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baixa", label: "Baixa" }
];

const priorityAliases: Record<string, string> = { high: "alta", medium: "media", low: "baixa", urgent: "alta", "Média": "media", "Alta": "alta", "Baixa": "baixa" };
const messages = {
  today: "Hoje",
  previous: "Anterior",
  next: "Proximo",
  month: "Mes",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Nenhum evento neste periodo.",
  showMore: (total: number) => `+${total} mais`
};

type CalendarItem = CalendarEvent & { start: Date; end: Date; resource: CalendarEvent };

function normalizeType(value?: string) {
  return aliases[String(value || "")] || value || "followup";
}

function normalizeStatus(value?: string) {
  if (value === "concluido" || value === "done") return "realizado";
  if (value === "rascunho" || value === "Rascunho") return "pendente";
  return value || "pendente";
}

function normalizePriority(value?: string) {
  return priorityAliases[String(value || "")] || value || "media";
}

function toInputDate(value?: string | Date) {
  const date = value ? new Date(value) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMinutes(value: string | Date, minutes: number) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

function reminderDate(startAt: string, minutes: number) {
  const date = new Date(startAt);
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
}

function getTypeMeta(type: string) {
  return eventTypes.find((item) => item.value === normalizeType(type)) ?? eventTypes[6];
}

function getStatusMeta(status?: string) {
  return statuses.find((item) => item.value === normalizeStatus(status)) ?? statuses[0];
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
  const { user } = useAuth();
  const role = user?.role || "viewer";
  const readOnly = role === "viewer";
  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [notes, setNotes] = useState("");
  const [typeFilter, setTypeFilter] = useState(lockedType || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [operatorFilter, setOperatorFilter] = useState(role === "operator" && user?.id ? user.id : "");
  const [view, setView] = useState<View>(compact ? "agenda" : "month");

  useEffect(() => {
    void refresh();
    getCompanies().then(setCompanies).catch(() => setCompanies([]));
    if (!compact) getOperators().then(setOperators).catch(() => setOperators([]));
  }, [companyId, lockedType, typeFilter, statusFilter, operatorFilter, compact]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    const timers = events
      .filter((event) => event.reminder_enabled && event.reminder_at)
      .map((event) => {
        const delay = new Date(event.reminder_at || "").getTime() - Date.now();
        if (delay <= 0 || delay > 2147483647) return null;
        return window.setTimeout(() => {
          new Notification("Lembrete NODERI", { body: `${event.title} · ${new Date(event.start_at).toLocaleString("pt-BR")}` });
        }, delay);
      })
      .filter((timer): timer is number => timer !== null);
    return () => timers.forEach(window.clearTimeout);
  }, [events]);

  async function refresh() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (companyId) params.set("company_id", companyId);
      if (lockedType) params.set("type", lockedType);
      else if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (operatorFilter) params.set("operator_id", operatorFilter);
      const data = await getCalendarEvents(params.toString() ? `?${params.toString()}` : "");
      setEvents(data.map((event) => ({
        ...event,
        type: normalizeType(event.type),
        priority: normalizePriority(event.priority),
        status: normalizeStatus(event.status),
        start: new Date(event.start_at),
        end: new Date(event.end_at),
        resource: event
      })));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar calendario.");
    } finally {
      setLoading(false);
    }
  }

  function openNew(slot?: SlotInfo) {
    if (readOnly) return;
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
    if (readOnly) return;
    const form = new FormData(event.currentTarget);
    const startAt = new Date(String(form.get("startAt") || "")).toISOString();
    const endAt = new Date(String(form.get("endAt") || "")).toISOString();
    const reminderEnabled = form.get("reminderEnabled") === "on";
    const reminderMinutes = Number(form.get("reminderMinutes") || 30);
    const payload = {
      title: String(form.get("title") || ""),
      type: lockedType || String(form.get("type") || defaultType),
      priority: String(form.get("priority") || "media"),
      companyId: String(form.get("companyId") || companyId || "") || undefined,
      assignedTo: String(form.get("assignedTo") || "") || undefined,
      channel: String(form.get("channel") || ""),
      status: String(form.get("status") || "pendente"),
      startAt,
      endAt,
      notes,
      reminderEnabled,
      reminderMinutes,
      reminderAt: reminderEnabled ? reminderDate(startAt, reminderMinutes) : null,
      metadata: {
        source: companyId ? "lead_calendar" : "global_calendar",
        browserReminder: reminderEnabled
      }
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

  async function setStatus(status: string) {
    if (!selectedEvent || readOnly) return;
    await updateCalendarEvent(selectedEvent.id, { status });
    setShowModal(false);
    await refresh();
  }

  async function removeEvent() {
    if (!selectedEvent || readOnly || !confirm(`Excluir "${selectedEvent.title}"?`)) return;
    await deleteCalendarEvent(selectedEvent.id);
    setShowModal(false);
    await refresh();
  }

  const upcoming = useMemo(() => events.filter((event) => event.end >= new Date()).slice(0, compact ? 4 : 8), [events, compact]);
  const overdue = useMemo(() => events.filter((event) => event.end < new Date() && normalizeStatus(event.status) === "pendente"), [events]);
  const height = compact ? 420 : "calc(100vh - 300px)";

  return (
    <main className={compact ? "space-y-4" : "space-y-6 p-4 md:p-8"}>
      {!compact && (
        <section className="rounded-2xl border border-line bg-panel/90 p-6 shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan"><CalendarDays className="h-4 w-4" /> Calendario comercial</p>
              <h1 className="mt-2 text-2xl font-black text-white">Agenda central NODERI</h1>
              <p className="text-sm text-slate-300">Visoes de mes, semana, dia e agenda com filtros por lead, operador, tipo e status.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-bold text-slate-200">
                <RefreshCw className="h-4 w-4" /> Atualizar
              </button>
              {!readOnly && (
                <button onClick={() => openNew()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-electric px-5 py-3 text-sm font-black text-white shadow-glow">
                  <Plus className="h-4 w-4" /> Novo evento
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {!compact && (
        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Eventos carregados" value={events.length} />
          <Metric label="Proximos compromissos" value={upcoming.length} />
          <Metric label="Pendentes vencidos" value={overdue.length} tone={overdue.length ? "danger" : "default"} />
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
            <option value="">Todos os status</option>
            {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
          {!compact && (
            <select value={operatorFilter} onChange={(event) => setOperatorFilter(event.target.value)} disabled={role === "operator"} className="rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white disabled:opacity-70">
              <option value="">Todos os operadores</option>
              {operators.map((operator) => <option key={operator.id} value={operator.id}>{operator.name}</option>)}
            </select>
          )}
          {compact && !readOnly && <button onClick={() => openNew()} className="rounded-lg bg-electric px-4 py-2 text-sm font-bold text-white">Novo evento</button>}
          {loading && <span className="text-sm text-slate-400">Carregando...</span>}
          {readOnly && <span className="rounded-full border border-line px-3 py-1 text-xs font-bold text-slate-300">Somente leitura</span>}
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
            views={["month", "week", "day", "agenda"]}
            onView={setView}
            selectable={!readOnly}
            onSelectSlot={(slot) => openNew(slot)}
            onSelectEvent={openEdit}
            eventPropGetter={(event) => ({ style: { backgroundColor: getTypeMeta(event.type).color, border: "none" } })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-panel/80 p-4">
        <h3 className="font-bold text-white">{compact ? "Timeline do lead" : "Proximos eventos"}</h3>
        <div className="mt-3 space-y-2">
          {upcoming.length === 0 && <p className="text-sm text-slate-400">Nenhum proximo evento.</p>}
          {upcoming.map((event) => {
            const status = getStatusMeta(event.status);
            const type = getTypeMeta(event.type);
            const Icon = type.icon;
            return (
              <button key={event.id} onClick={() => openEdit(event)} className="w-full rounded-lg border border-line bg-ink p-3 text-left hover:border-cyan/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-white"><Icon className="h-4 w-4" /> {event.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(event.start_at).toLocaleString("pt-BR")} · {type.label}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {message && <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">{message}</p>}

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <form onSubmit={saveEvent} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-panel p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">{selectedEvent ? "Editar evento" : "Novo evento"}</h2>
                <p className="text-sm text-slate-400">Registre compromissos comerciais ligados ao funil, lead e operador.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-line p-2 text-slate-300"><X className="h-4 w-4" /></button>
            </div>
            <fieldset disabled={readOnly} className="mt-5 grid gap-4 disabled:opacity-80 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">Titulo<input required name="title" defaultValue={selectedEvent?.title || ""} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white outline-none focus:border-cyan" /></label>
              <label className="space-y-2 text-sm text-slate-300">Tipo<select name="type" defaultValue={normalizeType(selectedEvent?.type || lockedType || defaultType)} disabled={Boolean(lockedType) || readOnly} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white disabled:opacity-70">{eventTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
              <label className="space-y-2 text-sm text-slate-300">Prioridade<select name="priority" defaultValue={normalizePriority(selectedEvent?.priority)} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white">{priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}</select></label>
              <label className="space-y-2 text-sm text-slate-300">Status<select name="status" defaultValue={normalizeStatus(selectedEvent?.status)} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white">{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              <label className="space-y-2 text-sm text-slate-300">Lead<select name="companyId" defaultValue={selectedEvent?.company_id || companyId || ""} disabled={Boolean(companyId) || readOnly} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white"><option value="">Sem lead vinculado</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
              <label className="space-y-2 text-sm text-slate-300">Operador<select name="assignedTo" defaultValue={selectedEvent?.assigned_to || user?.id || ""} disabled={role === "operator" || readOnly} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white disabled:opacity-70"><option value="">Sem operador</option>{operators.map((operator) => <option key={operator.id} value={operator.id}>{operator.name}</option>)}</select></label>
              <label className="space-y-2 text-sm text-slate-300">Inicio<input required type="datetime-local" name="startAt" defaultValue={toInputDate(selectedEvent?.start_at || selectedSlot?.start)} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white" /></label>
              <label className="space-y-2 text-sm text-slate-300">Fim<input required type="datetime-local" name="endAt" defaultValue={toInputDate(selectedEvent?.end_at || selectedSlot?.end || addMinutes(selectedSlot?.start || new Date(), 30))} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white" /></label>
              <label className="space-y-2 text-sm text-slate-300">Canal<input name="channel" defaultValue={selectedEvent?.channel || "WhatsApp"} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white" /></label>
              <label className="space-y-2 text-sm text-slate-300">Lembrete<select name="reminderMinutes" defaultValue={selectedEvent?.reminder_minutes ?? 30} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white"><option value="0">No horario</option><option value="15">15 minutos antes</option><option value="30">30 minutos antes</option><option value="60">1 hora antes</option><option value="1440">1 dia antes</option></select></label>
              <label className="flex items-center gap-3 rounded-lg border border-line bg-ink px-3 py-3 text-sm text-slate-300 md:col-span-2"><input name="reminderEnabled" type="checkbox" defaultChecked={Boolean(selectedEvent?.reminder_enabled)} /> Ativar lembrete interno e navegador</label>
              <div className="md:col-span-2"><p className="mb-2 text-sm text-slate-300">Notas</p><RichTextEditor value={notes} onChange={setNotes} minHeight={170} placeholder="Contexto, combinados, objeções ou próximo passo" /></div>
            </fieldset>
            <div className="mt-5 flex flex-wrap gap-2">
              {!readOnly && <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-electric px-5 py-3 text-sm font-black text-white"><Edit3 className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}</button>}
              {selectedEvent && !readOnly && <button type="button" onClick={() => void setStatus("realizado")} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white">Realizado</button>}
              {selectedEvent && !readOnly && <button type="button" onClick={() => void setStatus("reagendado")} className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-black text-white">Reagendado</button>}
              {selectedEvent && !readOnly && <button type="button" onClick={() => void removeEvent()} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-black text-white"><Trash2 className="h-4 w-4" /> Excluir</button>}
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

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "danger" }) {
  return (
    <div className="rounded-xl border border-line bg-panel/90 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-black ${tone === "danger" ? "text-rose-300" : "text-white"}`}>{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function requestLocalNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") void Notification.requestPermission();
}
