import { getCompany } from "@/lib/api";
import { getServerSessionToken } from "@/lib/serverSession";
import { CrmClientFullPage } from "./CrmClientFullPage";

export const dynamic = "force-dynamic";

export default async function CrmClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionToken = await getServerSessionToken();
  const company = await getCompany(id, sessionToken).catch(() => null);

  if (!company) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <section className="rounded-xl border border-danger/30 bg-danger/10 p-6">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Cliente não encontrado</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Não foi possível abrir a ficha comercial pelo CRM.</p>
          <a href="/crm" className="mt-5 inline-flex rounded-lg bg-electric px-4 py-2 text-sm font-bold text-white">Voltar ao CRM</a>
        </section>
      </div>
    );
  }

  return <CrmClientFullPage company={company} />;
}
