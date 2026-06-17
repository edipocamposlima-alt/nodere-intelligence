"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { AlignLeft, Bold, Highlighter, Italic, Link, List, ListOrdered, Palette, Pilcrow, Quote, Underline } from "lucide-react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), { ssr: false });

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
  placeholder?: string;
};

export function RichTextEditor({ value, onChange, minHeight = 220, placeholder }: RichTextEditorProps) {
  function wrap(prefix: string, suffix = prefix, sample = "texto") {
    const current = value || "";
    onChange(current ? `${current}${current.endsWith("\n") ? "" : "\n"}${prefix}${sample}${suffix}` : `${prefix}${sample}${suffix}`);
  }

  function line(prefix: string, sample = "novo item") {
    const current = value || "";
    onChange(`${current}${current && !current.endsWith("\n") ? "\n" : ""}${prefix}${sample}`);
  }

  return (
    <div data-color-mode="light" className="nodere-rich-editor overflow-hidden rounded-xl border border-[var(--border-soft)] bg-white text-slate-950 shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-2 text-slate-700">
        <button type="button" onClick={() => wrap("**")} className="nodere-doc-tool" title="Negrito"><Bold className="h-4 w-4" /></button>
        <button type="button" onClick={() => wrap("_")} className="nodere-doc-tool" title="Itálico"><Italic className="h-4 w-4" /></button>
        <button type="button" onClick={() => wrap("<u>", "</u>")} className="nodere-doc-tool" title="Sublinhado"><Underline className="h-4 w-4" /></button>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <button type="button" onClick={() => line("## ", "Título")} className="nodere-doc-tool" title="Título"><Pilcrow className="h-4 w-4" /></button>
        <button type="button" onClick={() => line("- ")} className="nodere-doc-tool" title="Lista"><List className="h-4 w-4" /></button>
        <button type="button" onClick={() => line("1. ")} className="nodere-doc-tool" title="Lista numerada"><ListOrdered className="h-4 w-4" /></button>
        <button type="button" onClick={() => line("> ", "citação")} className="nodere-doc-tool" title="Citação"><Quote className="h-4 w-4" /></button>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <button type="button" onClick={() => wrap('<span style="color:#03624C">', "</span>", "texto verde NODERI")} className="nodere-doc-tool" title="Cor NODERI"><Palette className="h-4 w-4" /></button>
        <button type="button" onClick={() => wrap('<mark style="background:#DDFBEF;color:#06111F">', "</mark>", "destaque")} className="nodere-doc-tool" title="Destacar"><Highlighter className="h-4 w-4" /></button>
        <button type="button" onClick={() => wrap("[", "](https://)", "link")} className="nodere-doc-tool" title="Link"><Link className="h-4 w-4" /></button>
        <button type="button" onClick={() => line("---", "")} className="nodere-doc-tool" title="Linha divisória"><AlignLeft className="h-4 w-4" /></button>
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
