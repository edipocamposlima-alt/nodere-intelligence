import { getCompanies } from "@/lib/api";
import { getServerSessionToken } from "@/lib/serverSession";
import { CommunicationsClient } from "./CommunicationsClient";

export const dynamic = "force-dynamic";

export default async function CommercialCommunicationsPage() {
  const token = await getServerSessionToken();
  const companies = await getCompanies(token).catch(() => []);
  return <CommunicationsClient companies={companies} />;
}
