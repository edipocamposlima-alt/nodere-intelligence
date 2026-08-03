export type BriefingFieldType = "text" | "textarea" | "email" | "tel" | "url" | "number" | "date" | "time" | "select" | "tags";

export type BriefingFieldDefinition = {
  key: string;
  label: string;
  section: string;
  type: BriefingFieldType;
  required?: boolean;
  options?: string[];
  companyColumn?: string;
  contactColumn?: string;
  legacyKeys?: string[];
};

export const BRIEFING_FIELDS: BriefingFieldDefinition[] = [
  { key: "company_name", label: "Empresa", section: "Empresa", type: "text", required: true, companyColumn: "name", legacyKeys: ["nome_empresa"] },
  { key: "segment", label: "Segmento", section: "Empresa", type: "text", required: true, companyColumn: "category", legacyKeys: ["segmento"] },
  { key: "cnpj", label: "CNPJ", section: "Empresa", type: "text", companyColumn: "cnpj" },
  { key: "city", label: "Cidade", section: "Empresa", type: "text", companyColumn: "city", legacyKeys: ["cidade"] },
  { key: "state", label: "UF", section: "Empresa", type: "text", companyColumn: "state", legacyKeys: ["estado", "uf"] },
  { key: "full_address", label: "Endereço completo", section: "Empresa", type: "textarea", companyColumn: "address", legacyKeys: ["endereco_completo"] },
  { key: "website", label: "Site", section: "Presença digital", type: "url", companyColumn: "website" },
  { key: "social_networks", label: "Redes sociais", section: "Presença digital", type: "textarea", legacyKeys: ["instagram", "redes_sociais"] },
  { key: "google_business_profile", label: "Google Perfil da Empresa", section: "Presença digital", type: "url", legacyKeys: ["google_perfil_empresa"] },
  { key: "products_services", label: "Principais produtos e serviços", section: "Negócio", type: "textarea", legacyKeys: ["principais_produtos_servicos"] },
  { key: "target_audience", label: "Público-alvo", section: "Negócio", type: "textarea" },
  { key: "differentiators", label: "Diferenciais", section: "Negócio", type: "textarea" },
  { key: "customer_acquisition", label: "Como adquire clientes", section: "Operação comercial", type: "textarea" },
  { key: "service_process", label: "Processo de atendimento", section: "Operação comercial", type: "textarea" },
  { key: "sales_team", label: "Equipe comercial", section: "Operação comercial", type: "textarea" },
  { key: "employees", label: "Funcionários", section: "Operação comercial", type: "number" },
  { key: "direct_competitors", label: "Concorrentes diretos", section: "Mercado", type: "textarea", legacyKeys: ["concorrentes_diretos"] },
  { key: "decision_maker_name", label: "Nome do decisor", section: "Decisor e contato", type: "text", required: true, contactColumn: "name", legacyKeys: ["nome_decisor"] },
  { key: "decision_maker_role", label: "Cargo do decisor", section: "Decisor e contato", type: "text", contactColumn: "role", legacyKeys: ["cargo_decisor"] },
  { key: "phone", label: "Telefone", section: "Decisor e contato", type: "tel", contactColumn: "phone" },
  { key: "whatsapp", label: "WhatsApp", section: "Decisor e contato", type: "tel", contactColumn: "whatsapp" },
  { key: "email", label: "E-mail", section: "Decisor e contato", type: "email", contactColumn: "email" },
  { key: "best_channel", label: "Melhor canal", section: "Decisor e contato", type: "select", options: ["WhatsApp", "E-mail", "Telefone", "Presencial"] },
  { key: "positive_points", label: "Pontos positivos identificados", section: "Diagnóstico", type: "textarea", legacyKeys: ["pontos_positivos_identificados"] },
  { key: "opportunities", label: "Possíveis oportunidades", section: "Diagnóstico", type: "textarea", legacyKeys: ["possiveis_oportunidades"] },
  { key: "diagnosis", label: "Diagnóstico", section: "Diagnóstico", type: "textarea" },
  { key: "evidence", label: "Evidências encontradas", section: "Diagnóstico", type: "textarea", legacyKeys: ["evidencias_encontradas"] },
  { key: "hypotheses", label: "Hipóteses a validar", section: "Diagnóstico", type: "textarea", legacyKeys: ["hipoteses_a_validar"] },
  { key: "approach_objective", label: "Objetivo da abordagem", section: "Planejamento", type: "textarea", legacyKeys: ["objetivo_da_abordagem"] },
  { key: "contact_date", label: "Data do contato", section: "Planejamento", type: "date", legacyKeys: ["data_do_contato"] },
  { key: "next_action", label: "Próxima ação", section: "Planejamento", type: "textarea", required: true, companyColumn: "next_action", legacyKeys: ["proxima_acao"] },
  { key: "next_action_date", label: "Data da próxima ação", section: "Planejamento", type: "date", legacyKeys: ["data_da_proxima_acao"] },
  { key: "next_action_time", label: "Hora da próxima ação", section: "Planejamento", type: "time" },
  { key: "status", label: "Status", section: "Controle", type: "select", options: ["Rascunho", "Pesquisa concluída", "Contato iniciado", "Em acompanhamento", "Concluído"] },
  { key: "priority", label: "Prioridade", section: "Controle", type: "select", options: ["Baixa", "Normal", "Alta", "Urgente"] },
  { key: "general_notes", label: "Observações gerais", section: "Controle", type: "textarea", legacyKeys: ["observacoes_gerais"] },
  { key: "planned_approach", label: "Abordagem planejada", section: "Estratégia", type: "textarea" },
  { key: "objection_risks", label: "Objeções e riscos", section: "Estratégia", type: "textarea" },
  { key: "budget_range", label: "Faixa de investimento", section: "Qualificação", type: "text" },
  { key: "decision_process", label: "Processo de decisão", section: "Qualificação", type: "textarea" },
  { key: "business_goals", label: "Objetivos de negócio", section: "Qualificação", type: "textarea" },
  { key: "success_metrics", label: "Métricas de sucesso", section: "Qualificação", type: "textarea" },
  { key: "current_tools", label: "Ferramentas atuais", section: "Contexto atual", type: "textarea" },
  { key: "current_agency", label: "Agência ou fornecedor atual", section: "Contexto atual", type: "text" },
  { key: "timeline", label: "Prazo desejado", section: "Contexto atual", type: "text" },
  { key: "sources", label: "Fontes", section: "Rastreabilidade", type: "tags" },
  { key: "tags", label: "Tags", section: "Rastreabilidade", type: "tags" }
];

const fieldKeys = new Set(BRIEFING_FIELDS.map((field) => field.key));

export function normalizeBriefingAnswers(input: Record<string, unknown>) {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!fieldKeys.has(key)) continue;
    if (typeof value === "string") output[key] = value.trim().slice(0, 20_000);
    else if (Array.isArray(value)) output[key] = value.slice(0, 100).map((item) => String(item).trim().slice(0, 500)).filter(Boolean);
    else if (typeof value === "number" || typeof value === "boolean" || value === null) output[key] = value;
  }
  return output;
}

export function isAnswered(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return value !== undefined && value !== null;
}

export function calculateBriefingCompletion(answers: Record<string, unknown>) {
  const answered = BRIEFING_FIELDS.filter((field) => isAnswered(answers[field.key])).length;
  return Math.round((answered / BRIEFING_FIELDS.length) * 100);
}

export function missingRequiredBriefingFields(answers: Record<string, unknown>) {
  return BRIEFING_FIELDS.filter((field) => field.required && !isAnswered(answers[field.key]));
}
