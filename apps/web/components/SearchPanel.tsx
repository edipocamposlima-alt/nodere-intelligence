"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Building2, CheckCircle2, ChevronDown, ChevronUp, Filter, Globe2, LocateFixed, MapPin, Navigation, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { ApiRequestError, geocodeAddress, getSavedCompanyIds, getWorkspaceSegments, saveWorkspaceSegment, searchCompanies, searchCompanyByCnpj } from "@/lib/api";
import { Company } from "@/lib/types";
import { CompanyTable } from "./CompanyTable";
import { COUNTRIES, SEGMENTS } from "@/constants/segments";
import { useCredits } from "@/context/CreditsProvider";

type SearchMode = "places" | "cnpj" | "global";
const ADD_SEGMENT = "__add_segment__";
const fieldClass = "h-11 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-hover)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[rgba(0,223,130,0.12)]";
const labelClass = "grid gap-1.5 text-sm";
const labelTextClass = "text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]";

function normalizeId(value: unknown) {
  return String(value ?? "").trim();
}

function companySavedKeys(company: Company) {
  const raw = company as unknown as Record<string, unknown>;
  return [company.id, raw.placeId, raw.googlePlaceId, raw.google_place_id].map(normalizeId).filter(Boolean);
}

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function SearchPanel() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Company[]>([]);
  const [message, setMessage] = useState("Use cidade, estado e segmento para encontrar oportunidades.");
  const [warning, setWarning] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ lat?: number; lng?: number; label?: string }>({});
  const [mapQuery, setMapQuery] = useState("Empresas no Brasil");
  const [focusedMapCompany, setFocusedMapCompany] = useState<Company | null>(null);
  const [segments, setSegments] = useState<string[]>(SEGMENTS);
  const [selectedSegment, setSelectedSegment] = useState("");
  const [customSegment, setCustomSegment] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [mapOpen, setMapOpen] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const activeSearchId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const { credits, trialExpired } = useCredits();

  const allSegments = useMemo(() => Array.from(new Set([...SEGMENTS, ...segments])).sort((a, b) => a.localeCompare(b)), [segments]);

  useEffect(() => {
    let cancelled = false;
    async function loadSegments() {
      try {
        const payload = await getWorkspaceSegments();
        if (!cancelled && Array.isArray(payload.segments)) setSegments(payload.segments);
      } catch {
        try {
          const stored = JSON.parse(localStorage.getItem("nodere_custom_segments") || "[]");
          if (!cancelled && Array.isArray(stored)) setSegments([...SEGMENTS, ...stored.filter((item) => typeof item === "string" && item.trim())]);
        } catch {
          if (!cancelled) setSegments(SEGMENTS);
        }
      }
    }
    void loadSegments();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persistCustomSegment(segment: string) {
    const clean = segment.trim();
    if (!clean || allSegments.some((item) => item.toLowerCase() === clean.toLowerCase())) return;
    setSegments((current) => Array.from(new Set([...current, clean])).sort((a, b) => a.localeCompare(b)));
    try {
      const stored = JSON.parse(localStorage.getItem("nodere_custom_segments") || "[]");
      const next = Array.from(new Set([...(Array.isArray(stored) ? stored : []), clean])).slice(-120);
      localStorage.setItem("nodere_custom_segments", JSON.stringify(next));
    } catch {
      localStorage.setItem("nodere_custom_segments", JSON.stringify([clean]));
    }
    try {
      const payload = await saveWorkspaceSegment(clean);
      if (Array.isArray(payload.segments)) setSegments(payload.segments);
    } catch (error) {
      setWarning(error instanceof Error ? `Segmento salvo localmente. Backend: ${error.message}` : "Segmento salvo localmente; backend indisponível.");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (credits && (credits.blocked || credits.remaining <= 0 || trialExpired)) {
      setUpgradeOpen(true);
      setWarning("Seu trial expirou ou os créditos acabaram. O CRM continua liberado, mas novas buscas exigem upgrade.");
      setMessage("Busca bloqueada por créditos.");
      return;
    }
    const searchId = Date.now();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort("timeout"), 15000);
    activeSearchId.current = searchId;
    setLoading(true);
    setWarning(null);
    setResults([]);
    setFocusedMapCompany(null);
    setMessage("Limpando resultados anteriores e consultando novas empresas...");

    const form = new FormData(event.currentTarget);
    const mode = String(form.get("mode") || "places") as SearchMode;
    const country = String(form.get("country") || "BR");
    const segment = selectedSegment === ADD_SEGMENT ? customSegment.trim() : selectedSegment.trim();

    if (selectedSegment === ADD_SEGMENT && segment) await persistCustomSegment(segment);

    const payload = {
      mode,
      companyName: String(form.get("companyName") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      state: String(form.get("state") ?? "").trim(),
      country,
      segment,
      keyword: String(form.get("keyword") ?? "").trim(),
      limit: 60,
      lat: geo.lat,
      lng: geo.lng,
      radiusKm: Number(form.get("radiusKm") || 0) || undefined,
      minRating: Number(form.get("minRating") || "") || undefined,
      maxRating: Number(form.get("maxRating") || "") || undefined,
      minReviews: Number(form.get("minReviews") || "") || undefined,
      hasWebsite: parseTriState(form.get("hasWebsite")),
      hasWhatsApp: parseTriState(form.get("hasWhatsApp")),
      sortBy: String(form.get("sortBy") || "nodere_score") as "relevance" | "rating" | "review_count" | "nodere_score",
      sortDir: String(form.get("sortDir") || "desc") as "asc" | "desc"
    };

    const readableQuery = [payload.companyName, payload.segment, payload.keyword, payload.city, payload.state, payload.country].filter(Boolean).join(" ");
    if (readableQuery) setMapQuery(readableQuery);

    try {
      if (mode === "cnpj") {
        const cleanCnpj = cnpj.replace(/\D/g, "");
        if (!cleanCnpj) {
          setWarning("Informe o CNPJ para consultar a ReceitaWS.");
          setMessage("Busca por CNPJ não executada.");
          return;
        }
        if (cleanCnpj.length !== 14) {
          setWarning("CNPJ inválido. Informe 14 dígitos antes de consultar.");
          setMessage("Busca por CNPJ não executada.");
          return;
        }
        const response = await searchCompanyByCnpj(cleanCnpj);
        if (activeSearchId.current !== searchId) return;
        if (response.existing) {
          setResults([]);
          setFocusedMapCompany(null);
          setWarning(response.message || "Lead já consta no banco de dados NODERE.");
          setMessage("Busca por CNPJ concluída sem novo resultado salvável.");
          return;
        }
        setResults([response.company]);
        setFocusedMapCompany(response.company);
        setMessage("CNPJ localizado em fonte pública. Revise os dados e salve no CRM.");
        return;
      }

      if (![payload.companyName, payload.city, payload.state, payload.segment, payload.keyword].some(Boolean)) {
        setWarning("Informe pelo menos nome da empresa, segmento, cidade, estado ou palavra-chave.");
        setMessage("Busca não executada.");
        return;
      }

      const savedIds = await getSavedCompanyIds();
      const response = await searchCompanies(payload, controller.signal);
      if (activeSearchId.current !== searchId) return;
      const localSavedIds = JSON.parse(localStorage.getItem("nodere_saved_leads") || "[]") as string[];
      const savedSet = new Set([...savedIds, ...localSavedIds].map(normalizeId).filter(Boolean));
      const filtered = response.companies.filter((company) => !companySavedKeys(company).some((key) => savedSet.has(key)));
      setResults(filtered);
      setFocusedMapCompany(filtered[0] ?? null);
      const existingCount = Number(response.search.existingCount || response.duplicates?.length || 0);
      setWarning(response.search.warning ?? response.search.existingMessage ?? response.search.error?.message ?? null);
      setMessage(`${filtered.length} resultado(s) temporário(s) visíveis. ${existingCount + response.companies.length - filtered.length} já constam no banco NODERE e foram ocultado(s).`);
    } catch (error) {
      if (activeSearchId.current !== searchId) return;
      setResults([]);
      setWarning(controller.signal.aborted
        ? "A busca demorou muito ou foi cancelada. Tente filtros mais específicos."
        : formatSearchError(error));
      setMessage("Não foi possível concluir a busca.");
    } finally {
      window.clearTimeout(timeoutId);
      if (abortRef.current === controller) abortRef.current = null;
      if (activeSearchId.current === searchId) setLoading(false);
    }
  }

  function cancelSearch() {
    activeSearchId.current = Date.now();
    abortRef.current?.abort("cancelled");
    abortRef.current = null;
    setLoading(false);
    setMessage("Busca cancelada.");
    setWarning("A busca foi cancelada. Ajuste os filtros e tente novamente quando quiser.");
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
    try {
      const result = await geocodeAddress(address);
      const first = result.results[0];
      if (first?.lat && first?.lng) {
        setGeo({ lat: first.lat, lng: first.lng, label: first.address || address });
        setMessage(`Referência aplicada: ${first.address || address}`);
      } else {
        setWarning("Endereço de referência não localizado.");
      }
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Não foi possível geocodificar o endereço.");
    }
  }

  return (
    <section className="space-y-6">
      <form onSubmit={onSubmit} className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-glow">
        <div className="border-b border-[var(--border-soft)] px-4 py-4 md:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-[var(--text-primary)]">
                <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
                Busca NODERE
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Configure a fonte, localização e critérios comerciais antes de consultar.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="nodere-status-badge" data-tone="progress">
                <span className="nodere-status-dot" aria-hidden="true" />
                Google Places
              </span>
              <span className="nodere-status-badge" data-tone="good">
                <span className="nodere-status-dot" aria-hidden="true" />
                Deduplicação ativa
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-4 md:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.72fr)_minmax(0,1fr)]">
            <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">
                <Filter className="h-4 w-4 text-[var(--brand-primary)]" />
                Fonte da busca
              </div>
              <label className={labelClass}>
                <span className={labelTextClass}>Modo</span>
                <select name="mode" className={fieldClass} defaultValue="places">
                  <option value="places">Google Places</option>
                  <option value="cnpj">CNPJ direto</option>
                  <option value="global">Busca internacional</option>
                </select>
              </label>
            </div>

            <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">
                <Building2 className="h-4 w-4 text-[var(--brand-primary)]" />
                Empresa e intenção comercial
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className={labelClass}>
                  <span className={labelTextClass}>CNPJ</span>
                  <input name="cnpj" value={cnpj} onChange={(event) => setCnpj(formatCnpj(event.target.value))} placeholder="00.000.000/0000-00" className={fieldClass} />
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>Nome da empresa</span>
                  <input name="companyName" placeholder="Nome da empresa" className={fieldClass} />
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>Segmento</span>
                  <select value={selectedSegment} onChange={(event) => setSelectedSegment(event.target.value)} name="segment" className={fieldClass}>
                    <option value="">Segmento</option>
                    {allSegments.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
                    <option value={ADD_SEGMENT}>Adicionar segmento...</option>
                  </select>
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>{selectedSegment === ADD_SEGMENT ? "Novo segmento" : "Palavra-chave"}</span>
                  {selectedSegment === ADD_SEGMENT ? (
                    <input value={customSegment} onChange={(event) => setCustomSegment(event.target.value)} placeholder="Novo segmento" className={fieldClass} />
                  ) : (
                    <input name="keyword" placeholder="Palavra-chave" className={fieldClass} />
                  )}
                </label>
              </div>
              {selectedSegment === ADD_SEGMENT && (
                <label className={`${labelClass} mt-3`}>
                  <span className={labelTextClass}>Palavra-chave adicional</span>
                  <input name="keyword" placeholder="Palavra-chave" className={fieldClass} />
                </label>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">
              <Globe2 className="h-4 w-4 text-[var(--brand-primary)]" />
              Localização e raio
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-[1fr_120px_180px_1.4fr_150px_auto_auto]">
              <label className={labelClass}>
                <span className={labelTextClass}>Cidade</span>
                <input name="city" placeholder="Cidade" className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>Estado</span>
                <input name="state" placeholder="UF" className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>País</span>
                <select name="country" className={fieldClass} defaultValue="BR">
                  {COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                </select>
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>Endereço de referência</span>
                <input name="referenceAddress" placeholder="Rua, número, bairro ou ponto de referência" className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>Raio</span>
                <select name="radiusKm" className={fieldClass} defaultValue="">
                  <option value="">Cidade inteira</option>
                  {[1, 5, 10, 25, 50].map((km) => <option key={km} value={km}>{km} km</option>)}
                </select>
              </label>
              <button type="button" onClick={(event) => geocodeReference(event.currentTarget.form!)} className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-lg border border-[var(--border-soft)] bg-[var(--bg-hover)] px-3 text-sm font-bold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
                <Navigation className="h-4 w-4" />
                Usar endereço
              </button>
              <button type="button" onClick={useMyLocation} className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-lg border border-[var(--status-progress-border)] bg-[var(--status-progress-bg)] px-3 text-sm font-bold text-[var(--status-progress)] transition hover:bg-cyan/20">
                <LocateFixed className="h-4 w-4" />
                Minha localização
              </button>
            </div>
            {geo.label && <p className="mt-2 text-xs font-semibold text-[var(--status-progress)]">Referência ativa: {geo.label}</p>}
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--border-soft)] pt-4 md:flex-row md:items-center md:justify-between">
            <button type="button" onClick={() => setAdvancedOpen((value) => !value)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-hover)] px-3 py-2.5 text-sm font-bold text-[var(--text-primary)] md:w-auto">
              {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Filtros avançados e Score NODERE
            </button>
            {loading ? (
              <button type="button" onClick={cancelSearch} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--status-critical-border)] bg-[var(--status-critical-bg)] px-4 text-sm font-black text-[var(--status-critical)] md:w-auto">
                <X className="h-4 w-4" /> Cancelar busca
              </button>
            ) : (
              <button className="btn-action h-11 w-full justify-center px-5 md:w-auto">
                <Search className="h-4 w-4" /> Buscar
              </button>
            )}
          </div>

          {advancedOpen && (
            <div className="grid gap-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] p-4 md:grid-cols-3 xl:grid-cols-6">
              <label className={labelClass}>
                <span className={labelTextClass}>Nota mínima</span>
                <input name="minRating" type="number" min="0" max="5" step="0.1" placeholder="0.0" className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>Nota máxima</span>
                <input name="maxRating" type="number" min="0" max="5" step="0.1" placeholder="5.0" className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>Mín. avaliações</span>
                <input name="minReviews" type="number" min="0" placeholder="0" className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>Site</span>
                <select name="hasWebsite" className={fieldClass} defaultValue="">
                  <option value="">Qualquer</option>
                  <option value="true">Com site</option>
                  <option value="false">Sem site</option>
                </select>
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>WhatsApp</span>
                <select name="hasWhatsApp" className={fieldClass} defaultValue="">
                  <option value="">Qualquer</option>
                  <option value="true">Com WhatsApp</option>
                  <option value="false">Sem WhatsApp</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className={labelClass}>
                  <span className={labelTextClass}>Ordenar por</span>
                  <select name="sortBy" className={fieldClass} defaultValue="nodere_score">
                    <option value="nodere_score">Score NODERE</option>
                    <option value="rating">Avaliação</option>
                    <option value="review_count">Avaliações</option>
                    <option value="relevance">Relevância</option>
                  </select>
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>Direção</span>
                  <select name="sortDir" className={fieldClass} defaultValue="desc">
                    <option value="desc">Maior</option>
                    <option value="asc">Menor</option>
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border-soft)] px-4 py-3 md:px-5">
          <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan" />
            {message}
          </p>
          {warning && (
            <p className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-5 text-[var(--text-primary)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              {warning}
            </p>
          )}
          </div>
        </div>
      </form>
      <div className="lg:hidden">
        <button type="button" onClick={() => setMapOpen((value) => !value)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]">
          {mapOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {mapOpen ? "Ocultar mapa" : "Mostrar mapa"}
        </button>
      </div>
      <GoogleMapPanel
        open={mapOpen}
        query={focusedMapCompany ? [focusedMapCompany.name, focusedMapCompany.address, focusedMapCompany.city, focusedMapCompany.state].filter(Boolean).join(" ") : mapQuery}
        results={results}
        focusedId={focusedMapCompany?.id}
        onFocus={setFocusedMapCompany}
      />
      {results.length > 0 && (
        <section className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)]">
          <div className="flex flex-col gap-3 border-b border-[var(--border-soft)] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-[var(--text-primary)]">Resultados da busca atual</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Empresas retornadas pela consulta atual, sem misturar com leads já salvos no CRM.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="nodere-status-badge" data-tone="good">
                <span className="nodere-status-dot" aria-hidden="true" />
                {results.length} resultado(s)
              </span>
              <span className="nodere-status-badge" data-tone="progress">
                <span className="nodere-status-dot" aria-hidden="true" />
                Ordenação aplicada na busca
              </span>
            </div>
          </div>
          <CompanyTable companies={results} embedded />
        </section>
      )}
      {upgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 shadow-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">Ative um plano para continuar buscando</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  O acesso ao CRM, empresas salvas e histórico continua funcionando. Para novas buscas no Google Places, escolha um plano ou solicite ativação comercial.
                </p>
              </div>
              <button type="button" onClick={() => setUpgradeOpen(false)} className="rounded-lg border border-[var(--border-soft)] px-3 py-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                Fechar
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Starter", "200 créditos", "R$ 97/mês"],
                ["Pro", "600 créditos", "R$ 197/mês"],
                ["Agency", "Ilimitado", "R$ 397/mês"]
              ].map(([name, creditsLabel, price]) => (
                <div key={name} className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-hover)] p-4">
                  <p className="font-semibold text-[var(--text-primary)]">{name}</p>
                  <p className="mt-1 text-xs text-cyan">{creditsLabel}</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{price}</p>
                </div>
              ))}
            </div>
            <Link href="/billing" className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-cyan px-4 py-3 text-sm font-semibold text-ink transition hover:bg-cyan/90">
              Ver planos e ativar
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

