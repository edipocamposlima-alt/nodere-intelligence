import { config } from "../config.js";
import type { Company } from "../types.js";
import { searchGooglePlaces } from "./google.js";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type ResearchSource = {
  title: string;
  url: string;
  publisher: string;
  retrievedAt: string;
};

export type ResearchFinding = {
  statement: string;
  sourceUrl: string;
  confidence: number;
};

export type PublicResearchResult = {
  facts: ResearchFinding[];
  signals: ResearchFinding[];
  inferences: ResearchFinding[];
  opportunities: ResearchFinding[];
  recommendedServices: string[];
  sources: ResearchSource[];
  identityConfidence: number;
  dataConfidence: number;
  commercialScore: number;
  provider: "openai_web_search" | "public_sources";
  providerWarning?: string;
};

export async function runPublicResearch(input: { query: string; company?: Company | null; mode: "quick" | "complete" | "batch" | "refresh" }) {
  const retrievedAt = new Date().toISOString();
  const facts: ResearchFinding[] = [];
  const signals: ResearchFinding[] = [];
  const sources: ResearchSource[] = [];
  let company = input.company || null;

  if (!company) {
    const candidates = await searchGooglePlaces({ companyName: input.query, limit: input.mode === "quick" ? 3 : 10 }).catch(() => []);
    const candidate = candidates[0] || null;
    if (candidate) {
      company = candidate;
      const mapsUrl = normalizePublicUrl(candidate.mapsUrl);
      if (mapsUrl) {
        sources.push({ title: `Perfil público no Google Maps: ${candidate.name}`, url: mapsUrl, publisher: "Google Maps", retrievedAt });
        facts.push({ statement: `${candidate.name} foi localizada em ${candidate.address || [candidate.city, candidate.state].filter(Boolean).join("/") || "localidade não publicada"}.`, sourceUrl: mapsUrl, confidence: normalizeName(candidate.name) === normalizeName(input.query) ? 92 : 72 });
        if (candidate.phone) facts.push({ statement: `Telefone público localizado: ${candidate.phone}.`, sourceUrl: mapsUrl, confidence: 88 });
        if (candidate.rating !== undefined) facts.push({ statement: `Avaliação pública ${candidate.rating}/5 com ${candidate.reviewCount || 0} avaliações.`, sourceUrl: mapsUrl, confidence: 88 });
        signals.push({ statement: candidates.length > 1 ? `Foram encontrados ${candidates.length} possíveis homônimos; confirme a identidade antes de persistir.` : "A busca pública retornou uma identidade comercial principal.", sourceUrl: mapsUrl, confidence: candidates.length > 1 ? 62 : 82 });
      }
    }
  }

  if (company?.website) {
    const website = normalizePublicUrl(company.website);
    if (website) {
      const snapshot = await inspectWebsite(website).catch(() => null);
      sources.push({ title: snapshot?.title || `Site oficial de ${company.name}`, url: website, publisher: hostname(website), retrievedAt });
      if (snapshot?.description) facts.push({ statement: snapshot.description, sourceUrl: website, confidence: 88 });
      signals.push({ statement: snapshot?.reachable ? "Site oficial acessível na data da pesquisa." : "Site oficial informado, mas não respondeu à verificação.", sourceUrl: website, confidence: snapshot?.reachable ? 95 : 65 });
    }
  }
  if (company?.mapsUrl) {
    const mapsUrl = normalizePublicUrl(company.mapsUrl);
    if (mapsUrl) {
      sources.push({ title: `Perfil público no Google Maps: ${company.name}`, url: mapsUrl, publisher: "Google Maps", retrievedAt });
      if (company.rating !== undefined) facts.push({ statement: `Avaliação pública ${company.rating}/5 com ${company.reviewCount || 0} avaliações registradas na ficha.`, sourceUrl: mapsUrl, confidence: 85 });
    }
  }
  if (company?.cnpj) {
    const cnpj = String(company.cnpj).replace(/\D/g, "");
    if (cnpj.length === 14) {
      const sourceUrl = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;
      const registry = await fetchJson(sourceUrl).catch(() => null) as Record<string, unknown> | null;
      if (registry) {
        sources.push({ title: `Cadastro público CNPJ ${cnpj}`, url: sourceUrl, publisher: "BrasilAPI / Receita Federal", retrievedAt });
        const legalName = String(registry.razao_social || company.legalName || company.name);
        const status = String(registry.descricao_situacao_cadastral || "situação não informada");
        facts.push({ statement: `${legalName}: situação cadastral ${status}.`, sourceUrl, confidence: 96 });
      }
    }
  }

  const seed: PublicResearchResult = {
    facts,
    signals,
    inferences: [],
    opportunities: [],
    recommendedServices: [],
    sources: dedupeSources(sources),
    identityConfidence: calculateIdentityConfidence(company, sources),
    dataConfidence: calculateDataConfidence(facts, sources),
    commercialScore: calculateCommercialScore(company, signals),
    provider: "public_sources"
  };

  if (!config.openai.apiKey) return { ...seed, providerWarning: "Pesquisa pública concluída sem síntese OpenAI porque o provedor não está configurado." };
  try {
    const webResult = await runOpenAiWebSearch(input.query, company, seed.sources);
    return mergeResearch(seed, webResult);
  } catch (error) {
    return { ...seed, providerWarning: error instanceof Error ? error.message : "A síntese web do provedor falhou; fontes públicas diretas foram preservadas." };
  }
}

