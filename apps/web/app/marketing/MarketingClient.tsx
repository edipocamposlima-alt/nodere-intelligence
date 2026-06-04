"use client";

import { FormEvent, useEffect, useState } from "react";
import { Megaphone, Plus, Send } from "lucide-react";
import { Campaign, MessageTemplate, createCampaign, createMarketingTemplate, getCampaigns, getMarketingTemplates, getSocialStatus } from "@/lib/api";
import { getBackendRootUrl } from "@/lib/apiBase";

const API_ROOT = getBackendRootUrl();

export function MarketingClient() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [social, setSocial] = useState<Awaited<ReturnType<typeof getSocialStatus>> | null>(null);
  const [message, setMessage] = useState("");

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
    try {
      await createMarketingTemplate({
        name: String(form.get("name") || ""),
        channel: String(form.get("channel") || "whatsapp") as "whatsapp" | "email" | "linkedin",
        subject: String(form.get("subject") || ""),
        body: String(form.get("body") || ""),
        variables: ["company", "contact_name", "city", "segment", "phone", "email", "score"]
      });
      event.currentTarget.reset();
      await refresh();
      setMessage("Template salvo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar template.");
    }
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

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-line bg-panel/90 p-6 shadow-glow">
        <p className="flex items-center gap-2 text-sm font-semibold text-cyan">
          <Megaphone className="h-4 w-4" />
          Marketing
        </p>
        <h1 className="mt-2 text-2xl font-black text-white">Comunicação, campanhas e redes sociais</h1>
        <p className="text-sm text-slate-300">Estrutura operacional conectada ao banco. Integrações externas aparecem como configuradas somente quando variáveis reais existem.</p>
      </section>

      {message && <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">{message}</p>}

      <section className="grid gap-4 xl:grid-cols-2">
        <form onSubmit={saveTemplate} className="rounded-2xl border border-line bg-panel/80 p-4">
          <h2 className="font-bold text-white">Templates de mensagem</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="name" required placeholder="Nome do template" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <select name="channel" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm">
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="linkedin">LinkedIn</option>
            </select>
            <input name="subject" placeholder="Assunto (email)" className="md:col-span-2 rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <textarea name="body" required placeholder="Texto com variáveis: {{company}}, {{city}}, {{segment}}" className="md:col-span-2 min-h-32 rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-bold text-white">
              <Plus className="h-4 w-4" />
              Salvar template
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {templates.map((template) => (
              <article key={template.id} className="rounded-lg border border-line bg-ink p-3">
                <p className="font-semibold text-white">{template.name}</p>
                <p className="text-xs uppercase text-cyan">{template.channel}</p>
              </article>
            ))}
          </div>
        </form>

        <form onSubmit={saveCampaign} className="rounded-2xl border border-line bg-panel/80 p-4">
          <h2 className="font-bold text-white">Histórico de campanhas</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="name" required placeholder="Nome da campanha" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <input name="platforms" placeholder="Instagram, LinkedIn..." className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <input name="startDate" type="date" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <input name="endDate" type="date" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <input name="budgetBrl" type="number" min="0" placeholder="Orçamento R$" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <select name="status" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm">
              <option value="draft">Rascunho</option>
              <option value="active">Ativa</option>
              <option value="published">Publicada</option>
              <option value="cancelled">Cancelada</option>
            </select>
            <textarea name="notes" placeholder="Notas" className="md:col-span-2 min-h-20 rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white">
              <Send className="h-4 w-4" />
              Salvar campanha
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {campaigns.map((campaign) => (
              <article key={campaign.id} className="rounded-lg border border-line bg-ink p-3">
                <p className="font-semibold text-white">{campaign.name}</p>
                <p className="text-sm text-slate-400">{campaign.platforms?.join(", ") || "Sem plataforma"} · {campaign.status}</p>
              </article>
            ))}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-panel/80 p-4">
        <h2 className="font-bold text-white">Integrações de redes sociais</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {social?.platforms.map((platform) => (
            <article key={platform.key} className="rounded-xl border border-line bg-ink p-4">
              <p className="font-semibold text-white">{platform.name}</p>
              <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-bold ${platform.configured ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                {platform.configured ? "Configurado" : "Não configurado"}
              </span>
              {!platform.configured && <p className="mt-3 text-xs text-slate-400">Env vars: {platform.requiredEnv.join(", ")}</p>}
              <a
                href={`${API_ROOT}/api/marketing/social/connect/${platform.key}`}
                target="_blank"
                className="mt-3 inline-flex rounded-lg border border-line px-3 py-2 text-xs font-bold text-white hover:border-cyan hover:text-cyan"
              >
                {platform.configured ? "Conectar" : "Ver pendência"}
              </a>
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
    </main>
  );
}
