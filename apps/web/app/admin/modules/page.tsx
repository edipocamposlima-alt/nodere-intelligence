import { RedirectPage } from "../RedirectPage";

export const dynamic = "force-dynamic";

export default function AdminModulesPage() {
  return <RedirectPage href="/admin/content?area=plans" label="Abrir módulos" />;
}
