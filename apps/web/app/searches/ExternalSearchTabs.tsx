"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, Building2, ExternalLink, Linkedin, Loader2, Search, Users } from "lucide-react";
import { ApiRequestError, searchApollo } from "@/lib/api";

type ApolloResult = Record<string, string | number | undefined>;

type LinkedinQuery = {
  companyName: string;
  personName: string;
  title: string;
  city: string;
  state: string;
  country: string;
};

export function ExternalSearchTabs() {
  const [tab, setTab] = useState<"apollo" | "linkedin">("apollo");
  const [apolloType, setApolloType] = useState<"companies" | "people">("companies");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Use Apollo.io para enriquecer empresas e decisores quando sua chave tiver permissao de API.");
  const [warning, setWarning] = useState<string | null>(null);
  const [results, setResults] = useState<ApolloResult[]>([]);
  const [linkedinQuery, setLinkedinQuery] = useState<LinkedinQuery>({ companyName: "", personName: "", title: "", city: "", state: "", country: "Brasil" });

  async function runApollo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setWarning(null);
    setResults([]);
    setMessage("Consultando Apollo.io pelo backend seguro...");
    const form = new FormData(event.currentTarget);
    try {
      const response = await searchApollo({
        type: apolloType,
        companyName: String(form.get("companyName") || "").trim(),
        domain: String(form.get("domain") || "").trim(),
        personName: String(form.get("personName") || "").trim(),
        title: String(form.get("title") || "").trim(),
        city: String(form.get("city") || "").trim(),
        state: String(form.get("state") || "").trim(),
        country: String(form.get("country") || "").trim(),
        perPage: 15
      });
      setResults(response.results);
      setMessage(`${response.count} resultado(s) retornado(s) pelo Apollo.io.`);
    } catch (error) {
      setWarning(error instanceof ApiRequestError ? error.message : error instanceof Error ? error.message : "Falha ao consultar Apollo.io.");
      setMessage("Apollo.io nao retornou resultados. Verifique chave, plano e permissoes no provedor.");
    } finally {
      setLoading(false);
    }
  }

  const linkedInUrls = useMemo(() => {
    const companyKeywords = [linkedinQuery.companyName, linkedinQuery.city, linkedinQuery.state, linkedinQuery.country].filter(Boolean).join(" ");
    const personKeywords = [linkedinQuery.personName, linkedinQuery.title, linkedinQuery.companyName, linkedinQuery.city, linkedinQuery.state, linkedinQuery.country].filter(Boolean).join(" ");
    const jobLocation = [linkedinQuery.city, linkedinQuery.state, linkedinQuery.country].filter(Boolean).join(", ");
    return {
      company: companyKeywords ? `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyKeywords)}` : "",
      people: personKeywords ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(personKeywords)}` : "",
      jobs: linkedinQuery.title ? `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(linkedinQuery.title)}&location=${encodeURIComponent(jobLocation)}` : ""
    };
  }, [linkedinQuery]);

  return (
    <section className="rounded-lg border border-line bg-panel/90 p-4 shadow-glow">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Users className="h-4 w-4 text-fuchsia-300" />
            Busca externa de decisores
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
            Apollo.io consulta dados via backend seguro. LinkedIn abre a busca oficial com nome da empresa/pessoa, sem usar domínio incorreto nem scraping.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-line bg-ink p-1 text-xs font-semibold">
          <button type="button" onClick={() => setTab("apollo")} className={`rounded-md px-3 py-2 ${tab === "apollo" ? "bg-emerald-500 text-ink" : "text-slate-300 hover:text-white"}`}>Apollo.io</button>
          <button type="button" onClick={() => setTab("linkedin")} className={`rounded-md px-3 py-2 ${tab === "linkedin" ? "bg-sky-400 text-ink" : "text-slate-300 hover:text-white"}`}>LinkedIn</button>
        </div>
      </div>

      {tab === "apollo" ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setApolloType("companies")} className={`btn-secondary-action ${apolloType === "companies" ? "border-emerald-300 bg-emerald-400/20 text-emerald-100" : ""}`}>
              <Building2 className="h-4 w-4" /> Empresas
            </button>
            <button type="button" onClick={() => setApolloType("people")} className={`btn-secondary-action ${apolloType === "people" ? "border-fuchsia-300 bg-fuchsia-400/20 text-fuchsia-100" : ""}`}>
              <Users className="h-4 w-4" /> Pessoas / decisores
            </button>
          </div>
          <form onSubmit={runApollo} className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <input name="companyName" placeholder="Empresa" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-emerald-300" />
            <input name="domain" placeholder="Dominio/site" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-emerald-300" />
            <input name="personName" placeholder="Nome do decisor" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-emerald-300" />
            <input name="title" placeholder="Cargo: CEO, marketing..." className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-emerald-300" />
            <input name="city" placeholder="Cidade" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-emerald-300" />
            <div className="grid grid-cols-1 gap-2 md:col-span-3 md:grid-cols-[1fr_1fr_auto] xl:col-span-6">
              <input name="state" placeholder="Estado" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-emerald-300" />
              <input name="country" placeholder="Pais" defaultValue="Brasil" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-emerald-300" />
              <button disabled={loading} className="btn-action bg-gradient-to-r from-emerald-400 to-cyan text-ink disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar Apollo
              </button>
            </div>
          </form>
          <Status message={message} warning={warning} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {results.map((item, index) => <ApolloCard key={`${item.id || index}`} item={item} />)}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <input value={linkedinQuery.companyName} onChange={(event) => setLinkedinQuery((old) => ({ ...old, companyName: event.target.value }))} placeholder="Empresa" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-sky-300" />
            <input value={linkedinQuery.personName} onChange={(event) => setLinkedinQuery((old) => ({ ...old, personName: event.target.value }))} placeholder="Pessoa" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-sky-300" />
            <input value={linkedinQuery.title} onChange={(event) => setLinkedinQuery((old) => ({ ...old, title: event.target.value }))} placeholder="Cargo" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-sky-300" />
            <input value={linkedinQuery.city} onChange={(event) => setLinkedinQuery((old) => ({ ...old, city: event.target.value }))} placeholder="Cidade" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-sky-300" />
            <input value={linkedinQuery.state} onChange={(event) => setLinkedinQuery((old) => ({ ...old, state: event.target.value }))} placeholder="Estado" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-sky-300" />
            <input value={linkedinQuery.country} onChange={(event) => setLinkedinQuery((old) => ({ ...old, country: event.target.value }))} placeholder="Pais" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-sky-300" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <LinkedInButton href={linkedInUrls.company} label="Buscar empresa no LinkedIn" />
            <LinkedInButton href={linkedInUrls.people} label="Buscar decisores no LinkedIn" />
            <LinkedInButton href={linkedInUrls.jobs} label="Buscar cargos/vagas no LinkedIn" />
          </div>
          <p className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs leading-5 text-sky-100">
            Para conectar LinkedIn automaticamente e necessario produto/API oficial liberado pelo LinkedIn. Ate la, o NODERE abre buscas oficiais por nome e contexto, evitando links genericos como linkedin.com/company.
          </p>
        </div>
      )}
    </section>
  );
}

function Status({ message, warning }: { message: string; warning: string | null }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">{message}</p>
      {warning ? (
        <p className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-5 text-amber-100">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          {warning}
        </p>
      ) : null}
    </div>
  );
}

function ApolloCard({ item }: { item: ApolloResult }) {
  const title = String(item.name || item.companyName || "Resultado Apollo");
  const linkedin = String(item.linkedin || "");
  return (
    <article className="rounded-lg border border-line bg-ink/80 p-4">
      <p className="truncate text-sm font-semibold text-white">{title}</p>
      <div className="mt-2 space-y-1 text-xs text-slate-400">
        {Object.entries(item).filter(([key, value]) => !["id", "type", "source", "linkedin"].includes(key) && value).slice(0, 6).map(([key, value]) => (
          <p key={key} className="truncate"><span className="text-slate-500">{labelFor(key)}:</span> {String(value)}</p>
        ))}
      </div>
      {linkedin ? (
        <a href={linkedin} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-sky-400/40 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-400/20">
          <Linkedin className="h-3.5 w-3.5" /> Abrir LinkedIn <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}
    </article>
  );
}

function LinkedInButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href || undefined}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${href ? "bg-sky-400 text-ink hover:bg-sky-300" : "cursor-not-allowed border border-line bg-white/5 text-slate-500"}`}
    >
      <Linkedin className="h-4 w-4" />
      {label}
      {href ? <ExternalLink className="h-3.5 w-3.5" /> : null}
    </a>
  );
}

function labelFor(key: string) {
  const labels: Record<string, string> = {
    companyName: "Empresa",
    title: "Cargo",
    email: "E-mail",
    city: "Cidade",
    state: "Estado",
    domain: "Dominio",
    employeeCount: "Funcionarios",
    revenueRange: "Receita"
  };
  return labels[key] || key;
}
