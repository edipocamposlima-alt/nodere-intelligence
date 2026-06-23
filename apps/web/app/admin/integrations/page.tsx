import { RedirectPage } from "../RedirectPage";

export const dynamic = "force-dynamic";

export default function AdminIntegrationsPage() {
  return <RedirectPage href="/admin?tab=apis" label="Abrir integrações" />;
}
