"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Download, Expand, LayoutDashboard, Search, Shrink } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const MANUAL_STATE_KEY = "nodere_manual_state";

const moduleLinks = [
  { href: "/dashboard", match: /\bdashboard\b|\bin[ií]cio\b/i },
  { href: "/searches", match: /busca de empresas|busca avan[cç]ada|discovery/i },
  { href: "/companies", match: /\bempresas\b|ficha do cliente|ficha comercial/i },
  { href: "/crm", match: /\bcrm\b|funil/i },
  { href: "/intelligence", match: /intelig[eê]ncia|\bia\b/i },
  { href: "/inbox", match: /caixa de entrada|whatsapp|e-mail|email/i },
  { href: "/calendario", match: /calend[aá]rio|agenda|follow-up/i },
  { href: "/reports", match: /relat[oó]rios/i },
  { href: "/catalog", match: /cat[aá]logo|produtos|servi[cç]os/i },
  { href: "/settings", match: /configura[cç][oõ]es|tema/i },
  { href: "/integrations", match: /integra[cç][oõ]es|apollo|econodata|openai|google/i }
];

function getSectionHref(title: string) {
  const link = moduleLinks.find((item) => item.match.test(title));
  return link?.href;
}

export function ManualClient({ sections }: { sections: string[][] }) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const restoredRef = useRef(false);
  const router = useRouter();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(([title, body]) => `${title} ${body}`.toLowerCase().includes(q));
  }, [query, sections]);

  const toc = useMemo(() => sections.map(([title]) => ({ title, id: slugify(title) })), [sections]);
  const visibleToc = useMemo(() => filtered.map(([title]) => ({ title, id: slugify(title) })), [filtered]);
  const activeIndex = Math.max(0, visibleToc.findIndex((item) => item.id === activeId));
  const previousChapter = visibleToc[activeIndex - 1];
  const nextChapter = visibleToc[activeIndex + 1];

  useEffect(() => {
    if (restoredRef.current || typeof window === "undefined") return;
    restoredRef.current = true;
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(MANUAL_STATE_KEY) || "{}") as { query?: string; activeId?: string; scrollY?: number };
      if (saved.query) setQuery(saved.query);
      window.requestAnimationFrame(() => {
        if (saved.activeId && document.getElementById(saved.activeId)) {
          document.getElementById(saved.activeId)?.scrollIntoView({ block: "start" });
          setActiveId(saved.activeId);
          return;
        }
        if (typeof saved.scrollY === "number") window.scrollTo({ top: saved.scrollY });
      });
    } catch {
      // Estado local inválido não deve impedir a leitura do manual.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify({ query, activeId, scrollY: window.scrollY });
    window.sessionStorage.setItem(MANUAL_STATE_KEY, payload);
  }, [query, activeId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      const payload = JSON.stringify({ query, activeId, scrollY: window.scrollY });
      window.sessionStorage.setItem(MANUAL_STATE_KEY, payload);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [query, activeId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0.1, 0.35, 0.6] }
    );
    toc.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [toc]);

  useEffect(() => {
    if (!fullscreen || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard");
  }

  function jumpTo(id?: string) {
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  }

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 overflow-y-auto bg-ink p-4 md:p-8" : "space-y-6 p-4 md:p-8"}>
      <nav className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 font-semibold text-[var(--text-primary)] hover:border-electric/60 hover:bg-electric/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <Link href="/dashboard" className="inline-flex items-center gap-1 rounded-lg px-2 py-2 font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/manual" className="rounded-lg px-2 py-2 font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Ajuda</Link>
          <span aria-hidden="true">/</span>
          <span className="rounded-lg px-2 py-2 font-semibold text-[var(--text-primary)]">Manual NODERE</span>
        </div>
        <button
          type="button"
          onClick={() => setFullscreen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-electric/60 hover:bg-electric/10"
        >
          {fullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          {fullscreen ? "Fechar tela cheia" : "Abrir em tela cheia"}
        </button>
      </nav>

      <section className="rounded-xl border border-line bg-panel/90 p-6 print:border-0 print:bg-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Logo variant="full" height={48} />
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan print:text-blue-700" />
                <h2 className="text-2xl font-semibold text-white print:text-slate-950">Ajuda / Manual NODERE</h2>
              </div>
              <p className="mt-1 text-sm text-slate-400 print:text-slate-600">Manual completo de operação, CRM, busca, IA, Apollo, relatórios e integrações.</p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-3 text-sm font-semibold text-white print:hidden"
          >
            <Download className="h-4 w-4" />
            Baixar manual em PDF
          </button>
        </div>
        <label className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2 print:hidden">
          <Search className="h-4 w-4 text-cyan" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar no manual: Apollo, CRM, score, PDF, integrações..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
      </section>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr] print:block">
        <aside className="rounded-xl border border-line bg-panel/90 p-4 lg:sticky lg:top-4 lg:self-start print:hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Sumário</p>
            <button type="button" onClick={() => jumpTo(visibleToc[0]?.id)} className="text-xs font-semibold text-cyan hover:text-white">
              Voltar ao sumário
            </button>
          </div>
          <nav className="mt-3 max-h-[68vh] space-y-1 overflow-y-auto pr-1">
            {visibleToc.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => jumpTo(item.id)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-xs leading-5 transition ${
                  activeId === item.id ? "bg-electric/15 text-white ring-1 ring-electric/30" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {item.title}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-4">
          <section className="grid gap-4 xl:grid-cols-2 print:block">
            {filtered.map(([title, body]) => {
              const moduleHref = getSectionHref(title);
              return (
                <article id={slugify(title)} key={title} className="scroll-mt-28 rounded-lg border border-line bg-panel/90 p-5 print:mb-4 print:border-slate-200 print:bg-white">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success print:text-blue-700" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white print:text-slate-950">{title}</h3>
                        {moduleHref && (
                          <Link href={moduleHref} className="rounded-full border border-electric/35 bg-electric/10 px-2.5 py-1 text-xs font-semibold text-cyan hover:border-electric/70 hover:text-white print:hidden">
                            Abrir módulo
                          </Link>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-400 print:text-slate-700">{body}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {filtered.length > 0 && (
            <footer className="flex flex-col gap-3 rounded-xl border border-line bg-panel/90 p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
              <button
                type="button"
                onClick={() => jumpTo(previousChapter?.id)}
                disabled={!previousChapter}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-ink px-4 py-3 text-sm font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ArrowLeft className="h-4 w-4" />
                Capítulo anterior
              </button>
              <button type="button" onClick={() => jumpTo(visibleToc[0]?.id)} className="inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-cyan hover:bg-electric/10 hover:text-white">
                Voltar ao Sumário
              </button>
              <button
                type="button"
                onClick={() => jumpTo(nextChapter?.id)}
                disabled={!nextChapter}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-ink px-4 py-3 text-sm font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Próximo capítulo
                <ArrowRight className="h-4 w-4" />
              </button>
            </footer>
          )}

          {filtered.length === 0 && (
            <div className="rounded-lg border border-line bg-panel/90 p-5 text-sm text-slate-400">
              Nenhum tópico encontrado para esta busca.
              <button type="button" onClick={() => setQuery("")} className="ml-2 font-semibold text-cyan hover:text-white">
                Limpar pesquisa
              </button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
