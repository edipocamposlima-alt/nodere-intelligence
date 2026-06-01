import { getCompanies } from "@/lib/api";
import { CrmBoard } from "./CrmBoard";

export default async function CrmPage() {
  const companies = await getCompanies();

  return (
    <div className="space-y-5 p-4 md:p-8">
      <CrmBoard companies={companies} />
    </div>
  );
}
