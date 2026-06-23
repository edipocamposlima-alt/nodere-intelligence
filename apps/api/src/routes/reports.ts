import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { getSupabase } from "../db/supabase.js";
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


function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function writeMetric(doc: PDFKit.PDFDocument, label: string, value: string | number) {
  const x = doc.x;
  const y = doc.y;
  doc.roundedRect(x, y, 165, 62, 10).strokeColor("#D7E6FF").lineWidth(0.7).stroke();
  doc.fillColor("#64748B").fontSize(8).text(label, x + 12, y + 11, { width: 140 });
  doc.fillColor("#0A0F1E").fontSize(20).text(String(value), x + 12, y + 28, { width: 140 });
  doc.x = x + 180;
  doc.y = y;
}

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
    const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true, info: { Title: "Relatorio NODERE", Author: "NODERE" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", async () => {
      await logReportDownload(workspaceId, req.session?.userId || req.admin?.userId, fileName, {
        ...report.filters,
        totalCompanies: report.metrics.total_companies,
        generatedAt: new Date().toISOString()
      }).catch(() => undefined);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
      res.send(Buffer.concat(chunks));
    });

    const logoCandidates = [
      path.resolve(process.cwd(), "../web/public/android-chrome-192x192.png"),
      path.resolve(process.cwd(), "apps/web/public/android-chrome-192x192.png"),
      path.resolve(process.cwd(), "public/android-chrome-192x192.png")
    ];
    const logoPath = logoCandidates.find((candidate) => fs.existsSync(candidate));

    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#FFFFFF");
    doc.roundedRect(42, 28, doc.page.width - 84, 72, 12).strokeColor("#D9E4DF").lineWidth(1).stroke();
    if (logoPath) {
      doc.image(logoPath, 56, 40, { width: 32, height: 32 });
      doc.fillColor("#03624C").fontSize(20).text("NODERE", 96, 46);
    } else {
      doc.fillColor("#03624C").fontSize(22).text("NODERE", 56, 42);
    }
    doc.fillColor("#334155").fontSize(9).text("Relatorio comercial gerado pelo NODERE", 56, 78);
    doc.fillColor("#03624C").fontSize(11).text(`Periodo: ${report.filters.period}`, 420, 42, { align: "right" });
    doc.fillColor("#64748B").fontSize(8).text(new Date().toLocaleString("pt-BR"), 420, 62, { align: "right" });

    doc.y = 140;
    doc.fillColor("#0A0F1E").fontSize(18).text("Resumo executivo");
    doc.moveDown(0.8);
    writeMetric(doc, "Leads criados", report.metrics.leads_created);
    writeMetric(doc, "Convertidos", report.metrics.leads_converted);
    writeMetric(doc, "Conversao", `${report.metrics.conversion_rate}%`);
    doc.x = 42;
    doc.y += 78;
    writeMetric(doc, "Em aberto", report.metrics.open_opportunities);
    writeMetric(doc, "Ganhos", report.metrics.deals_won);
    writeMetric(doc, "Perdidos", report.metrics.deals_lost);

    doc.x = 42;
    doc.y += 78;
    writeMetric(doc, "Atividades", report.metrics.activities_done);
    writeMetric(doc, "Score medio", report.metrics.avg_score);
    writeMetric(doc, "Pipeline", formatBRL(report.metrics.pipeline_value));

    doc.x = 42;
    doc.y += 88;
    doc.fillColor("#0A0F1E").fontSize(15).text("Funil comercial");
    doc.moveDown(0.5);
    report.funnel.forEach((stage) => {
      doc.fillColor("#1E293B").fontSize(10).text(`${stage.name}: ${stage.count} lead(s) - ${stage.pct_of_total}% do total`);
    });

    doc.moveDown(1);
    doc.fillColor("#0A0F1E").fontSize(15).text("Segmentos principais");
    doc.moveDown(0.5);
    report.segments.slice(0, 8).forEach((segment) => {
      doc.fillColor("#1E293B").fontSize(10).text(`${segment.segment}: ${segment.count} empresa(s), score medio ${segment.avg_score}`);
    });

    if (doc.y > 650) doc.addPage();
    doc.moveDown(1);
    doc.fillColor("#0A0F1E").fontSize(15).text("Linha do tempo");
    doc.moveDown(0.5);
    report.timeline.slice(-12).forEach((point) => {
      doc.fillColor("#1E293B").fontSize(10).text(`${point.date}: ${point.count} novo(s) lead(s)`);
    });

    doc.moveDown(1);
    doc.fillColor("#0A0F1E").fontSize(15).text("Operadores");
    doc.moveDown(0.5);
    report.operators.slice(0, 12).forEach((operator) => {
      doc.fillColor("#1E293B").fontSize(10).text(`${operator.name} (${operator.role}): ${operator.leads_created} lead(s), ${operator.followups_done} atividade(s), ${operator.leads_closed} fechado(s)`);
    });

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i += 1) {
      doc.switchToPage(i);
      doc.fillColor("#64748B").fontSize(8).text(`NODERE - pagina ${i + 1}/${pages.count}`, 42, doc.page.height - 38, { align: "center" });
    }

    doc.end();
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
