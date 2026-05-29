import { randomUUID } from "node:crypto";
import { EnrichmentJob } from "../types.js";
import { analyzeWebsite } from "./google.js";
import { calculateOpportunityScore } from "./scoring.js";
import { getCompany, updateCompany } from "./companyStore.js";

const jobs: EnrichmentJob[] = [];
const MAX_CONCURRENT = 3;
let running = 0;

export function getQueueStatus() {
  const pending = jobs.filter((j) => j.status === "pending").length;
  const inProgress = jobs.filter((j) => j.status === "running").length;
  const done = jobs.filter((j) => j.status === "done").length;
  const error = jobs.filter((j) => j.status === "error").length;
  return {
    total: jobs.length,
    pending,
    running: inProgress,
    done,
    error,
    jobs: jobs.slice(-100).reverse()
  };
}

export function getJobByCompany(companyId: string) {
  return jobs.filter((j) => j.companyId === companyId).at(-1);
}

export function queueEnrichment(companyId: string, companyName: string): EnrichmentJob {
  const active = jobs.find((j) => j.companyId === companyId && (j.status === "pending" || j.status === "running"));
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

    const digital = await analyzeWebsite(company.website);
    const scored = calculateOpportunityScore({ ...company, ...digital });

    updateCompany(job.companyId, {
      ...digital,
      ...scored,
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
