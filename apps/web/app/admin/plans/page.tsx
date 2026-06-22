import { redirect } from "next/navigation";

export default function AdminPlansPage() {
  redirect("/admin/content?area=plans");
}
