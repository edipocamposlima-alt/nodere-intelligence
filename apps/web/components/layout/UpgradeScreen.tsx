const MODULE_INFO: Record<string, { name: string; plan: string; desc: string }> = {
  "DISC-06": { name: "Social Scanner", plan: "Pro", desc: "Identifique presença em redes sociais e oportunidades de gestão." },
  "INTEL-01": { name: "Enriquecimento", plan: "Pro", desc: "Enriqueça leads com dados do Apollo, Receita Federal e LinkedIn." },
  "ENG-01": { name: "WhatsApp Inbox", plan: "Pro", desc: "Gerencie conversas de WhatsApp direto do CRM." },
  "ENG-02": { name: "Disparos em Massa", plan: "Agency", desc: "Envie campanhas para listas segmentadas com rastreamento." },
  "ENG-03": { name: "E-mail", plan: "Pro", desc: "Envie e acompanhe campanhas de e-mail integradas ao CRM." },
  "ANA-02": { name: "Relatórios", plan: "Pro", desc: "Relatórios completos em PDF e CSV com agendamento." },
  "OPS-01": { name: "Projetos", plan: "Agency", desc: "Gerencie implantações e entregas para clientes fechados." },
  "CRM-04": { name: "Propostas", plan: "Pro", desc: "Crie propostas comerciais conectadas aos seus leads." }
};

export default function UpgradeScreen({ moduleCode }: { moduleCode?: string }) {
  const info = MODULE_INFO[moduleCode || ""] || {
    name: moduleCode || "Módulo premium",
    plan: "superior",
    desc: "Este módulo está disponível em planos superiores."
  };

  return (
    <div className="upgrade-screen">
      <div className="upgrade-card">
        <div className="upgrade-lock">🔒</div>
        <h2>{info.name}</h2>
        <p>{info.desc}</p>
        <p className="upgrade-plan">Disponível no plano <strong>{info.plan}</strong></p>
        <a href="/app/upgrade" className="btn-primary">Ver planos e fazer upgrade →</a>
        <a href="/app/dashboard" className="btn-ghost">Voltar ao dashboard</a>
      </div>
    </div>
  );
}
