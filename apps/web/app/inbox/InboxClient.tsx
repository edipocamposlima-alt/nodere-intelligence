"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Flag, MessageCircle, Plus, RefreshCw, Search } from "lucide-react";
import { InboxMessage, createInboxMessage, getCompanies, getInboxMessages, updateInboxMessage } from "@/lib/api";
import { Company } from "@/lib/types";
import { RichTextEditor, RichTextPreview } from "@/components/RichTextEditor";

const filters = [
  { value: "", label: "Todas" },
  { value: "unread", label: "Não lidas" },
  { value: "flagged", label: "Marcadas" },
  { value: "resolved", label: "Resolvidas" }
];

const interactionTypes = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "ligacao", label: "Ligação" },
  { value: "reuniao", label: "Reunião" },
  { value: "interno", label: "Interno" },
  { value: "manual", label: "Manual" }
];

export function InboxClient() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void refresh();
    getCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, [status]);

  async function refresh() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "80" });
      if (status) params.set("status", status);
      const payload = await getInboxMessages(`?${params.toString()}`);
      setMessages(payload.messages);
      setSelectedId((current) => current || payload.messages[0]?.id || "");
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar caixa de entrada.");
    } finally {
      setLoading(false);
    }
  }

  const enriched = useMemo(() => {
    const byId = new Map(companies.map((company) => [company.id, company]));
    return messages.map((item) => ({ ...item, company: item.company || (item.company_id ? byId.get(item.company_id) : undefined) }));
  }, [companies, messages]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return enriched;
    return enriched.filter((item) => [
      item.subject,
      item.body,
      item.company?.name,
      item.company?.phone,
      item.company?.whatsapp,
      item.phone_from,
      item.phone_to
    ].filter(Boolean).join(" ").toLowerCase().includes(term));
  }, [enriched, query]);

  const selected = enriched.find((item) => item.id === selectedId) || filtered[0];
  const selectedCompany = selected?.company || companies.find((company) => company.id === selected?.company_id);

  async function saveInteraction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const saved = await createInboxMessage({
        companyId: String(form.get("companyId") || "") || undefined,
        type: String(form.get("type") || "manual") as InboxMessage["type"],
        direction: String(form.get("direction") || "manual") as InboxMessage["direction"],
        status: String(form.get("status") || "read") as InboxMessage["status"],
        subject: String(form.get("subject") || ""),
        body,
        flagColor: String(form.get("flagColor") || ""),
        sentBy: String(form.get("sentBy") || "Operador"),
        sentAt: String(form.get("sentAt") || new Date().toISOString())
      });
      setMessages((items) => [saved, ...items]);
      setSelectedId(saved.id);
      setOpenModal(false);
      setBody("");
      setMessage("Interação registrada no Inbox.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao registrar interação.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item: InboxMessage, nextStatus: InboxMessage["status"]) {
    try {
      const updated = await updateInboxMessage(item.id, { status: nextStatus });
      setMessages((items) => items.map((message) => message.id === item.id ? updated : message));
      setSelectedId(updated.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao atualizar mensagem.");
    }
  }

  return (
    <main className="space-y-5 p-4 md:p-8">
      <section className="rounded-2xl border border-line bg-panel/90 p-5 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-300"><MessageCircle className="h-4 w-4" /> Caixa de entrada</p>
            <h1 className="mt-1 text-2xl font-black text-white">Interações comerciais</h1>
            <p className="text-sm text-slate-300">WhatsApp, email, ligações e registros manuais persistidos no Supabase.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void refresh()} className="btn-secondary-action px-4 py-2 text-sm"><RefreshCw className="h-4 w-4" />Atualizar</button>
            <button onClick={() => setOpenModal(true)} className="btn-action px-4 py-2 text-sm"><Plus className="h-4 w-4" />Registrar interação</button>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
        <AlertTriangle className="mr-2 inline h-4 w-4" />
        WhatsApp Cloud API só sincroniza automaticamente quando as variáveis oficiais estiverem configuradas no backend. Enquanto isso, use o registro manual e o link wa.me no cliente.
      </div>

      {message && <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">{message}</p>}

      <section className="grid min-h-[68vh] overflow-hidden rounded-2xl border border-line bg-panel/80 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="border-b border-line bg-ink/70 p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2">
            <Search className="h-4 w-4 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por empresa, telefone ou texto" className="w-full bg-transparent text-sm text-white outline-none" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button key={filter.value || "all"} onClick={() => setStatus(filter.value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${status === filter.value ? "bg-emerald-400 text-slate-950" : "border border-line text-slate-300 hover:text-white"}`}>
                {filter.label}
              </button>
            ))}
          </div>
          <div className="mt-4 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
            {loading && <p className="text-sm text-slate-400">Carregando mensagens...</p>}
            {!loading && filtered.length === 0 && <p className="rounded-lg border border-line bg-panel p-4 text-sm text-slate-400">Nenhuma interação encontrada.</p>}
            {filtered.map((item) => (
              <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.id === item.id ? "border-emerald-300 bg-emerald-400/10" : "border-line bg-panel/80 hover:border-cyan/60"}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-bold text-white">{item.company?.name || item.subject || item.phone_from || "Interação sem empresa"}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${item.status === "unread" ? "bg-rose-500 text-white" : item.status === "flagged" ? "bg-amber-300 text-slate-950" : "bg-white/10 text-slate-300"}`}>{item.status}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{item.body || item.subject || "Sem texto"}</p>
                <p className="mt-2 text-xs text-slate-500">{item.type} · {item.sent_at ? new Date(item.sent_at).toLocaleString("pt-BR") : "sem data"}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="grid min-h-[68vh] lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col p-5">
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedCompany?.name || selected.subject || "Interação"}</h2>
                    <p className="text-sm text-slate-400">{selected.type} · {selected.direction} · {selected.sent_at ? new Date(selected.sent_at).toLocaleString("pt-BR") : "sem data"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void changeStatus(selected, "read")} className="btn-secondary-action px-3 py-2 text-xs"><Check className="h-3.5 w-3.5" />Lida</button>
                    <button onClick={() => void changeStatus(selected, "flagged")} className="rounded-lg bg-amber-300 px-3 py-2 text-xs font-black text-slate-950"><Flag className="inline h-3.5 w-3.5" /> Marcar</button>
                    <button onClick={() => void changeStatus(selected, "resolved")} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-white">Resolver</button>
                  </div>
                </div>
                <article className="mt-5 rounded-2xl border border-line bg-ink p-5">
                  {selected.subject && <p className="mb-3 font-bold text-cyan">{selected.subject}</p>}
                  <RichTextPreview value={selected.body || "Sem conteúdo registrado."} />
                </article>
              </>
            ) : (
              <div className="grid flex-1 place-items-center text-center text-slate-400">
                <p>Selecione uma interação ou registre uma nova.</p>
              </div>
            )}
          </div>
          <aside className="border-t border-line bg-ink/60 p-5 lg:border-l lg:border-t-0">
            <h3 className="font-bold text-white">Cliente vinculado</h3>
            {selectedCompany ? (
              <div className="mt-4 space-y-3 text-sm">
                <p className="font-semibold text-cyan">{selectedCompany.name}</p>
                <p className="text-slate-400">{selectedCompany.city || "Cidade não informada"} / {selectedCompany.state || ""}</p>
                <p className="text-slate-400">{selectedCompany.phone || selectedCompany.whatsapp || "Telefone não informado"}</p>
                <p className="text-slate-400">Status: {selectedCompany.status || "Novo Lead"}</p>
                <Link href={`/companies/${selectedCompany.id}`} className="btn-action mt-3 inline-flex px-4 py-2 text-sm">Abrir ficha</Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">Nenhuma empresa vinculada.</p>
            )}
          </aside>
        </section>
      </section>

      {openModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <form onSubmit={saveInteraction} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-panel p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">Registrar interação</h2>
                <p className="text-sm text-slate-400">Registre WhatsApp, email, ligação, reunião ou nota interna.</p>
              </div>
              <button type="button" onClick={() => setOpenModal(false)} className="rounded-lg border border-line px-3 py-2 text-sm text-white">Fechar</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">Empresa<select name="companyId" className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white"><option value="">Sem empresa</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
              <label className="space-y-2 text-sm text-slate-300">Tipo<select name="type" className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white">{interactionTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label className="space-y-2 text-sm text-slate-300">Direção<select name="direction" className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white"><option value="manual">Manual</option><option value="inbound">Entrada</option><option value="outbound">Saída</option></select></label>
              <label className="space-y-2 text-sm text-slate-300">Status<select name="status" className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white"><option value="read">Lida</option><option value="unread">Não lida</option><option value="flagged">Marcada</option><option value="resolved">Resolvida</option></select></label>
              <label className="space-y-2 text-sm text-slate-300">Assunto<input name="subject" className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white" /></label>
              <label className="space-y-2 text-sm text-slate-300">Data/hora<input name="sentAt" type="datetime-local" className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white" /></label>
              <label className="space-y-2 text-sm text-slate-300">Responsável<input name="sentBy" defaultValue="Operador" className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-white" /></label>
              <label className="space-y-2 text-sm text-slate-300">Cor da marcação<input name="flagColor" type="color" defaultValue="#FACC15" className="h-12 w-full rounded-lg border border-line bg-ink px-2" /></label>
              <div className="md:col-span-2">
                <RichTextEditor value={body} onChange={setBody} minHeight={220} placeholder="Conteúdo da interação..." />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpenModal(false)} className="btn-secondary-action px-4 py-2 text-sm">Cancelar</button>
              <button disabled={saving || !body.trim()} className="btn-action px-4 py-2 text-sm disabled:opacity-60">{saving ? "Salvando..." : "Salvar interação"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
