import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | NODERE"
};

const cards = [
  { label: "Módulos ativos", value: "Plano trial", desc: "A sidebar mostra módulos liberados e bloqueados por workspace." },
  { label: "Configurações", value: "Prontas", desc: "Workspace, equipe, integrações, notificações e billing." },
  { label: "Upgrade", value: "Ativo", desc: "Módulos bloqueados direcionam para CTA de upgrade." }
];

export default function AppDashboardPage() {
  return (
    <div className="app-dashboard-page">
      <div className="app-dashboard-hero">
        <p>NODERE</p>
        <h1>Hub central da plataforma</h1>
        <span>Gerencie seu workspace, módulos e configurações em um único lugar.</span>
      </div>
      <div className="app-dashboard-grid">
        {cards.map((card) => (
          <article key={card.label} className="app-dashboard-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.desc}</p>
          </article>
        ))}
      </div>
      <div className="app-dashboard-actions">
        <Link href="/app/settings" className="btn-primary">Abrir configurações</Link>
        <Link href="/app/upgrade?module=CRM-04" className="btn-ghost">Ver módulo bloqueado</Link>
      </div>
    </div>
  );
}
