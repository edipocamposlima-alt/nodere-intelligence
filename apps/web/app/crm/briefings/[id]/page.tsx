import { getCommercialBriefing } from "@/lib/api";
import { getServerSessionToken } from "@/lib/serverSession";
import { BriefingEditor } from "./BriefingEditor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CommercialBriefingDetailPage({ params }: Props) {
  const { id } = await params;
  const token = await getServerSessionToken();
  const briefing = await getCommercialBriefing(id, token);
  return <BriefingEditor initialBriefing={briefing} />;
}
