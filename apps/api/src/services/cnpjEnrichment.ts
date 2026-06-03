import { config } from "../config.js";
import { Company } from "../types.js";

export interface CnpjEnrichmentResult {
  status: "enriched" | "not_found" | "not_configured" | "error";
  cnpj?: string;
  fields?: Record<string, unknown>;
  message: string;
}

export async function enrichCnpj(company: Company): Promise<CnpjEnrichmentResult> {
  const existing = cleanCnpj(company.cnpj);
  const cnpj = existing || await findCnpj(company);
  if (!cnpj) {
    return {
      status: config.google.customSearchKey ? "not_found" : "not_configured",
      message: config.google.customSearchKey
        ? "CNPJ não localizado em fontes públicas consultadas."
        : "GOOGLE_CUSTOM_SEARCH_KEY ausente; enriquecimento fiscal ficou pendente."
    };
  }

  try {
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.status === "ERROR") {
      return { status: "error", cnpj, message: payload?.message || "ReceitaWS não retornou dados para o CNPJ." };
    }
    return {
      status: "enriched",
      cnpj,
      message: "Dados fiscais enriquecidos por fonte pública.",
      fields: {
        cnpj,
        legalName: payload.nome,
        razaoSocial: payload.nome,
        situacaoCadastral: payload.situacao,
        dataAbertura: payload.abertura,
        capitalSocial: payload.capital_social,
        cnaePrincipal: payload.atividade_principal?.[0]?.text,
        socios: payload.qsa?.map?.((s: { nome?: string }) => s.nome).filter(Boolean) ?? [],
        enderecoFiscal: [payload.logradouro, payload.numero, payload.municipio, payload.uf].filter(Boolean).join(", ")
      }
    };
  } catch (error) {
    return { status: "error", cnpj, message: error instanceof Error ? error.message : "Erro ao consultar ReceitaWS." };
  }
}

async function findCnpj(company: Company) {
  if (!config.google.customSearchKey) return "";
  const query = `${company.name} ${company.city} CNPJ site:receita.fazenda.gov.br OR site:cnpj.biz`;
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", config.google.customSearchKey);
  url.searchParams.set("cx", process.env.GOOGLE_CUSTOM_SEARCH_CX || "");
  url.searchParams.set("q", query);
  if (!url.searchParams.get("cx")) return "";
  const response = await fetch(url);
  if (!response.ok) return "";
  const payload = await response.json().catch(() => ({}));
  const text = JSON.stringify(payload);
  return cleanCnpj(text);
}

function cleanCnpj(value?: string) {
  const match = String(value || "").match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
  return match ? match[0].replace(/\D/g, "") : "";
}
