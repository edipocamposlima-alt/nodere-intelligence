import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LegacyCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const canonicalId = encodeURIComponent(decodeURIComponent(String(id || "")));
  redirect(`/app/crm/clientes/${canonicalId}?tab=overview`);
}
