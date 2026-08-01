import { Router } from "express";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { getSupabase } from "../db/supabase.js";
import { renderReportPdf } from "../services/reportPdf.js";
import {
  getPipelineReport,
  getForecastReport,
  getMonthlyTrends,
  getFunnelReport,
  getLeadsReport,
  getPerformanceReport,
  getOperatorsReport,
  getSummaryReport,
  getTimelineReport,
  getSegmentsReport,
  getCitiesReport,
  getOriginReport,
  getIntelligenceReport,
  getConsolidatedReport,
  buildReportCsv,
  type ReportFilters
} from "../services/reports.js";

const router = Router();
async function logReportDownload(workspaceId: string, userId: string | undefined, fileName: string, metadata: Record<string, unknown>) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("download_logs").insert({
    workspace_id: workspaceId,
    user_id: userId || null,
    file_type: "report_pdf",
    file_name: fileName,
    metadata
  });
}

function reportFiltersFromRequest(req: any, source: Record<string, unknown> = req.query): ReportFilters {
  const session = req.session || {};
  return {
    period: typeof source.period === "string" ? source.period : typeof req.query.period === "string" ? req.query.period : "30d",
    groupBy: typeof source.groupBy === "string" ? source.groupBy : typeof source.group_by === "string" ? source.group_by : typeof req.query.group_by === "string" ? req.query.group_by : "day",
    operatorId: typeof source.operator_id === "string" ? source.operator_id : typeof source.operatorId === "string" ? source.operatorId : "",
    companyId: typeof source.company_id === "string" ? source.company_id : typeof source.companyId === "string" ? source.companyId : "",
    status: typeof source.status === "string" ? source.status : "",
    source: typeof source.source === "string" ? source.source : "",
    role: session.role || "viewer",
    userId: session.userId || ""
  };
}

