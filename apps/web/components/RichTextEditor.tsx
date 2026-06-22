"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { BackgroundColor, FontFamily, FontSize, LineHeight, TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Unlink
} from "lucide-react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
  placeholder?: string;
  allowImages?: boolean;
};

const baseExtensions = [
  StarterKit.configure({ link: false, underline: false }),
  TextStyle,
  FontFamily,
  FontSize,
  LineHeight.configure({ types: ["paragraph", "heading", "listItem"] }),
  Color,
  BackgroundColor,
  Underline,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Image.configure({ allowBase64: true, inline: false })
];
const editorExtensions = [...baseExtensions, Link.configure({ autolink: true, defaultProtocol: "https", protocols: ["http", "https", "mailto", "tel"], openOnClick: false })];
const previewExtensions = [...baseExtensions, Link.configure({ autolink: true, defaultProtocol: "https", protocols: ["http", "https", "mailto", "tel"], openOnClick: true })];

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function normalizeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/<\/?(?:p|h[1-6]|ul|ol|li|blockquote|strong|em|u|s|span|a|img|br)\b/i.test(trimmed)) return value;
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function ToolButton({ active = false, disabled = false, label, onClick, children }: { active?: boolean; disabled?: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={`nodere-editor-tool ${active ? "nodere-editor-tool--active" : ""}`}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, minHeight = 220, placeholder, allowImages = true }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const editor = useEditor({
    extensions: [...editorExtensions, Placeholder.configure({ placeholder: placeholder || "Digite seu conteúdo..." })],
    content: normalizeInput(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "nodere-editor-content",
        style: `min-height:${minHeight}px`,
        "aria-label": placeholder || "Editor de texto formatado",
        "data-placeholder": placeholder || "Digite seu conteúdo..."
      }
    },
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? "" : current.getHTML())
  });

  useEffect(() => {
    if (!editor) return;
    const normalized = normalizeInput(value);
    if (editor.getHTML() !== normalized && !(editor.isEmpty && !normalized)) editor.commands.setContent(normalized, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return <div className="nodere-editor-loading" style={{ minHeight }} aria-label="Carregando editor" />;

  function editLink() {
    const previous = editor?.getAttributes("link").href as string | undefined;
    const href = window.prompt("Endereço do link", previous || "https://");
    if (href === null) return;
    if (!href.trim()) return void editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    editor?.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  function addImage(file?: File) {
    if (!file || !editor) return;
    if (!file.type.startsWith("image/") || file.size > 1_500_000) {
      setNotice("Use uma imagem de até 1,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
    };
    reader.readAsDataURL(file);
    setNotice("");
  }

  const fontSize = String(editor.getAttributes("textStyle").fontSize || "14px");
  const fontFamily = String(editor.getAttributes("textStyle").fontFamily || "Inter");

  return (
    <div className="nodere-rich-editor">
      <div className="nodere-editor-toolbar" role="toolbar" aria-label="Formatação do texto">
        <select aria-label="Fonte" title="Fonte" value={fontFamily} onChange={(event) => editor.chain().focus().setFontFamily(event.target.value).run()}>
          <option value="Inter">Inter</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Helvetica">Helvetica</option><option value="Times New Roman">Times</option>
        </select>
        <select aria-label="Tamanho da fonte" title="Tamanho da fonte" value={fontSize} onChange={(event) => editor.chain().focus().setFontSize(event.target.value).run()}>
          {[10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48].map((size) => <option key={size} value={`${size}px`}>{size}</option>)}
        </select>
        <ToolButton label="Negrito" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></ToolButton>
        <ToolButton label="Itálico" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></ToolButton>
        <ToolButton label="Sublinhado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon /></ToolButton>
        <ToolButton label="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough /></ToolButton>
        <ToolButton label="Alinhar à esquerda" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft /></ToolButton>
        <ToolButton label="Centralizar" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter /></ToolButton>
        <ToolButton label="Alinhar à direita" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight /></ToolButton>
        <ToolButton label="Justificar" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify /></ToolButton>
        <ToolButton label="Lista com marcadores" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></ToolButton>
        <ToolButton label="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered /></ToolButton>
        <label className="nodere-editor-color" title="Cor do texto"><span>A</span><input type="color" aria-label="Cor do texto" value={editor.getAttributes("textStyle").color || "#03624c"} onChange={(event) => editor.chain().focus().setColor(event.target.value).run()} /></label>
        <label className="nodere-editor-color" title="Cor de fundo"><Highlighter /><input type="color" aria-label="Cor de fundo" value={editor.getAttributes("textStyle").backgroundColor || "#d1fae5"} onChange={(event) => editor.chain().focus().setBackgroundColor(event.target.value).run()} /></label>
        <select aria-label="Espaçamento entre linhas" title="Espaçamento entre linhas" defaultValue="1.5" onChange={(event) => editor.chain().focus().setLineHeight(event.target.value).run()}>
          <option value="1">1,0</option><option value="1.25">1,25</option><option value="1.5">1,5</option><option value="1.75">1,75</option><option value="2">2,0</option>
        </select>
        <ToolButton label="Inserir ou editar link" active={editor.isActive("link")} onClick={editLink}><Link2 /></ToolButton>
        <ToolButton label="Remover link" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}><Unlink /></ToolButton>
        {allowImages && <ToolButton label="Anexar imagem" onClick={() => fileInputRef.current?.click()}><ImagePlus /></ToolButton>}
        <ToolButton label="Limpar formatação" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><RemoveFormatting /></ToolButton>
        <ToolButton label="Desfazer" disabled={!editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()}><Undo2 /></ToolButton>
        <ToolButton label="Refazer" disabled={!editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()}><Redo2 /></ToolButton>
        <input ref={fileInputRef} className="sr-only" type="file" accept="image/*" onChange={(event) => addImage(event.target.files?.[0])} />
      </div>
      <EditorContent editor={editor} />
      {notice && <p className="nodere-editor-notice" role="alert">{notice}</p>}
    </div>
  );
}

export function RichTextPreview({ value }: { value: string }) {
  const editor = useEditor({
    extensions: previewExtensions,
    content: normalizeInput(value),
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: "nodere-editor-preview" } }
  });

  useEffect(() => {
    if (!editor) return;
    const normalized = normalizeInput(value);
    if (editor.getHTML() !== normalized) editor.commands.setContent(normalized, { emitUpdate: false });
  }, [editor, value]);

  if (!value?.trim()) return <span className="text-text-muted">Sem conteúdo.</span>;
  return <EditorContent editor={editor} />;
}
