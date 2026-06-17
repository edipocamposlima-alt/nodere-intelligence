export const CRM_STAGES = [
  {
    id: "Novo Lead",
    label: "Novo Lead",
    color: "var(--crm-new)",
    bgColor: "var(--crm-new-bg-dark)",
    description: "Leads recém-adicionados aguardando análise"
  },
  {
    id: "Análise IA",
    label: "Análise IA",
    color: "var(--crm-ai)",
    bgColor: "var(--crm-ai-bg-dark)",
    description: "Lead em análise automática pela IA"
  },
  {
    id: "Qualificado",
    label: "Qualificação",
    color: "var(--crm-qualified)",
    bgColor: "var(--crm-qualified-bg-dark)",
    description: "Avaliando se o lead tem potencial"
  },
  {
    id: "Contatado",
    label: "Primeiro Contato",
    color: "var(--crm-active)",
    bgColor: "var(--crm-active-bg-dark)",
    description: "Primeiro contato realizado ou tentado"
  },
  {
    id: "Reunião marcada",
    label: "Reunião Agendada",
    color: "var(--crm-meeting)",
    bgColor: "var(--crm-meeting-bg-dark)",
    description: "Reunião ou apresentação marcada"
  },
  {
    id: "Diagnóstico enviado",
    label: "Diagnóstico",
    color: "var(--crm-presentation)",
    bgColor: "var(--crm-presentation-bg-dark)",
    description: "Levantamento de necessidades realizado"
  },
  {
    id: "Proposta enviada",
    label: "Proposta",
    color: "var(--crm-proposal)",
    bgColor: "var(--crm-proposal-bg-dark)",
    description: "Proposta enviada ao cliente"
  },
  {
    id: "Negociação",
    label: "Negociação",
    color: "var(--crm-waiting)",
    bgColor: "var(--crm-waiting-bg-dark)",
    description: "Em negociação de termos e valores"
  },
  {
    id: "Fechado",
    label: "Cliente",
    color: "var(--crm-won)",
    bgColor: "var(--crm-won-bg-dark)",
    description: "Negócio fechado, cliente ativo"
  },
  {
    id: "Perdido",
    label: "Perdido",
    color: "var(--crm-lost)",
    bgColor: "var(--crm-lost-bg-dark)",
    description: "Negociação encerrada sem conversão"
  }
] as const;

export type CRMStageId = typeof CRM_STAGES[number]["id"];

export function crmStageById(id?: string) {
  return CRM_STAGES.find((stage) => stage.id === id) ?? CRM_STAGES[0];
}
