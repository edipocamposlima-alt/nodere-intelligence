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
  getIntelligenceReport
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


router.post("/pdf", async (req: any, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const period = typeof req.body?.period === "string" ? req.body.period : String(req.query.period || "30d");
    const groupBy = typeof req.body?.groupBy === "string" ? req.body.groupBy : String(req.query.group_by || "day");
    const [summary, funnel, segments, timeline, operators, intelligence] = await Promise.all([
      getSummaryReport(workspaceId, period),
      getFunnelReport(workspaceId),
      getSegmentsReport(workspaceId, period),
      getTimelineReport(workspaceId, period, groupBy),
      getOperatorsReport(workspaceId),
      getIntelligenceReport(workspaceId, period)
    ]);

    const fileName = `relatorio-nodere-${Date.now()}.pdf`;
    const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true, info: { Title: "Relatorio NODERE", Author: "NODERE Nexus" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", async () => {
      await logReportDownload(workspaceId, req.session?.userId || req.admin?.userId, fileName, {
        period,
        groupBy,
        totalCompanies: summary.total_companies,
        generatedAt: new Date().toISOString()
      }).catch(() => undefined);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
      res.send(Buffer.concat(chunks));
    });

    const logoCandidates = [
      path.resolve(process.cwd(), "../web/public/logo-nodere-full.png"),
      path.resolve(process.cwd(), "../web/public/brand-logo-official.png"),
      path.resolve(process.cwd(), "apps/web/public/logo-nodere-full.png"),
      path.resolve(process.cwd(), "apps/web/public/brand-logo-official.png"),
      path.resolve(process.cwd(), "public/logo-nodere-full.png"),
      path.resolve(process.cwd(), "public/brand-logo-official.png")
    ];
    const logoPath = logoCandidates.find((candidate) => fs.existsSync(candidate));

    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#FFFFFF");
    doc.roundedRect(42, 28, doc.page.width - 84, 72, 12).strokeColor("#D9E4DF").lineWidth(1).stroke();
    if (logoPath) {
      doc.image(logoPath, 56, 39, { width: 150 });
    } else {
      doc.fillColor("#03624C").fontSize(22).text("NODERE", 56, 42);
    }
    doc.fillColor("#334155").fontSize(9).text("Relatorio comercial gerado pelo NODERE Nexus", 56, 78);
    doc.fillColor("#03624C").fontSize(11).text(`Periodo: ${period}`, 420, 42, { align: "right" });
    doc.fillColor("#64748B").fontSize(8).text(new Date().toLocaleString("pt-BR"), 420, 62, { align: "right" });

    doc.y = 140;
    doc.fillColor("#0A0F1E").fontSize(18).text("Resumo executivo");
    doc.moveDown(0.8);
    writeMetric(doc, "Empresas no CRM", summary.total_companies);
    writeMetric(doc, "Score medio", summary.avg_score);
    writeMetric(doc, "Conversao", `${summary.conversion_rate}%`);
    doc.x = 42;
    doc.y += 78;
    writeMetric(doc, "Novos no periodo", summary.new_this_period);
    writeMetric(doc, "Com site", `${intelligence.pct_with_site}%`);
    writeMetric(doc, "Com WhatsApp", `${intelligence.pct_with_whatsapp}%`);

    doc.x = 42;
    doc.y += 88;
    doc.fillColor("#0A0F1E").fontSize(15).text("Funil comercial");
    doc.moveDown(0.5);
    funnel.stages.forEach((stage) => {
      doc.fillColor("#1E293B").fontSize(10).text(`${stage.name}: ${stage.count} lead(s) - ${stage.pct_of_total}% do total`);
    });

    doc.moveDown(1);
    doc.fillColor("#0A0F1E").fontSize(15).text("Segmentos principais");
    doc.moveDown(0.5);
    segments.segments.slice(0, 8).forEach((segment) => {
      doc.fillColor("#1E293B").fontSize(10).text(`${segment.segment}: ${segment.count} empresa(s), score medio ${segment.avg_score}`);
    });

    if (doc.y > 650) doc.addPage();
    doc.moveDown(1);
    doc.fillColor("#0A0F1E").fontSize(15).text("Linha do tempo");
    doc.moveDown(0.5);
    timeline.data.slice(-12).forEach((point) => {
      doc.fillColor("#1E293B").fontSize(10).text(`${point.date}: ${point.count} novo(s) lead(s)`);
    });

    doc.moveDown(1);
    doc.fillColor("#0A0F1E").fontSize(15).text("Operadores");
    doc.moveDown(0.5);
    operators.slice(0, 12).forEach((operator) => {
      doc.fillColor("#1E293B").fontSize(10).text(`${operator.name} (${operator.role}): ${operator.leads_created} lead(s), ${operator.followups_done} atividade(s), ${operator.leads_closed} fechado(s)`);
    });

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i += 1) {
      doc.switchToPage(i);
      doc.fillColor("#64748B").fontSize(8).text(`NODERE Nexus - pagina ${i + 1}/${pages.count}`, 42, doc.page.height - 38, { align: "center" });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
});

export default router;
