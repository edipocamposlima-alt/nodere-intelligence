import { config } from "../config.js";
import { Company, DecisionMaker } from "../types.js";

export interface ExternalEnrichmentResult {
  cnpj?: string;
  legalName?: string;
  companySize?: string;
  revenueRange?: string;
  linkedin?: string;
  decisionMakers?: DecisionMaker[];
  enrichmentSources: string[];
  messages: string[];
}

export async function enrichCompanyExternal(company: Company): Promise<ExternalEnrichmentResult> {
  const messages: string[] = [];
  const sources: string[] = [];
  const decisionMakers: DecisionMaker[] = [];
  const result: ExternalEnrichmentResult = { enrichmentSources: sources, messages };

  const domain = getDomain(company.website);

  const [apollo, econodata] = await Promise.allSettled([
    enrichWithApollo(company, domain),
    enrichWithEconodata(company)
  ]);

  if (apollo.status === "fulfilled") {
    mergeExternal(result, apollo.value);
    if (apollo.value.decisionMakers?.length) decisionMakers.push(...apollo.value.decisionMakers);
    sources.push(...apollo.value.enrichmentSources);
    messages.push(...apollo.value.messages);
  } else {
    messages.push(`Apollo.io: ${apollo.reason instanceof Error ? apollo.reason.message : "falha na consulta"}`);
  }

  if (econodata.status === "fulfilled") {
    mergeExternal(result, econodata.value);
    if (econodata.value.decisionMakers?.length) decisionMakers.push(...econodata.value.decisionMakers);
    sources.push(...econodata.value.enrichmentSources);
    messages.push(...econodata.value.messages);
  } else {
    messages.push(`Econodata: ${econodata.reason instanceof Error ? econodata.reason.message : "falha na consulta"}`);
  }

  const uniqueDecisionMakers = dedupeDecisionMakers(decisionMakers);
  if (uniqueDecisionMakers.length) result.decisionMakers = uniqueDecisionMakers;
  result.enrichmentSources = [...new Set(sources)];
  result.messages = [...new Set(messages)];
  return result;
}

async function enrichWithApollo(company: Company, domain?: string): Promise<ExternalEnrichmentResult> {
  if (!config.enrichment.apolloApiKey) {
    return { enrichmentSources: [], messages: ["Apollo.io não configurado. Defina APOLLO_API_KEY no Render/Admin."] };
  }

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "X-Api-Key": config.enrichment.apolloApiKey
  };

  const output: ExternalEnrichmentResult = { enrichmentSources: ["apollo"], messages: [] };

  if (domain) {
    const orgUrl = new URL(`${config.enrichment.apolloApiUrl}/organizations/enrich`);
    orgUrl.searchParams.set("domain", domain);
    const orgResponse = await fetch(orgUrl, { headers, signal: AbortSignal.timeout(15000) });
    if (orgResponse.ok) {
      const payload = await orgResponse.json();
      const org = payload.organization ?? payload;
      output.legalName = pickString(org.name, org.organization_name, org.legal_name);
      output.linkedin = normalizeLinkedInUrl(pickString(org.linkedin_url, org.linkedin));
      output.companySize = pickString(org.estimated_num_employees, org.employee_count, org.num_employees);
      output.revenueRange = pickString(org.annual_revenue_printed, org.revenue_range, org.estimated_annual_revenue);
      output.messages.push("Apollo.io: organização enriquecida por domínio.");
    } else {
      output.messages.push(await providerHttpMessage("Apollo.io organização", orgResponse));
    }
  } else {
    output.messages.push("Apollo.io: site/domínio ausente; busca limitada por nome.");
  }

  const peopleResponse = await fetch(`${config.enrichment.apolloApiUrl}/mixed_people/search`, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      q_keywords: company.name,
      q_organization_domains_list: domain ? [domain] : undefined,
      person_titles: ["owner", "sócio", "diretor", "CEO", "founder", "marketing", "comercial"],
      per_page: 5,
      page: 1
    })
  });

  if (peopleResponse.ok) {
    const payload = await peopleResponse.json();
    const people = Array.isArray(payload.people) ? payload.people : [];
    output.decisionMakers = people.slice(0, 5).map((person: any) => ({
      name: pickString(person.name, [person.first_name, person.last_name].filter(Boolean).join(" ")),
      title: pickString(person.title, person.headline),
      email: pickString(person.email),
      linkedin: normalizeLinkedInUrl(pickString(person.linkedin_url)),
      source: "apollo"
    })).filter((person: DecisionMaker) => person.name || person.linkedin || person.email);
    output.messages.push(`Apollo.io: ${output.decisionMakers?.length ?? 0} decisor(es) localizado(s).`);
  } else {
    output.messages.push(await providerHttpMessage("Apollo.io pessoas", peopleResponse));
  }

  return output;
}

