"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { AlignLeft, Bold, Highlighter, Italic, Link, List, ListOrdered, Minus, Palette, Pilcrow, Plus, Quote, Strikethrough, Underline } from "lucide-react";
import { useState } from "react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), { ssr: false });

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
  placeholder?: string;
};

export function RichTextEditor({ value, onChange, minHeight = 220, placeholder }: RichTextEditorProps) {
  const [font, setFont] = useState("Inter");
  const [size, setSize] = useState(14);

  function wrap(prefix: string, suffix = prefix, sample = "texto") {
    const current = value || "";
    onChange(current ? `${current}${current.endsWith("\n") ? "" : "\n"}${prefix}${sample}${suffix}` : `${prefix}${sample}${suffix}`);
  }

  function line(prefix: string, sample = "novo item") {
    const current = value || "";
    onChange(`${current}${current && !current.endsWith("\n") ? "\n" : ""}${prefix}${sample}`);
  }

  function applyFont(nextFont: string) {
    setFont(nextFont);
    wrap(`<span style="font-family:${nextFont},Arial,sans-serif">`, "</span>", "texto com fonte");
  }

  function applySize(nextSize: number) {
    setSize(nextSize);
    wrap(`<span style="font-size:${nextSize}px">`, "</span>", "texto em destaque");
  }

  function applyColor(color: string, label: string) {
    wrap(`<span style="color:${color}">`, "</span>", label);
  }

  return (
    <div data-color-mode="light" className="nodere-rich-editor overflow-hidden rounded-xl border border-[var(--border-soft)] bg-white text-slate-950 shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-2 text-slate-700">
        <select value={font} onChange={(event) => applyFont(event.target.value)} className="nodere-doc-select" title="Fonte">
          <option value="Inter">Inter</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times</option>
        </select>
        <button type="button" onClick={() => applySize(Math.max(10, size - 2))} className="nodere-doc-tool" title="Diminuir fonte"><Minus className="h-4 w-4" /></button>
        <span className="nodere-doc-size">{size}</span>
        <button type="button" onClick={() => applySize(Math.min(48, size + 2))} className="nodere-doc-tool" title="Aumentar fonte"><Plus className="h-4 w-4" /></button>
        <button type="button" onClick={() => wrap("**")} className="nodere-doc-tool" title="Negrito"><Bold className="h-4 w-4" /></button>
        <button type="button" onClick={() => wrap("_")} className="nodere-doc-tool" title="Itálico"><Italic className="h-4 w-4" /></button>
        <button type="button" onClick={() => wrap("<u>", "</u>")} className="nodere-doc-tool" title="Sublinhado"><Underline className="h-4 w-4" /></button>
        <button type="button" onClick={() => wrap("~~")} className="nodere-doc-tool" title="Riscado"><Strikethrough className="h-4 w-4" /></button>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <button type="button" onClick={() => line("## ", "Título")} className="nodere-doc-tool" title="Título"><Pilcrow className="h-4 w-4" /></button>
        <button type="button" onClick={() => line("- ")} className="nodere-doc-tool" title="Lista"><List className="h-4 w-4" /></button>
        <button type="button" onClick={() => line("1. ")} className="nodere-doc-tool" title="Lista numerada"><ListOrdered className="h-4 w-4" /></button>
        <button type="button" onClick={() => line("> ", "citação")} className="nodere-doc-tool" title="Citação"><Quote className="h-4 w-4" /></button>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <button type="button" onClick={() => applyColor("#03624C", "texto verde NODERE")} className="nodere-doc-tool nodere-doc-tool--color" title="Cor NODERE"><Palette className="h-4 w-4" /><span style={{ background: "#03624C" }} /></button>
        <button type="button" onClick={() => applyColor("#111827", "texto escuro")} className="nodere-doc-tool nodere-doc-swatch" title="Preto"><span style={{ background: "#111827" }} /></button>
        <button type="button" onClick={() => applyColor("#B91C1C", "texto vermelho")} className="nodere-doc-tool nodere-doc-swatch" title="Vermelho"><span style={{ background: "#B91C1C" }} /></button>
        <button type="button" onClick={() => applyColor("#1D4ED8", "texto azul")} className="nodere-doc-tool nodere-doc-swatch" title="Azul"><span style={{ background: "#1D4ED8" }} /></button>
        <button type="button" onClick={() => wrap('<mark style="background:var(--ai-bg);color:var(--ai-text)">', "</mark>", "destaque")} className="nodere-doc-tool" title="Destacar"><Highlighter className="h-4 w-4" /></button>
        <button type="button" onClick={() => wrap("[", "](https://)", "link")} className="nodere-doc-tool" title="Link"><Link className="h-4 w-4" /></button>
        <button type="button" onClick={() => line("---", "")} className="nodere-doc-tool" title="Linha divisória"><AlignLeft className="h-4 w-4" /></button>
        <span className="nodere-doc-label">Efeitos</span>
      </div>
      <MDEditor
        value={value}
        onChange={(next) => onChange(next || "")}
        height={minHeight}
        preview="edit"
        textareaProps={{ placeholder }}
      />
    </div>
  );
}

export function RichTextPreview({ value }: { value: string }) {
  if (!value?.trim()) return <span className="text-slate-500">Sem conteúdo.</span>;
  return (
    <div data-color-mode="light" className="nodere-rich-preview rounded-lg bg-white p-3 text-sm text-slate-950">
      <MarkdownPreview source={value} style={{ background: "transparent", color: "inherit" }} />
    </div>
  );
}