async function runOpenAiWebSearch(query: string, company: Company | null, knownSources: ResearchSource[]) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.openai.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.openai.model,
      tools: [{ type: "web_search" }],
      input: [
        { role: "system", content: "Pesquise somente fontes públicas autorizadas. Separe fatos, sinais, inferências e oportunidades. Cite uma URL pública para cada afirmação. Não invente dados pessoais nem dados sensíveis. Retorne JSON válido." },
        { role: "user", content: JSON.stringify({ query, company: company ? publicCompanySnapshot(company) : null, knownSources, outputSchema: { facts: [{ statement: "", sourceUrl: "", confidence: 0 }], signals: [], inferences: [], opportunities: [], recommendedServices: [], identityConfidence: 0, dataConfidence: 0, commercialScore: 0 } }) }
      ],
      max_output_tokens: 1800
    }),
    signal: AbortSignal.timeout(45_000)
  });
  const body = await response.json().catch(() => ({})) as Record<string, any>;
  if (!response.ok) throw new Error(String(body?.error?.message || `OpenAI retornou HTTP ${response.status}`).slice(0, 500));
  const outputText = String(body.output_text || (body.output || []).flatMap((item: any) => item.content || []).find((part: any) => part.type === "output_text")?.text || "");
  const parsed = parseJsonObject(outputText);
  const annotations = (body.output || []).flatMap((item: any) => item.content || []).flatMap((part: any) => part.annotations || []);
  const annotationSources = annotations.flatMap((annotation: any) => {
    const url = normalizePublicUrl(annotation.url || annotation.url_citation?.url);
    return url ? [{ title: String(annotation.title || annotation.url_citation?.title || hostname(url)), url, publisher: hostname(url), retrievedAt: new Date().toISOString() }] : [];
  });
  return { parsed, annotationSources };
}

function mergeResearch(seed: PublicResearchResult, web: { parsed: Record<string, unknown>; annotationSources: ResearchSource[] }): PublicResearchResult {
  const sources = dedupeSources([...seed.sources, ...web.annotationSources]);
  const allowedUrls = new Set(sources.map((source) => source.url));
  const normalizeFindings = (value: unknown) => (Array.isArray(value) ? value : []).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const statement = String(record.statement || "").trim();
    const sourceUrl = normalizePublicUrl(record.sourceUrl);
    if (!statement || !sourceUrl || !allowedUrls.has(sourceUrl)) return [];
    return [{ statement: statement.slice(0, 1000), sourceUrl, confidence: boundedScore(record.confidence) }];
  });
  const parsed = web.parsed;
  return {
    facts: dedupeFindings([...seed.facts, ...normalizeFindings(parsed.facts)]),
    signals: dedupeFindings([...seed.signals, ...normalizeFindings(parsed.signals)]),
    inferences: dedupeFindings(normalizeFindings(parsed.inferences)),
    opportunities: dedupeFindings(normalizeFindings(parsed.opportunities)),
    recommendedServices: Array.isArray(parsed.recommendedServices) ? parsed.recommendedServices.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 12) : [],
    sources,
    identityConfidence: boundedScore(parsed.identityConfidence || seed.identityConfidence),
    dataConfidence: boundedScore(parsed.dataConfidence || Math.max(seed.dataConfidence, sources.length * 12)),
    commercialScore: boundedScore(parsed.commercialScore || seed.commercialScore),
    provider: "openai_web_search"
  };
}