function formatSearchError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === "KEY_NOT_CONFIGURED") {
      return "Busca temporariamente indisponível. A integração de mapas precisa ser ativada pelo administrador.";
    }
    if (error.code === "PERMISSION_DENIED" || error.message.includes("API key not valid")) {
      return "A integração de mapas recusou a consulta. Peça ao administrador para revisar a configuração.";
    }
    if (error.code === "GOOGLE_PLACES_UNREACHABLE") {
      return "Não foi possível consultar o serviço de mapas agora. Tente novamente em alguns instantes.";
    }
    return error.message || "Não foi possível concluir a busca.";
  }
  return error instanceof Error ? error.message : "Falha ao buscar empresas.";
}

function parseTriState(value: FormDataEntryValue | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function GoogleMapPanel({
  open,
  query,
  results,
  focusedId,
  onFocus
}: {
  open: boolean;
  query: string;
  results: Company[];
  focusedId?: string;
  onFocus: (company: Company) => void;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [mapMessage, setMapMessage] = useState<string | null>(null);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const mappedCompanies = useMemo(() => results.filter((company) => Number.isFinite(company.latitude) && Number.isFinite(company.longitude)), [results]);
  const embedQuery = focusedId
    ? results.find((company) => company.id === focusedId)?.address || results.find((company) => company.id === focusedId)?.name || query
    : query;
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(embedQuery || "Brasil")}&output=embed`;

  useEffect(() => {
    if (!open || !mapRef.current) return;
    if (!mapsKey) {
      setMapMessage("Mapa indisponível no momento.");
      return;
    }
    let cancelled = false;
    async function loadMap() {
      try {
        const { Loader } = await import("@googlemaps/js-api-loader");
        const loader = new Loader({ apiKey: mapsKey, version: "weekly" });
        const loaderAny = loader as any;
        if (typeof loaderAny.load === "function") {
          await loaderAny.load();
        } else if (typeof loaderAny.importLibrary === "function") {
          await loaderAny.importLibrary("maps");
          await loaderAny.importLibrary("marker");
        } else {
          throw new Error("Google Maps Loader incompatível. Atualize @googlemaps/js-api-loader.");
        }
        if (cancelled || !mapRef.current) return;
        const googleApi = (window as any).google;
        const center = mappedCompanies[0]
          ? { lat: mappedCompanies[0].latitude!, lng: mappedCompanies[0].longitude! }
          : { lat: -14.235, lng: -51.9253 };
        if (!mapInstance.current) {
          mapInstance.current = new googleApi.maps.Map(mapRef.current, { center, zoom: mappedCompanies[0] ? 12 : 4, mapId: "nodere-search-map" });
        } else {
          mapInstance.current.setCenter(center);
          mapInstance.current.setZoom(mappedCompanies[0] ? 12 : 4);
        }
        markers.current.forEach((marker) => marker.setMap(null));
        markers.current = mappedCompanies.map((company) => {
          const marker = new googleApi.maps.Marker({
            map: mapInstance.current,
            position: { lat: company.latitude!, lng: company.longitude! },
            title: company.name
          });
          marker.addListener("click", () => {
            onFocus(company);
            document.getElementById(`result-${company.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          return marker;
        });
        if (markers.current.length > 1) {
          const bounds = new googleApi.maps.LatLngBounds();
          mappedCompanies.forEach((company) => bounds.extend({ lat: company.latitude!, lng: company.longitude! }));
          mapInstance.current.fitBounds(bounds);
        }
        setMapMessage(mappedCompanies.length ? null : "A busca retornou empresas sem coordenadas. O mapa será preenchido quando a API devolver latitude e longitude.");
      } catch (error) {
        setMapMessage(error instanceof Error ? error.message : "Não foi possível carregar o Google Maps.");
      }
    }
    void loadMap();
    return () => {
      cancelled = true;
    };
  }, [open, mapsKey, mappedCompanies, onFocus]);

  useEffect(() => {
    const company = mappedCompanies.find((item) => item.id === focusedId);
    if (company && mapInstance.current) {
      mapInstance.current.panTo({ lat: company.latitude!, lng: company.longitude! });
      mapInstance.current.setZoom(Math.max(mapInstance.current.getZoom() || 12, 14));
    }
  }, [focusedId, mappedCompanies]);

  return (
    <section className={`${open ? "grid" : "hidden lg:grid"} gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]`}>
      <div className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)]">
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-black text-[var(--text-primary)]">
            <MapPin className="h-4 w-4 text-[var(--brand-primary)]" />
            Mapa da busca
          </div>
          <span className="max-w-full truncate rounded-full border border-[var(--border-soft)] bg-[var(--bg-hover)] px-3 py-1 text-xs text-[var(--text-secondary)] sm:max-w-[55%]">{query}</span>
        </div>
        {mapsKey ? (
          <div ref={mapRef} className="h-[420px] w-full bg-[var(--bg-hover)]" />
        ) : (
          <iframe
            title="Google Maps visual"
            src={embedUrl}
            className="h-[420px] w-full border-0 bg-[var(--bg-hover)]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
        {!mapsKey && <p className="border-t border-[var(--border-soft)] px-4 py-3 text-xs text-[var(--text-secondary)]">Mapa visual por incorporação Google. Pins interativos ficam disponíveis quando a integração avançada de mapas estiver ativa.</p>}
        {mapMessage && <p className="border-t border-[var(--border-soft)] px-4 py-3 text-xs text-[var(--warning)]">{mapMessage}</p>}
      </div>
      <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)]">
        <div className="border-b border-[var(--border-soft)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-[var(--text-primary)]">Empresas no mapa</p>
            <span className="nodere-status-badge" data-tone={mappedCompanies.length ? "progress" : "low"}>
              <span className="nodere-status-dot" aria-hidden="true" />
              {mappedCompanies.length}/{results.length}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
            Clique em uma empresa para centralizar no mapa e rolar até o resultado correspondente.
          </p>
        </div>
        <div className="max-h-[420px] space-y-2 overflow-y-auto p-4">
          {results.length === 0 && (
            <p className="rounded-lg border border-dashed border-[var(--border-soft)] p-3 text-xs text-[var(--text-muted)]">
              Execute uma busca para carregar empresas reais e visualizar a região no mapa.
            </p>
          )}
          {results.slice(0, 40).map((company) => (
            <button
              type="button"
              key={company.id}
              onClick={() => {
                onFocus(company);
                document.getElementById(`result-${company.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className={`w-full rounded-lg border px-3 py-2 text-left transition hover:border-[var(--brand-primary)] ${focusedId === company.id ? "border-[var(--brand-primary)] bg-[var(--status-progress-bg)] shadow-[0_0_0_1px_var(--status-progress-border)]" : "border-[var(--border-soft)] bg-[var(--bg-hover)]"}`}
            >
              <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{company.name}</span>
              <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{company.address || `${company.city}/${company.state}`} · Score {company.score}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
