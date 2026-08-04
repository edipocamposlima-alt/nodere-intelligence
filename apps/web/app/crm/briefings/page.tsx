import { getCommercialBriefings, getCompanies } from "@/lib/api";
import { getServerSessionToken } from "@/lib/serverSession";
import { BriefingsClient } from "./BriefingsClient";

export const dynamic = "force-dynamic";

export default async function CommercialBriefingsPage() {
  const token = await getServerSessionToken();
  const [briefingsResult, companiesResult] = await Promise.allSettled([
    Promise.all([getCommercialBriefings(token), getCommercialBriefings(token, { status: "trash" })]).then(([active, trash]) => [...active, ...trash.map((item) => ({ ...item, status: "trash" as const }))]),
    getCompanies(token)
  ]);
  const briefings = briefingsResult.status === "fulfilled" ? briefingsResult.value : [];
  const companies = companiesResult.status === "fulfilled" ? companiesResult.value : [];
  const error = briefingsResult.status === "rejected"
    ? briefingsResult.reason instanceof Error ? briefingsResult.reason.message : "Não foi possível carregar os briefings."
    : "";
  return <BriefingsClient initialBriefings={briefings} companies={companies} initialError={error} />;
}
