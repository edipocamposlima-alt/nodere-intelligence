"use client";

import { FormEvent, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, LocateFixed, MapPin, Search, Sparkles } from "lucide-react";
import { geocodeAddress, getSavedCompanyIds, searchCompanies, searchCompanyByCnpj } from "@/lib/api";
import { Company } from "@/lib/types";
import { CompanyTable } from "./CompanyTable";
import { COUNTRIES, SEGMENTS } from "@/constants/segments";

export function SearchPanel() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Company[]>([]);
  const [message, setMessage] = useState("Use cidade, estado e segmento para encontrar oportunidades.");
  const [warning, setWarning] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ lat?: number; lng?: number; label?: string }>({});
  const [mapQuery, setMapQuery] = useState("Empresas no Brasil");
  const [focusedMapCompany, setFocusedMapCompany] = useState<Company | null>(null);
  const activeSearchId = useRef(0);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchId = Date.now();
    activeSearchId.current = searchId;
    setLoading(true);
    setWarning(null);
    setResults([]);
    setMessage("Limpando resultados anteriores e consultando novas empresas...");
    const form = new FormData(event.currentTarget);
    const mode = String(form.get("mode") || "places") as "places" | "cnpj" | "global";
    const country = String(form.get("country") || "BR");
    const payload = {
      mode,
      companyName: String(form.get("companyName") ?? "").trim(),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      country,
      segment: String(form.get("segment") ?? ""),
      keyword: String(form.get("keyword") ?? ""),
      limit: 60,
      lat: geo.lat,
      lng: geo.lng,
      radiusKm: Number(form.get("radiusKm") || 0) || undefined
    };
    const readableQuery = [payload.companyName, payload.segment, payload.keyword, payload.city, payload.state, payload.country]
      .filter(Boolean)
      .join(" ");
    if (readableQuery) setMapQuery(readableQuery);
    setFocusedMapCompany(null);

    try {
      if (mode === "cnpj") {
        const cnpj = String(form.get("cnpj") || "").replace(/\D/g, "");
        if (!cnpj) {
          setWarning("Informe o CNPJ para consultar a ReceitaWS.");
          setMessage("Busca por CNPJ nao executada.");
          return;
        }
        if (cnpj.length !== 14) {
          setWarning("CNPJ inválido. Informe 14 dígitos antes de consultar.");
          setMessage("Busca por CNPJ não executada.");
          return;
        }
        const response = await searchCompanyByCnpj(cnpj);
        if (activeSearchId.current !== searchId) return;
        setResults([response.company]);
        setMessage("CNPJ localizado em fonte pública. Revise os dados e salve no CRM.");
        return;
      }

      if (![payload.companyName, payload.city, payload.state, payload.segment, payload.keyword].some(Boolean)) {
        setResults([]);
        setWarning("Informe pelo menos nome da empresa, segmento, cidade, estado ou palavra-chave.");
        setMessage("Busca nao executada.");
        return;
      }

      const [response, savedIds] = await Promise.all([searchCompanies(payload), getSavedCompanyIds()]);
      if (activeSearchId.current !== searchId) return;
      const localSavedIds = JSON.parse(localStorage.getItem("nodere_saved_leads") || "[]") as string[];
      const savedSet = new Set([...savedIds, ...localSavedIds]);
      const filtered = response.companies.filter((company) => !savedSet.has(company.id));
      setResults(filtered);
      setFocusedMapCompany(filtered[0] ?? null);
      setWarning(response.search.warning ?? response.search.error?.message ?? null);
      setMessage(`${filtered.length} resultado(s) visíveis. ${response.companies.length - filtered.length} já salvo(s) foram ocultado(s). A busca ampla consulta lotes do Google e deduplica por Place ID.`);
    } catch (error) {
      if (activeSearchId.current !== searchId) return;
      setResults([]);
      setWarning(error instanceof Error ? error.message : "Falha ao buscar empresas.");
      setMessage("Nao foi possivel concluir a busca.");
    } finally {
      if (activeSearchId.current === searchId) setLoading(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setWarning("Geolocalização não está disponível neste navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({ lat: position.coords.latitude, lng: position.coords.longitude, label: "Localização atual" });
        setMessage("Localização aplicada. Escolha um raio e busque novamente.");
      },
      () => setWarning("Não foi possível obter sua localização.")
    );
  }

  async function geocodeReference(form: HTMLFormElement) {
    const address = String(new FormData(form).get("referenceAddress") || "").trim();
    if (!address) return;
    const result = await geocodeAddress(address);
    const first = result.results[0];
    if (first?.lat && first?.lng) {
      setGeo({ lat: first.lat, lng: first.lng, label: first.address || address });
      setMessage(`Referência aplicada: ${first.address || address}`);
    } else {
      setWarning("Endereço de referência não localizado.");
    }
  }

  return (
    <section className="space-y-5">
      <form onSubmit={onSubmit} className="rounded-lg border border-line bg-panel/90 p-4 shadow-glow">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Sparkles className="h-4 w-4 text-cyan" />
          Busca inteligente
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <select name="mode" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" defaultValue="places">
            <option value="places">Google Places local</option>
            <option value="cnpj">CNPJ direto</option>
            <option value="global">Global / Internacional</option>
          </select>
          <input name="cnpj" placeholder="CNPJ (modo CNPJ)" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <input name="companyName" placeholder="Nome da empresa" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <select name="segment" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" defaultValue="">
            <option value="">Segmento</option>
            {SEGMENTS.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
          </select>
          <input name="city" placeholder="Cidade" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <input name="state" placeholder="Estado" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <select name="country" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" defaultValue="BR">
            {COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
          </select>
          <input name="keyword" placeholder="Palavra-chave" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
            <Search className="h-4 w-4" />
            {loading ? "Buscando" : "Buscar"}
          </button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px_auto_auto]">
          <input name="referenceAddress" placeholder="Endereço de referência para busca por raio" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <select name="radiusKm" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" defaultValue="">
            <option value="">Cidade inteira</option>
            {[1, 5, 10, 25, 50].map((km) => <option key={km} value={km}>{km} km</option>)}
          </select>
          <button type="button" onClick={(event) => geocodeReference(event.currentTarget.form!)} className="rounded-lg border border-line bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white">
            Usar endereço
          </button>
          <button type="button" onClick={useMyLocation} className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-2 text-sm font-semibold text-cyan hover:bg-cyan/20">
            <LocateFixed className="h-4 w-4" />
            Minha localização
          </button>
        </div>
        {geo.label && <p className="mt-2 text-xs text-cyan">Referência ativa: {geo.label}</p>}
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan" />
            {message}
          </p>
          {warning && (
            <p className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-5 text-amber-100">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              {warning}
            </p>
          )}
        </div>
      </form>
      <EmbeddedGoogleMap
        query={focusedMapCompany ? [focusedMapCompany.name, focusedMapCompany.address, focusedMapCompany.city, focusedMapCompany.state].filter(Boolean).join(" ") : mapQuery}
        results={results}
        focusedId={focusedMapCompany?.id}
        onFocus={setFocusedMapCompany}
      />
      {results.length > 0 && <CompanyTable companies={results} />}
    </section>
  );
}

