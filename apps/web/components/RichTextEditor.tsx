"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), { ssr: false });

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
  placeholder?: string;
};

export function RichTextEditor({ value, onChange, minHeight = 220, placeholder }: RichTextEditorProps) {
  return (
    <div data-color-mode="dark" className="nodere-rich-editor rounded-xl border border-line bg-ink/70 text-white">
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
    <div data-color-mode="dark" className="nodere-rich-preview text-sm text-slate-200">
      <MarkdownPreview source={value} style={{ background: "transparent", color: "inherit" }} />
    </div>
  );
}
