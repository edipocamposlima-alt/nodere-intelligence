export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/searches": "Busca de Empresas",
  "/busca-de-empresas": "Busca de Empresas",
  "/companies": "Empresas",
  "/crm": "CRM",
  "/pipeline": "CRM",
  "/intelligence": "Inteligência Digital",
  "/ia": "Inteligência Digital",
  "/inbox": "Caixa de Entrada",
  "/calendar": "Calendário",
  "/calendario": "Calendário",
  "/automations": "Automações",
  "/operators": "Operadores",
  "/reports": "Relatórios",
  "/relatorios": "Relatórios",
  "/marketing": "Marketing Intelligence",
  "/catalog": "Catálogo",
  "/integrations": "Integrações",
  "/integracoes": "Integrações",
  "/billing": "Faturamento",
  "/settings": "Configurações",
  "/configuracoes": "Configurações",
  "/admin": "Administrador",
  "/manual": "Ajuda / Manual",
  "/ajuda": "Ajuda / Manual",
  "/help": "Ajuda / Manual"
};

export function getPageTitle(pathname = "/") {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const match = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((route) => normalized === route || normalized.startsWith(`${route}/`));
  return match ? PAGE_TITLES[match] : "Dashboard";
}
