import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

type ReportPdfInput = {
  filters: { period: string };
  metrics: {
    leads_created: number;
    leads_converted: number;
    conversion_rate: number;
    open_opportunities: number;
    deals_won: number;
    deals_lost: number;
    activities_done: number;
    avg_score: number;
    pipeline_value: number;
  };
  funnel: Array<{ name: string; count: number; pct_of_total: number }>;
  segments: Array<{ segment: string; count: number; avg_score: number }>;
  timeline: Array<{ date: string; count: number }>;
  operators: Array<{
    name: string;
    role?: string;
    leads_created: number;
    followups_done: number;
    leads_closed: number;
  }>;
};

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

export function renderReportPdf(report: ReportPdfInput, generatedAt = new Date()): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 42,
      bufferPages: true,
      info: { Title: "Relatorio NODERE", Author: "NODERE" }
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

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
    doc.fillColor("#64748B").fontSize(8).text(generatedAt.toLocaleString("pt-BR"), 420, 62, { align: "right" });

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
      doc.fillColor("#1E293B").fontSize(10).text(
        `${operator.name} (${operator.role || "viewer"}): ${operator.leads_created} lead(s), ${operator.followups_done} atividade(s), ${operator.leads_closed} fechado(s)`
      );
    });

    const pages = doc.bufferedPageRange();
    for (let index = 0; index < pages.count; index += 1) {
      doc.switchToPage(index);
      doc.fillColor("#64748B").fontSize(8).text(
        `NODERE - pagina ${index + 1}/${pages.count}`,
        42,
        doc.page.height - 38,
        { align: "center" }
      );
    }
    doc.end();
  });
}
