import type { Metadata } from "next";
import { getPipelineReport, getForecastReport, getMonthlyTrends } from "@/lib/api";
import { ReportsClient } from "./ReportsClient";

export const metadata: Metadata = { title: "Relatórios" };

export default async function ReportsPage() {
  const [pipeline, forecast, trends] = await Promise.all([
    getPipelineReport().catch(() => null),
    getForecastReport().catch(() => null),
    getMonthlyTrends().catch(() => [])
  ]);

  return <ReportsClient pipeline={pipeline} forecast={forecast} trends={trends} />;
}
