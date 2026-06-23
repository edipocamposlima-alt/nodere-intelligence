import { RedirectPage } from "../RedirectPage";

export const dynamic = "force-dynamic";

export default function AdminPlansPage() {
  return <RedirectPage href="/admin/content?area=plans" label="Abrir planos" />;
}