function EmbeddedGoogleMap({
  query,
  results,
  focusedId,
  onFocus
}: {
  query: string;
  results: Company[];
  focusedId?: string;
  onFocus: (company: Company) => void;
}) {
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query || "Empresas no Brasil")}&output=embed`;
  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="overflow-hidden rounded-lg border border-line bg-panel/90">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <MapPin className="h-4 w-4 text-rose-400" />
            Google Maps visual
          </div>
          <span className="truncate text-xs text-slate-400">{query}</span>
        </div>
        <iframe
          title="Mapa visual de empresas"
          src={mapUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-[360px] w-full border-0"
        />
      </div>
      <div className="rounded-lg border border-line bg-panel/90 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white">Empresas no mapa</p>
          <span className="rounded-full bg-cyan/10 px-2 py-1 text-xs font-bold text-cyan">{results.length}</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Clique em uma empresa para centralizar o mapa. O salvamento continua na tabela abaixo para manter deduplicação e histórico no CRM.
        </p>
        <div className="mt-3 max-h-[276px] space-y-2 overflow-y-auto pr-1">
          {results.length === 0 && (
            <p className="rounded-lg border border-dashed border-line p-3 text-xs text-slate-500">
              Execute uma busca para carregar empresas reais e visualizar a região no mapa.
            </p>
          )}
          {results.slice(0, 40).map((company) => (
            <button
              type="button"
              key={company.id}
              onClick={() => onFocus(company)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition hover:border-cyan ${focusedId === company.id ? "border-cyan bg-cyan/10" : "border-line bg-ink"}`}
            >
              <span className="block truncate text-sm font-semibold text-white">{company.name}</span>
              <span className="mt-1 block truncate text-xs text-slate-400">{company.address || `${company.city}/${company.state}`} · Score {company.score}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
