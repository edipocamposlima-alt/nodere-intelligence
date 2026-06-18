import { Router } from "express";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { listCompaniesAsync } from "../services/companyStore.js";
import type { Company } from "../types.js";

const router = Router();

router.get("/summary", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const companies = await listCompaniesAsync(workspaceId);
    const total = companies.length;
    const withWebsite = companies.filter((company) => Boolean(company.website)).length;
    const withAds = companies.filter((company) => company.hasGoogleAds === true).length;
    const avgScore = total
      ? Math.round(companies.reduce((sum, company) => sum + nexusValue(company), 0) / total)
      : 0;
    const critical = companies.filter((company) => nexusValue(company) >= 750).length;
    const high = companies.filter((company) => {
      const score = nexusValue(company);
      return score >= 500 && score < 750;
    }).length;

    res.json({
      total_analyzed: total,
      with_site: withWebsite,
      without_site: total - withWebsite,
      with_google_ads: withAds,
      without_google_ads: total - withAds,
      avg_nexus_score: avgScore,
      critical_opportunities: critical,
      high_priority: high,
      top_segments: groupAverage(companies, "category"),
      top_cities: groupAverage(companies, "city")
    });
  } catch (error) {
    next(error);
  }
});

function groupAverage(items: Company[], key: "category" | "city") {
  const groups = new Map<string, { count: number; sum: number }>();
  for (const item of items) {
    const label = String(item[key] || "Não informado");
    const current = groups.get(label) || { count: 0, sum: 0 };
    current.count += 1;
    current.sum += nexusValue(item);
    groups.set(label, current);
  }
  return Array.from(groups.entries())
    .map(([label, value]) => ({ label, count: value.count, avg_score: value.count ? Math.round(value.sum / value.count) : 0 }))
    .sort((a, b) => b.count - a.count || b.avg_score - a.avg_score)
    .slice(0, 8);
}

function nexusValue(company: Pick<Company, "nexusScore" | "score">) {
  return Number(company.nexusScore ?? Number(company.score || 0) * 10);
}

export default router;
