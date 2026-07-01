"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Copy, Info, Megaphone, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import {
  Campaign,
  MessageTemplate,
  createCalendarEvent,
  createCampaign,
  createMarketingTemplate,
  deleteMarketingTemplate,
  getCampaigns,
  getMarketingTemplates,
  getSocialStatus,
  updateMarketingTemplate
} from "@/lib/api";
import { getBackendRootUrl } from "@/lib/apiBase";
import { RichTextEditor, RichTextPreview } from "@/components/RichTextEditor";
import { CalendarClient } from "../calendar/CalendarClient";

const API_ROOT = getBackendRootUrl();
const tabs = [
  { id: "calendar", label: "Calendário de conteúdo" },
  { id: "post", label: "Criar post" },
  { id: "profiles", label: "Perfis conectados" },
  { id: "templates", label: "Templates" }
] as const;

type TabId = (typeof tabs)[number]["id"];

export function MarketingClient() {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [social, setSocial] = useState<Awaited<ReturnType<typeof getSocialStatus>> | null>(null);
  const [message, setMessage] = useState("");
  const [postBody, setPostBody] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [connectionPlatform, setConnectionPlatform] = useState<Awaited<ReturnType<typeof getSocialStatus>>["platforms"][number] | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const [templatesData, campaignsData, socialData] = await Promise.all([
        getMarketingTemplates(),
        getCampaigns(),
        getSocialStatus()
      ]);
      setTemplates(templatesData);
      setCampaigns(campaignsData);
      setSocial(socialData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar marketing.");
    }
  }

  async function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      channel: String(form.get("channel") || "whatsapp") as MessageTemplate["channel"],
      subject: String(form.get("subject") || ""),
      body: templateBody,
      variables: ["company", "contact_name", "city", "segment", "phone", "email", "score", "post_date"]
    };
    try {
      if (editingTemplate) await updateMarketingTemplate(editingTemplate.id, payload);
      else await createMarketingTemplate(payload);
      event.currentTarget.reset();
      setTemplateBody("");
      setEditingTemplate(null);
      await refresh();
      setMessage(editingTemplate ? "Template atualizado." : "Template salvo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar template.");
    }
  }

  async function removeTemplate(template: MessageTemplate) {
    if (!confirm(`Excluir template "${template.name}"?`)) return;
    try {
      await deleteMarketingTemplate(template.id);
      await refresh();
      setMessage("Template removido.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao excluir template.");
    }
  }

  function editTemplate(template: MessageTemplate) {
    setEditingTemplate(template);
    setTemplateBody(template.body);
    setActiveTab("templates");
  }

  async function saveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await createCampaign({
        name: String(form.get("name") || ""),
        platforms: String(form.get("platforms") || "").split(",").map((item) => item.trim()).filter(Boolean),
        startDate: String(form.get("startDate") || ""),
        endDate: String(form.get("endDate") || ""),
        status: String(form.get("status") || "draft"),
        budgetBrl: Number(form.get("budgetBrl") || 0),
        notes: String(form.get("notes") || "")
      });
      event.currentTarget.reset();
      await refresh();
      setMessage("Campanha salva.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar campanha.");
    }
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const scheduledFor = String(form.get("scheduledFor") || "");
    const startsAt = scheduledFor ? new Date(scheduledFor) : new Date();
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
    const image = (form.get("asset") as File | null)?.name || "";
    try {
      await createCalendarEvent({
        title: String(form.get("title") || "Post sem título"),
        type: "postagem",
        priority: "media",
        status: String(form.get("status") || "rascunho"),
        channel: String(form.get("platform") || "instagram"),
        startAt: startsAt.toISOString(),
        endAt: endsAt.toISOString(),
        notes: postBody,
        metadata: {
          platform: String(form.get("platform") || "instagram"),
          assetName: image,
          cta: String(form.get("cta") || ""),
          format: String(form.get("format") || "")
        }
      });
      setPostBody("");
      event.currentTarget.reset();
      setActiveTab("calendar");
      setMessage("Post salvo no calendário de conteúdo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar post.");
    }
  }

  return (
    <main className="space-y-6 p-4 md:p-8">
      <section className="rounded-2xl border border-line bg-panel/90 p-6 shadow-glow">
        <p className="flex items-center gap-2 text-sm font-semibold text-pink-300">
          <Megaphone className="h-4 w-4" />
          Marketing
        </p>
        <h1 className="mt-2 text-2xl font-black text-white">Comunicação, campanhas e redes sociais</h1>
        <p className="text-sm text-slate-300">Calendário de conteúdo, posts, perfis conectados e templates persistidos no banco.</p>
      </section>

      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-xl px-4 py-2 text-sm font-black transition ${activeTab === tab.id ? "bg-pink-500 text-white shadow-glow" : "border border-line bg-panel text-slate-300 hover:text-white"}`}>
            {tab.label}
          </button>
        ))}
      </nav>

      {message && <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">{message}</p>}

      {activeTab === "calendar" && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-line bg-panel/80 p-4">
            <p className="flex items-center gap-2 font-bold text-white"><CalendarDays className="h-4 w-4 text-pink-300" /> Postagens agendadas</p>
            <p className="mt-1 text-sm text-slate-400">Este calendário mostra apenas eventos do tipo postagem.</p>
          </div>
          <CalendarClient defaultType="postagem" lockedType="postagem" />
        </section>
      )}

      {activeTab === "post" && (
        <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
          <form onSubmit={savePost} className="rounded-2xl border border-line bg-panel/80 p-5">
            <h2 className="font-bold text-white">Criar post</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input name="title" required placeholder="Título interno do post" className="rounded-lg border border-line bg-ink px-3 py-3 text-sm" />
              <select name="platform" className="rounded-lg border border-line bg-ink px-3 py-3 text-sm">
                {(social?.platforms.length ? social.platforms : [
                  { key: "instagram", name: "Instagram" },
                  { key: "facebook", name: "Facebook" },
                  { key: "linkedin-pages", name: "LinkedIn Pages" },
                  { key: "google-business", name: "Google Meu Negócio" }
                ]).map((platform) => (
                  <option key={platform.key} value={platform.key}>{platform.name}</option>
                ))}
              </select>
              <select name="format" className="rounded-lg border border-line bg-ink px-3 py-3 text-sm">
                <option value="feed">Feed</option>
                <option value="story">Story</option>
                <option value="reels">Reels</option>
                <option value="carrossel">Carrossel</option>
              </select>
              <input name="scheduledFor" type="datetime-local" className="rounded-lg border border-line bg-ink px-3 py-3 text-sm" />
              <input name="cta" placeholder="CTA" className="rounded-lg border border-line bg-ink px-3 py-3 text-sm" />
              <input name="asset" type="file" accept="image/*,video/*" className="rounded-lg border border-line bg-ink px-3 py-3 text-sm" />
              <select name="status" className="rounded-lg border border-line bg-ink px-3 py-3 text-sm">
                <option value="rascunho">Rascunho</option>
                <option value="pendente">Pendente</option>
                <option value="concluido">Publicado</option>
              </select>
              <div className="md:col-span-2">
                <RichTextEditor value={postBody} onChange={setPostBody} minHeight={240} placeholder="Legenda, briefing, hashtags e observações do post..." />
              </div>
              <button className="btn-action px-5 py-3 text-sm"><Send className="h-4 w-4" />Salvar no calendário</button>
            </div>
          </form>
          <section className="rounded-2xl border border-line bg-panel/80 p-5">
            <h2 className="font-bold text-white">Campanhas</h2>
            <form onSubmit={saveCampaign} className="mt-4 grid gap-3">
              <input name="name" required placeholder="Nome da campanha" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="platforms" placeholder="Instagram, LinkedIn..." className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="startDate" type="date" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
                <input name="endDate" type="date" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              </div>
              <input name="budgetBrl" type="number" min="0" placeholder="Orçamento R$" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <textarea name="notes" placeholder="Notas" className="min-h-20 rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white">Salvar campanha</button>
            </form>
            <div className="mt-4 space-y-2">
              {campaigns.map((campaign) => (
                <article key={campaign.id} className="rounded-lg border border-line bg-ink p-3">
                  <p className="font-semibold text-white">{campaign.name}</p>
                  <p className="text-sm text-slate-400">{campaign.platforms?.join(", ") || "Sem plataforma"} · {campaign.status}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      {activeTab === "profiles" && (
        <section className="rounded-2xl border border-line bg-panel/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-white">Contas sociais do perfil: Novo Perfil</h2>
              <p className="mt-1 text-sm text-slate-400">Fluxo no padrão mLabs: escolha a rede, revise os passos e continue para o OAuth seguro do backend.</p>
            </div>
            {social?.mlabs && (
              <a href={social.mlabs.url} target="_blank" className="rounded-lg border border-line bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:border-cyan hover:text-cyan">
                Conheça o novo produto da mLabs
              </a>
            )}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
            {social?.platforms.map((platform) => (
              <article key={platform.key} className="relative rounded-xl border border-line bg-ink p-4 text-center shadow-[0_0_22px_rgba(30,111,219,0.10)]">
                <button type="button" onClick={() => setConnectionPlatform(platform)} className="absolute right-3 top-3 rounded-full text-slate-500 hover:text-white" aria-label={`Informações sobre ${platform.name}`}>
                  <Info className="h-4 w-4" />
                </button>
                <div className="flex flex-col items-center gap-3">
                  <BrandLogo platformKey={platform.key} name={platform.name} color={platform.color} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{platform.name}</p>
                    <p className="text-xs uppercase text-slate-500">{platform.category || platform.provider || "social"}</p>
                  </div>
                </div>
                <span className="nodere-status-badge mt-4" data-tone={platform.configured ? "done" : "waiting"} title={platform.configured ? "Integração configurada" : "Aguardando configuração"}>
                  <span className="nodere-status-dot" aria-hidden="true" />
                  {platform.configured ? "CONECTÁVEL" : "PENDENTE"}
                </span>
                {!platform.configured && <p className="mt-3 text-xs text-slate-400">Env vars: {platform.requiredEnv.join(", ")}</p>}
                {platform.configured && <p className="mt-3 line-clamp-2 text-xs text-slate-500">OAuth real via {platform.provider}. Tokens criptografados.</p>}
                <button type="button" onClick={() => setConnectionPlatform(platform)} className="mt-4 inline-flex rounded-lg px-3 py-2 text-xs font-black text-white shadow-glow" style={{ background: platform.color || "var(--brand-primary)" }}>
                  {platform.configured ? "Conectar" : "Ver pendência"}
                </button>
              </article>
            ))}
            {social?.mlabs && (
              <article className="rounded-xl border border-line bg-ink p-4">
                <p className="font-semibold text-white">mLabs</p>
                <p className="mt-2 text-xs text-slate-400">{social.mlabs.message}</p>
                <a href={social.mlabs.url} target="_blank" className="mt-3 inline-flex rounded-lg bg-cyan px-3 py-2 text-xs font-bold text-ink">Abrir mLabs</a>
              </article>
            )}
          </div>
        </section>
      )}

      {connectionPlatform && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <section className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white text-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <BrandLogo platformKey={connectionPlatform.key} name={connectionPlatform.name} color={connectionPlatform.color} />
                <h3 className="font-black">Conecte o {connectionPlatform.name}</h3>
              </div>
              <button onClick={() => setConnectionPlatform(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar conexão">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              {connectionPlatform.configured ? (
                <>
                  <ConnectionStep index={1} title={`Faça login no ${connectionPlatform.name}`} text="Abra uma nova aba segura do provedor e confirme que está usando a conta correta." />
                  <ConnectionStep index={2} title="Autorize o NODERE a gerenciar esta conexão" text="As permissões solicitadas seguem o escopo necessário para leitura, publicação, métricas ou anúncios da integração." />
                  <ConnectionStep index={3} title="Finalize a conexão simplificada" text="O backend troca o code por token e salva tudo criptografado por workspace. Nenhum token é exposto no frontend." />
                </>
              ) : (
                <>
                  <ConnectionStep index={1} title="Credenciais ainda não configuradas" text="Peça ao administrador para ativar as credenciais desta integração." muted />
                  <ConnectionStep index={2} title="Depois atualize a conexão" text="A conexão fica ativa quando as credenciais reais estiverem disponíveis no backend." muted />
                  <ConnectionStep index={3} title="Volte aqui e clique em Conectar" text="O card passará para CREDENCIAIS OK e abrirá o OAuth real." muted />
                </>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <button onClick={() => setConnectionPlatform(null)} className="text-sm font-semibold text-slate-500 hover:text-slate-900">Cancelar</button>
              {connectionPlatform.configured ? (
                <a href={`${API_ROOT}/api/marketing/social/connect/${connectionPlatform.key}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-black text-white" style={{ background: connectionPlatform.color || "var(--brand-primary)" }}>
                  Continuar <CheckCircle2 className="h-4 w-4" />
                </a>
              ) : (
                <button className="rounded-lg bg-slate-200 px-5 py-3 text-sm font-black text-slate-500" disabled>Continuar</button>
              )}
            </div>
          </section>
        </div>
      )}

      {activeTab === "templates" && (
        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={saveTemplate} className="rounded-2xl border border-line bg-panel/80 p-5">
            <h2 className="font-bold text-white">{editingTemplate ? "Editar template" : "Novo template"}</h2>
            <div className="mt-4 grid gap-3">
              <input name="name" required defaultValue={editingTemplate?.name || ""} placeholder="Nome do template" className="rounded-lg border border-line bg-ink px-3 py-3 text-sm" />
              <select name="channel" defaultValue={editingTemplate?.channel || "whatsapp"} className="rounded-lg border border-line bg-ink px-3 py-3 text-sm">
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram_dm">Instagram DM</option>
              </select>
              <input name="subject" defaultValue={editingTemplate?.subject || ""} placeholder="Assunto (email)" className="rounded-lg border border-line bg-ink px-3 py-3 text-sm" />
              <RichTextEditor value={templateBody} onChange={setTemplateBody} minHeight={230} placeholder="Texto com variáveis: {{company}}, {{city}}, {{segment}}" />
              <div className="rounded-lg border border-line bg-ink p-3 text-xs text-slate-400">
                Variáveis disponíveis: {"{{company}}"}, {"{{contact_name}}"}, {"{{city}}"}, {"{{segment}}"}, {"{{phone}}"}, {"{{email}}"}, {"{{score}}"}, {"{{post_date}}"}
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-action px-4 py-2 text-sm"><Plus className="h-4 w-4" />{editingTemplate ? "Atualizar" : "Salvar"}</button>
                {editingTemplate && <button type="button" onClick={() => { setEditingTemplate(null); setTemplateBody(""); }} className="btn-secondary-action px-4 py-2 text-sm">Cancelar edição</button>}
              </div>
            </div>
          </form>
          <div className="space-y-3">
            {templates.length === 0 && <p className="rounded-lg border border-line bg-panel p-4 text-sm text-slate-400">Nenhum template salvo.</p>}
            {templates.map((template) => (
              <article key={template.id} className="rounded-xl border border-line bg-panel/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{template.name}</p>
                    <p className="text-xs uppercase text-cyan">{template.channel}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(template.body)} className="rounded-lg border border-line p-2 text-slate-300 hover:text-white" title="Copiar"><Copy className="h-4 w-4" /></button>
                    <button onClick={() => editTemplate(template)} className="rounded-lg border border-line p-2 text-slate-300 hover:text-white" title="Editar"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => void removeTemplate(template)} className="rounded-lg border border-line p-2 text-red-300 hover:text-red-200" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-line bg-ink p-3 text-sm">
                  <RichTextPreview value={template.body} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ConnectionStep({ index, title, text, muted = false }: { index: number; title: string; text: string; muted?: boolean }) {
  return (
    <div className="flex gap-4">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${muted ? "bg-slate-100 text-slate-400" : "bg-slate-100 text-slate-700"}`}>{index}</span>
      <div>
        <p className="font-bold text-slate-800">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function BrandLogo({ platformKey, name, color, size = "md" }: { platformKey: string; name: string; color?: string; size?: "md" | "lg" }) {
  const brand = brandMarks[platformKey] || { label: name.slice(0, 2).toUpperCase(), background: color || "var(--brand-primary)", foreground: "#FFFFFF" };
  const dimension = size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-2xl font-black tracking-tight shadow-[0_10px_28px_rgba(15,23,42,0.25)] ${dimension}`}
      style={{ background: brand.background, color: brand.foreground }}
      aria-label={`Logo ${name}`}
      title={name}
    >
      {brand.label}
    </span>
  );
}

const brandMarks: Record<string, { label: string; background: string; foreground: string }> = {
  instagram: { label: "IG", background: "linear-gradient(135deg,#F58529,#DD2A7B,#8134AF,#515BD4)", foreground: "#FFFFFF" },
  facebook: { label: "f", background: "#1877F2", foreground: "#FFFFFF" },
  tiktok: { label: "♪", background: "linear-gradient(135deg,#111111 0%,#111111 42%,#25F4EE 43%,#FE2C55 100%)", foreground: "#FFFFFF" },
  "linkedin-pages": { label: "in", background: "#0A66C2", foreground: "#FFFFFF" },
  "linkedin-personal": { label: "in", background: "#0A66C2", foreground: "#FFFFFF" },
  "google-business": { label: "G", background: "linear-gradient(135deg,#4285F4,#34A853,#FBBC05,#EA4335)", foreground: "#FFFFFF" },
  pinterest: { label: "P", background: "#E60023", foreground: "#FFFFFF" },
  youtube: { label: "▶", background: "#FF0000", foreground: "#FFFFFF" },
  threads: { label: "@", background: "#111111", foreground: "#FFFFFF" },
  "google-analytics-4": { label: "GA4", background: "#F9AB00", foreground: "#1F2937" },
  x: { label: "X", background: "#000000", foreground: "#FFFFFF" },
  "meta-ads": { label: "∞", background: "#0866FF", foreground: "#FFFFFF" },
  "google-ads": { label: "Ads", background: "linear-gradient(135deg,#4285F4,#34A853,#FBBC05)", foreground: "#FFFFFF" },
  "linkedin-ads": { label: "in", background: "#0A66C2", foreground: "#FFFFFF" },
  "tiktok-ads": { label: "TT", background: "linear-gradient(135deg,#111111,#25F4EE,#FE2C55)", foreground: "#FFFFFF" },
  "rd-station": { label: "RD", background: "#16A3A6", foreground: "#FFFFFF" }
};
