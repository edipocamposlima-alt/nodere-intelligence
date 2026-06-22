import { redirect } from "next/navigation";

export default function AdminModulesPage() {
  redirect("/admin/content?area=plans");
}
