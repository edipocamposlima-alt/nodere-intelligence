import { randomUUID } from "node:crypto";
import { EnrichmentJob } from "../types.js";
import { scanWebsite } from "./websiteScanner.js";
import { calculateOpportunityScore, calculateMaturityScore, calculateCommercialScore, calculatePaidTrafficScore } from "./scoring.js";
import { saveAudit } from "../db/auditStore.js";
import { getCompany, updateCompany } from "./companyStore.js";
import { enrichCompanyExternal } from "./externalEnrichment.js";

const jobs: EnrichmentJob[] = [];
const MAX_CONCURRENT = 3;
let running = 0;

export function getQueueStatus() {
  return {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "pending").length,
    running: jobs.filter((j) => j.status === "running").length,
    done: jobs.filter((j) => j.status === "done").length,
    error: jobs.filter((j) => j.status === "error").length,
    jobs: jobs.slice(-100).reverse()
  };
}

export function getJobByCompany(companyId: string) {
  return jobs.filter((j) => j.companyId === companyId).at(-1);
}

export function queueEnrichment(companyId: string, companyName: string): EnrichmentJob {
  const active = jobs.find(
    (j) => j.companyId === companyId && (j.status === "pending" || j.status === "running")
  );
  if (active) return active;

  const job: EnrichmentJob = {
    id: randomUUID(),
    companyId,
    companyName,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  jobs.push(job);
  scheduleNext();
  return job;
}

function scheduleNext() {
  if (running >= MAX_CONCURRENT) return;
  const next = jobs.find((j) => j.status === "pending");
  if (!next) return;
  processJob(next);
}

async function processJob(job: EnrichmentJob) {
  running++;
  job.status = "running";
  updateCompany(job.companyId, { enrichmentStatus: "running" });

  try {
    const company = getCompany(job.companyId);
    if (!company) throw new Error("Company not found in store");

    const scan = await scanWebsite(company.website);
    saveAudit(job.companyId, scan);

    const external = await enrichCompanyExternal({ ...company, ...scan });
    const opportunityData = calculateOpportunityScore({ ...company, ...scan, ...external });

    updateCompany(job.companyId, {
      // basic signals (backward compat)
      hasSsl: scan.hasSsl,
      isResponsive: scan.isResponsive,
      pageSpeed: scan.pageSpeed,
      metaPixel: scan.hasMetaPixel,
      googleTagManager: scan.hasGTM,
      googleAnalytics: scan.hasGA4 || (scan as any).googleAnalytics,
      seoBasics: scan.hasTitle && scan.hasMetaDescription,
      // social
      instagram: scan.instagram,
      facebook: scan.facebook,
      linkedin: scan.linkedin,
      youtube: scan.youtube,
      cnpj: external.cnpj,
      legalName: external.legalName,
      companySize: external.companySize,
      revenueRange: external.revenueRange,
      decisionMakers: external.decisionMakers,
      enrichmentSources: external.enrichmentSources,
      // Phase 3 deep signals
      hasGA4: scan.hasGA4,
      ga4MeasurementId: scan.ga4MeasurementId,
      gtmContainerId: scan.gtmContainerId,
      metaPixelId: scan.metaPixelId,
      hasConversionEvents: scan.hasConversionEvents,
      conversionEvents: scan.conversionEvents,
      hasH1: scan.hasH1,
      hasCanonical: scan.hasCanonical,
      hasOpenGraph: scan.hasOpenGraph,
      hasStructuredData: scan.hasStructuredData,
      hasSitemap: scan.hasSitemap,
      lcp: scan.lcp,
      cls: scan.cls,
      fcp: scan.fcp,
      // composite scores
      maturityScore: calculateMaturityScore(scan),
      commercialScore: calculateCommercialScore(company, scan),
      paidTrafficScore: calculatePaidTrafficScore(scan),
      // opportunity
      ...opportunityData,
      enrichmentStatus: "done"
    });

    job.status = "done";
    job.completedAt = new Date().toISOString();
  } catch (error) {
    job.status = "error";
    job.error = error instanceof Error ? error.message : "Unknown error";
    job.completedAt = new Date().toISOString();
    updateCompany(job.companyId, { enrichmentStatus: "error" });
  } finally {
    running--;
    scheduleNext();
  }
}
