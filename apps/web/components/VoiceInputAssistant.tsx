"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, ShieldCheck, X } from "lucide-react";

type EditableTarget = HTMLInputElement | HTMLTextAreaElement | HTMLElement;
type RecognitionResultEvent = { results?: ArrayLike<{ 0?: { transcript?: string } }> };
type RecognitionErrorEvent = { error?: string };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

const SENSITIVE_PATTERN = /senha|password|token|secret|segredo|api.?key|chave.?api|cart[aã]o|card|cvv|conta.?banc|ag[eê]ncia|pix/i;

export function VoiceInputAssistant() {
  const targetRef = useRef<EditableTarget | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [notice, setNotice] = useState("");

  const positionButton = useCallback(() => {
    const target = targetRef.current;
    if (!target || !document.contains(target) || !isEligible(target)) return setPosition(null);
    const box = target.getBoundingClientRect();
    if (box.width < 40 || box.height < 24 || box.bottom < 0 || box.top > window.innerHeight) return setPosition(null);
    setPosition({ top: Math.max(8, box.top + 6), left: Math.max(8, Math.min(window.innerWidth - 44, box.right - 42)) });
  }, []);

  useEffect(() => {
    function selectTarget(event: FocusEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !isEligible(target)) return;
      targetRef.current = target;
      positionButton();
    }
    document.addEventListener("focusin", selectTarget);
    window.addEventListener("resize", positionButton);
    window.addEventListener("scroll", positionButton, true);
    return () => {
      document.removeEventListener("focusin", selectTarget);
      window.removeEventListener("resize", positionButton);
      window.removeEventListener("scroll", positionButton, true);
      recognitionRef.current?.abort();
    };
  }, [positionButton]);

  function startListening() {
    const RecognitionClass = getRecognitionClass();
    if (!RecognitionClass) {
      setNotice("O reconhecimento de voz não está disponível neste navegador. Use Chrome ou Edge atualizado.");
      return;
    }
    setNotice("");
    setTranscript("");
    const recognition = new RecognitionClass();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const text = String(event.results?.[0]?.[0]?.transcript || "").trim();
      setTranscript(text);
      setReviewing(true);
    };
    recognition.onerror = (event) => {
      setNotice(voiceErrorMessage(event.error));
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function cancelListening() {
    recognitionRef.current?.abort();
    setListening(false);
  }

  function apply(mode: "replace" | "append") {
    const target = targetRef.current;
    const text = transcript.trim();
    if (!target || !text) return;
    applyText(target, text, mode);
    setReviewing(false);
    setTranscript("");
    setNotice("Transcrição aplicada somente após sua confirmação.");
    target.focus();
    positionButton();
  }

  return (
    <>
      {position && !reviewing && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={listening ? cancelListening : startListening}
          className={`fixed z-[115] grid h-9 w-9 place-items-center rounded-lg border shadow-lg backdrop-blur ${listening ? "border-red-400 bg-red-500 text-white" : "border-[var(--brand-primary)] bg-[var(--bg-card)] text-[var(--brand-primary)]"}`}
          style={position}
          aria-label={listening ? "Parar ditado" : "Preencher campo por voz em português"}
          title={listening ? "Parar ditado" : "Ditado PT-BR com revisão antes de aplicar"}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      )}

      {notice && !reviewing && (
        <div role="status" className="fixed bottom-20 right-4 z-[116] flex max-w-sm items-start gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-modal)] p-3 text-sm text-[var(--text-primary)] shadow-2xl lg:bottom-5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Fechar aviso"><X className="h-4 w-4" /></button>
        </div>
      )}

      {reviewing && (
        <div className="fixed inset-0 z-[130] grid place-items-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-labelledby="voice-review-title">
          <section className="w-full max-w-xl rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-modal)] p-5 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-primary)]">Ditado PT-BR</p>
            <h2 id="voice-review-title" className="mt-2 font-heading text-lg font-black text-[var(--text-primary)]">Revise antes de aplicar</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Edite a transcrição se necessário. Nada será salvo sem sua confirmação.</p>
            <textarea autoFocus value={transcript} onChange={(event) => setTranscript(event.target.value)} rows={6} className="mt-4 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]" />
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => apply("replace")} disabled={!transcript.trim()} className="briefing-action briefing-action--primary">Substituir campo</button>
              <button type="button" onClick={() => apply("append")} disabled={!transcript.trim()} className="briefing-action">Adicionar ao final</button>
              <button type="button" onClick={() => { setReviewing(false); setTranscript(""); }} className="briefing-action">Cancelar</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function isEligible(target: HTMLElement): target is EditableTarget {
  if (target.dataset.voiceDisabled === "true" || target.getAttribute("aria-readonly") === "true") return false;
  const descriptor = [target.id, target.getAttribute("name"), target.getAttribute("aria-label"), target.getAttribute("autocomplete"), target.getAttribute("placeholder")].filter(Boolean).join(" ");
  if (SENSITIVE_PATTERN.test(descriptor)) return false;
  if (target instanceof HTMLTextAreaElement) return !target.disabled && !target.readOnly;
  if (target instanceof HTMLInputElement) {
    const type = String(target.type || "text").toLowerCase();
    return ["text", "search", "email", "tel", "url"].includes(type) && !target.disabled && !target.readOnly;
  }
  return target.isContentEditable && !target.closest("[data-voice-disabled='true']");
}

function getRecognitionClass(): (new () => Recognition) | null {
  const speechWindow = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

function applyText(target: EditableTarget, text: string, mode: "replace" | "append") {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const current = target.value;
    const value = mode === "append" && current.trim() ? `${current}${current.endsWith(" ") ? "" : " "}${text}` : text;
    const prototype = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(target, value);
    target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  target.focus();
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(target);
  if (mode === "append") range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("insertText", false, mode === "append" && target.textContent?.trim() ? ` ${text}` : text);
  target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
}

function voiceErrorMessage(error?: string) {
  if (error === "not-allowed" || error === "service-not-allowed") return "Permissão de microfone negada. Autorize o acesso no navegador e tente novamente.";
  if (error === "no-speech") return "Nenhuma fala foi reconhecida. Tente novamente em um ambiente mais silencioso.";
  if (error === "audio-capture") return "Nenhum microfone disponível foi encontrado.";
  return "Não foi possível concluir o ditado. Tente novamente.";
}