async function enrichWithEconodata(company: Company): Promise<ExternalEnrichmentResult> {
  if (!config.enrichment.econodataApiKey) {
    return { enrichmentSources: [], messages: ["Econodata não configurado. Defina ECONODATA_API_KEY no Render/Admin."] };
  }
  if (!config.enrichment.econodataApiUrl) {
    return { enrichmentSources: [], messages: ["Econodata requer ECONODATA_API_URL oficial do contrato/API para consulta automatizada."] };
  }

  const url = new URL(config.enrichment.econodataApiUrl);
  url.searchParams.set("q", company.name);
  if (company.city) url.searchParams.set("city", company.city);
  if (company.state) url.searchParams.set("state", company.state);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.enrichment.econodataApiKey}`,
      "X-Api-Key": config.enrichment.econodataApiKey
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    return { enrichmentSources: ["econodata"], messages: [await providerHttpMessage("Econodata", response)] };
  }

  const payload = await response.json();
  const first = Array.isArray(payload?.data) ? payload.data[0] : Array.isArray(payload?.results) ? payload.results[0] : payload?.company ?? payload;
  return {
    cnpj: pickString(first?.cnpj, first?.taxId, first?.tax_id),
    legalName: pickString(first?.razao_social, first?.legalName, first?.legal_name, first?.name),
    companySize: pickString(first?.porte, first?.companySize, first?.size),
    revenueRange: pickString(first?.faturamento, first?.revenueRange, first?.revenue_range),
    linkedin: normalizeLinkedInUrl(pickString(first?.linkedin, first?.linkedin_url)),
    decisionMakers: normalizeDecisionMakers(first?.decisionMakers ?? first?.socios ?? first?.partners, "econodata"),
    enrichmentSources: ["econodata"],
    messages: ["Econodata: consulta executada pelo backend."]
  };
}

function getDomain(website?: string) {
  if (!website) return undefined;
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function normalizeDecisionMakers(input: unknown, source: DecisionMaker["source"]) {
  if (!Array.isArray(input)) return undefined;
  return input.slice(0, 5).map((item: any) => ({
    name: pickString(item.name, item.nome, item.fullName),
    title: pickString(item.title, item.cargo, item.role),
    email: pickString(item.email),
    phone: pickString(item.phone, item.telefone),
    linkedin: normalizeLinkedInUrl(pickString(item.linkedin, item.linkedin_url)),
    source
  })).filter((person: DecisionMaker) => person.name || person.email || person.linkedin);
}

function dedupeDecisionMakers(items: DecisionMaker[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.email || ""}|${item.linkedin || ""}|${item.name || ""}`.toLowerCase();
    if (!key.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function providerHttpMessage(label: string, response: Response) {
  const details = await response.text().catch(() => "");
  const safeDetails = details.replace(/sk-[A-Za-z0-9_-]+|AIza[0-9A-Za-z_-]+/g, "[secret]").slice(0, 220);
  if (response.status === 401) {
    return `${label}: chave inválida ou ausente. Revise a credencial no Render/Admin.`;
  }
  if (response.status === 403) {
    return `${label}: integração conectada, mas a Apollo/Econodata recusou a consulta. Normalmente isso indica plano sem API, endpoint sem permissão ou política da conta. Corrija liberando o endpoint no provedor ou usando uma chave com acesso comercial. ${safeDetails ? `Detalhe seguro: ${safeDetails}` : ""}`.trim();
  }
  if (response.status === 429) {
    return `${label}: limite de uso excedido. Aguarde a janela de quota ou revise o plano da integração.`;
  }
  return `${label}: HTTP ${response.status}. ${safeDetails ? `Detalhe seguro: ${safeDetails}` : "Verifique endpoint, contrato e permissões."}`.trim();
}

function normalizeLinkedInUrl(value?: string) {
  if (!value) return undefined;
  const clean = value.trim();
  if (!clean) return undefined;
  const withProtocol = clean.startsWith("http") ? clean : `https://${clean}`;
  try {
    const url = new URL(withProtocol);
    if (!url.hostname.includes("linkedin.com")) return undefined;
    const parts = url.pathname.split("/").filter(Boolean);
    const isGenericCompany = parts.length === 1 && parts[0].toLowerCase() === "company";
    const isGenericIn = parts.length === 1 && parts[0].toLowerCase() === "in";
    if (!parts.length || isGenericCompany || isGenericIn) return undefined;
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

function mergeExternal(target: ExternalEnrichmentResult, value: ExternalEnrichmentResult) {
  for (const key of ["cnpj", "legalName", "companySize", "revenueRange", "linkedin"] as const) {
    if (value[key]) target[key] = value[key];
  }
}
