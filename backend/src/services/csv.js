function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function leadsToCsv(leads) {
  const headers = [
    "Empresa",
    "Telefone",
    "WhatsApp",
    "Site",
    "Cidade",
    "Estado",
    "Segmento",
    "Status",
    "Score"
  ];

  const rows = leads.map((lead) => [
    lead.company_name,
    lead.phone,
    lead.whatsapp,
    lead.website,
    lead.city,
    lead.state,
    lead.segment,
    lead.status,
    lead.opportunity_score
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}