function publicCompanySnapshot(company: Company) {
  return { name: company.name, legalName: company.legalName, cnpj: company.cnpj, website: company.website, city: company.city, state: company.state, category: company.category, mapsUrl: company.mapsUrl };
}

async function inspectWebsite(url: string) {
  const response = await fetchPublicDocument(url);
  const html = response.ok ? (await response.text()).slice(0, 400_000) : "";
  const title = decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
  const description = decodeHtml(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1] || "").trim();
  return { reachable: response.ok, title: title.slice(0, 180), description: description.slice(0, 800) };
}

async function fetchPublicDocument(input: string) {
  let current = input;
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    await assertPublicTarget(current);
    const response = await fetch(current, {
      headers: { "User-Agent": "NODERE-Public-Research/1.0", Accept: "text/html,application/xhtml+xml" },
      redirect: "manual",
      signal: AbortSignal.timeout(10_000)
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      const contentLength = Number(response.headers.get("content-length") || 0);
      if (contentLength > 2_000_000) throw new Error("Fonte pública excede o limite seguro de leitura.");
      return response;
    }
    const location = response.headers.get("location");
    if (!location) throw new Error("Redirecionamento público sem destino válido.");
    current = new URL(location, current).toString();
  }
  throw new Error("Fonte pública excedeu o limite de redirecionamentos.");
}

async function assertPublicTarget(value: string) {
  const normalized = normalizePublicUrl(value);
  if (!normalized) throw new Error("URL pública inválida ou não permitida.");
  const url = new URL(normalized);
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) throw new Error("Destino privado bloqueado na pesquisa pública.");
}

function isPrivateAddress(address: string): boolean {
  const clean = address.toLowerCase().split("%")[0];
  if (isIP(clean) === 4) {
    const [a, b] = clean.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (isIP(clean) === 6) {
    if (clean === "::" || clean === "::1" || clean.startsWith("fc") || clean.startsWith("fd") || /^fe[89ab]/.test(clean)) return true;
    const mapped = clean.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    return mapped ? isPrivateAddress(mapped) : false;
  }
  return true;
}

async function fetchJson(url: string) {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Fonte pública retornou HTTP ${response.status}`);
  return response.json();
}

function normalizePublicUrl(value: unknown) {
  try {
    const url = new URL(String(value || "").trim());
    const hostname = url.hostname.toLowerCase();
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return "";
    if (url.port && !["80", "443"].includes(url.port)) return "";
    if (['localhost', '127.0.0.1', '::1', 'metadata.google.internal', '169.254.169.254'].includes(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) return "";
    if (isIP(hostname) && isPrivateAddress(hostname)) return "";
    url.hash = "";
    return url.toString();
  } catch { return ""; }
}

function hostname(url: string) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "Fonte pública"; } }
function boundedScore(value: unknown) { return Math.max(0, Math.min(100, Math.round(Number(value) || 0))); }
function calculateIdentityConfidence(company: Company | null, sources: ResearchSource[]) { return boundedScore((company?.cnpj ? 45 : 0) + (company?.website ? 30 : 0) + (company?.mapsUrl ? 20 : 0) + Math.min(5, sources.length)); }
function calculateDataConfidence(facts: ResearchFinding[], sources: ResearchSource[]) { return boundedScore(20 + facts.length * 15 + sources.length * 10); }
function calculateCommercialScore(company: Company | null, signals: ResearchFinding[]) { return boundedScore(25 + (company?.website ? 15 : 0) + (company?.phone || company?.whatsapp ? 10 : 0) + (company?.rating ? 10 : 0) + signals.length * 5); }
function dedupeSources(items: ResearchSource[]) { return [...new Map(items.map((item) => [item.url, item])).values()]; }
function dedupeFindings(items: ResearchFinding[]) { return [...new Map(items.map((item) => [`${item.statement}|${item.sourceUrl}`, item])).values()]; }
function parseJsonObject(value: string) { try { return JSON.parse(value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")); } catch { return {}; } }
function decodeHtml(value: string) { return value.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " "); }
function normalizeName(value: unknown) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase(); }
