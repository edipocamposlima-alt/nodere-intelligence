import { RedirectPage } from "../RedirectPage";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return <RedirectPage href="/admin?tab=users" label="Abrir usuários" />;
}
