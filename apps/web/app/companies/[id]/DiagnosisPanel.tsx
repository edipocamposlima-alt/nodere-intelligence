"use client";

import { useState } from "react";
import { Bot, Check, ChevronRight, ClipboardCopy, Loader2, Mail, MessageCircle, Phone, Sparkles } from "lucide-react";

interface CommercialDiagnosis {
  mode: "openai" | "template";
  summary: string;
  whatsappCopy: string;
  emailSubject: string;
  emailBody: string;
  pitch: string;
  callScript: string;
  suggestedServices: string[];
  generatedAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://nodere-api.onrender.com/api";

type Tab = "whatsapp" | "email" | "pitch" | "script";

export function DiagnosisPanel({ companyId }: { companyId: string }) {
  const [diagnosis, setDiagnosis] = useState<CommercialDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("whatsapp");
  const [copied, setCopied] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/companies/${companyId}/diagnosis`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao gerar diagnóstico");
      setDiagnosis(await res.json());
    } catch {
      setError("Não foi possível gerar o diagnóstico. Verifique se a API está rodando.");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const tabs: { id: Tab; label: string; icon: typeof MessageCircle }[] = [
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { id: "email", label: "Email", icon: Mail },
    { id: "pitch", label: "Pitch", icon: Sparkles },
    { id: "script", label: "Ligação", icon: Phone }
  ];

  const tabContent: Record<Tab, { text: string; copyKey: string }> = diagnosis
    ? {
        whatsapp: { text: diagnosis.whatsappCopy, copyKey: "whatsapp" },
        email: { text: `Assunto: ${diagnosis.emailSubject}\n\n${diagnosis.emailBody}`, copyKey: "email" },
        pitch: { text: diagnosis.pitch, copyKey: "pitch" },
        script: { text: diagnosis.callScript, copyKey: "script" }
      }
    : { whatsapp: { text: "", copyKey: "" }, email: { text: "", copyKey: "" }, pitch: { text: "", copyKey: "" }, script: { text: "", copyKey: "" } };

  return (
    <div className="rounded-lg border border-line bg-panel/90 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-cyan" />
          <h3 className="font-semibold text-white">Diagnóstico IA</h3>
          {diagnosis && (
            <span className="rounded-full bg-electric/20 px-2 py-0.5 text-[10px] text-blue-300">
              {diagnosis.mode === "openai" ? "GPT" : "Template"}
            </span>
          )}
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-electric px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-electric/80 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {diagnosis ? "Regenerar" : "Gerar diagnóstico"}
        </button>
      </div>

      {error && <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-red-300">{error}</p>}

      {diagnosis && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-300">{diagnosis.summary}</p>

          {diagnosis.suggestedServices.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Serviços sugeridos</p>
              <div className="flex flex-wrap gap-2">
                {diagnosis.suggestedServices.map((s) => (
                  <span key={s} className="flex items-center gap-1 rounded-full border border-electric/30 bg-electric/10 px-2.5 py-1 text-xs text-blue-200">
                    <ChevronRight className="h-3 w-3" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex gap-1 border-b border-line">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs transition ${tab === t.id ? "border-b-2 border-cyan text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <t.icon className="h-3 w-3" />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative mt-3">
              <pre className="min-h-[80px] whitespace-pre-wrap rounded-md border border-line bg-ink px-4 py-3 text-xs leading-relaxed text-slate-300">
                {tabContent[tab].text}
              </pre>
              <button
                onClick={() => copy(tabContent[tab].text, tabContent[tab].copyKey)}
                className="absolute right-2 top-2 rounded-md border border-line bg-panel px-2 py-1 text-[10px] text-slate-400 transition hover:text-white"
              >
                {copied === tabContent[tab].copyKey
                  ? <Check className="h-3 w-3 text-success" />
                  : <ClipboardCopy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {!diagnosis && !loading && (
        <p className="mt-3 text-sm text-slate-500">
          Clique em "Gerar diagnóstico" para criar cópias comerciais prontas: WhatsApp, email, pitch e script de ligação.
        </p>
      )}
    </div>
  );
}