router.get("/dashboard", async (req, res, next) => {
  try {
    res.json(await getConsolidatedReport(getRequestWorkspaceId(req), reportFiltersFromRequest(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/export.csv", async (req: any, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const filters = reportFiltersFromRequest(req);
    const report = await getConsolidatedReport(workspaceId, filters);
    const csv = buildReportCsv(report);
    const fileName = `relatorio-nodere-${report.filters.period}-${Date.now()}.csv`;
    await logReportDownload(workspaceId, req.session?.userId || req.admin?.userId, fileName, { ...report.filters, format: "csv" }).catch(() => undefined);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
});


router.get("/pipeline", async (req, res, next) => {
  try {
    res.json(await getPipelineReport(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/summary", async (req, res, next) => {
  try {
    res.json(await getSummaryReport(getRequestWorkspaceId(req), String(req.query.period || "30d")));
  } catch (error) {
    next(error);
  }
});

router.get("/executive", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const period = String(req.query.period || "30d");
    const groupBy = String(req.query.group_by || "day");
    const [summary, funnel, timeline, origin, intelligence, operators, proposals] = await Promise.all([
      getSummaryReport(workspaceId, period),
      getFunnelReport(workspaceId),
      getTimelineReport(workspaceId, period, groupBy),
      getOriginReport(workspaceId, period),
      getIntelligenceReport(workspaceId, period),
      getOperatorsReport(workspaceId),
      getProposalReport(workspaceId, period)
    ]);

    res.json({
      period,
      leads: {
        total_leads: summary.total_leads_in_crm,
        new_leads: summary.new_this_period,
        avg_score: summary.avg_score,
        conversion_rate: summary.conversion_rate,
        pipeline_value: proposals.pipeline_value,
        total_won_value: proposals.accepted_value
      },
      activities: [
        { type: "crm", count: summary.total_leads_in_crm },
        { type: "credits", count: summary.credits_used }
      ],
      proposals: proposals.by_status,
      funnel: funnel.stages,
      timeline: timeline.data,
      origin: origin.origins,
      intelligence,
      operators
    });
  } catch (error) {
    next(error);
  }
});

router.get("/forecast", async (req, res, next) => {
  try {
    res.json(await getForecastReport(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/trends", async (req, res, next) => {
  try {
    res.json(await getMonthlyTrends(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/funnel", async (req, res, next) => {
  try {
    res.json(await getFunnelReport(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/timeline", async (req, res, next) => {
  try {
    res.json(await getTimelineReport(getRequestWorkspaceId(req), String(req.query.period || "30d"), String(req.query.group_by || "day")));
  } catch (error) {
    next(error);
  }
});

router.get("/segments", async (req, res, next) => {
  try {
    res.json(await getSegmentsReport(getRequestWorkspaceId(req), String(req.query.period || "30d")));
  } catch (error) {
    next(error);
  }
});

router.get("/cities", async (req, res, next) => {
  try {
    res.json(await getCitiesReport(getRequestWorkspaceId(req), String(req.query.period || "30d")));
  } catch (error) {
    next(error);
  }
});

router.get("/origin", async (req, res, next) => {
  try {
    res.json(await getOriginReport(getRequestWorkspaceId(req), String(req.query.period || "30d")));
  } catch (error) {
    next(error);
  }
});

router.get("/intelligence", async (req, res, next) => {
  try {
    res.json(await getIntelligenceReport(getRequestWorkspaceId(req), String(req.query.period || "30d")));
  } catch (error) {
    next(error);
  }
});

router.get("/leads", async (req, res, next) => {
  try {
    const period = typeof req.query.period === "string" ? req.query.period : "30d";
    res.json(await getLeadsReport(getRequestWorkspaceId(req), period));
  } catch (error) {
    next(error);
  }
});

router.get("/performance", async (req, res, next) => {
  try {
    res.json(await getPerformanceReport(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/operators", async (req, res, next) => {
  try {
    res.json(await getOperatorsReport(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/proposals", async (req, res, next) => {
  try {
    res.json(await getProposalReport(getRequestWorkspaceId(req), String(req.query.period || "30d")));
  } catch (error) {
    next(error);
  }
});


router.post("/pdf", async (req: any, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const filters = reportFiltersFromRequest(req, req.body || {});
    const report = await getConsolidatedReport(workspaceId, filters);

    const fileName = `relatorio-nodere-${Date.now()}.pdf`;
    const generatedAt = new Date();
    const pdf = await renderReportPdf(report, generatedAt);
    await logReportDownload(workspaceId, req.session?.userId || req.admin?.userId, fileName, {
      ...report.filters,
      totalCompanies: report.metrics.total_companies,
      generatedAt: generatedAt.toISOString()
    }).catch(() => undefined);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

function periodToDays(period: string) {
  if (period === "7d") return 7;
  if (period === "90d") return 90;
  if (period === "12m") return 365;
  return 30;
}

async function getProposalReport(workspaceId: string, period: string) {
  const sb = getSupabase();
  if (!sb) return { by_status: [], pipeline_value: 0, accepted_value: 0 };
  const since = new Date(Date.now() - periodToDays(period) * 86400000).toISOString();
  const { data, error } = await sb
    .from("nodere_proposals")
    .select("status,total,created_at")
    .eq("workspace_id", workspaceId)
    .gte("created_at", since);
  if (error) {
    return { by_status: [], pipeline_value: 0, accepted_value: 0, warning: "Tabela nodere_proposals ainda não disponível." };
  }
  const rows = data || [];
  const grouped = new Map<string, { status: string; count: number; value: number }>();
  rows.forEach((row: any) => {
    const status = String(row.status || "draft");
    const value = Number(row.total || 0);
    const current = grouped.get(status) || { status, count: 0, value: 0 };
    current.count += 1;
    current.value += value;
    grouped.set(status, current);
  });
  return {
    by_status: Array.from(grouped.values()),
    pipeline_value: rows.reduce((sum: number, row: any) => sum + Number(row.total || 0), 0),
    accepted_value: rows.filter((row: any) => row.status === "accepted").reduce((sum: number, row: any) => sum + Number(row.total || 0), 0)
  };
}

export default router;
