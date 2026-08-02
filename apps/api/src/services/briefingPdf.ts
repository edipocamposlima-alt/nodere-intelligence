import PDFDocument from "pdfkit";
import { BRIEFING_FIELDS } from "./briefingFields.js";

type BriefingPdfInput = {
  code: string;
  title: string;
  status: string;
  priority: string;
  version: number;
  companyName: string;
  answers: Record<string, unknown>;
  author?: string;
  attachments?: Array<{ original_name?: string; mime_type?: string; size_bytes?: number; sha256?: string }>;
  generatedAt?: Date;
};

const palette = {
  forest: "#07362B",
  green: "#0B4D3B",
  gold: "#C9A03C",
  goldSoft: "#DFC16F",
  mint: "#EAF3EF",
  graphite: "#2D3632"
};

function printable(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined || value === "") return "Não informado";
  return String(value);
}

export async function renderCommercialBriefingPdf(input: BriefingPdfInput) {
  return new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 44, bufferPages: true, info: { Title: `${input.code} - ${input.companyName}` } });
    const chunks: Buffer[] = [];
    document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const pageWidth = document.page.width - 88;
    const ensureSpace = (height = 70) => {
      if (document.y + height > document.page.height - 48) document.addPage();
    };

    document.rect(0, 0, document.page.width, 118).fill(palette.forest);
    document.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(23).text("NODERE", 44, 36);
    document.fillColor(palette.goldSoft).fontSize(10).text("BRIEFING COMERCIAL", 44, 69, { characterSpacing: 1.4 });
    document.fillColor("#FFFFFF").font("Helvetica").fontSize(10).text(`${input.code} · versão ${input.version}`, 44, 91);
    document.y = 140;

    document.fillColor(palette.forest).font("Helvetica-Bold").fontSize(19).text(input.companyName || input.title);
    document.moveDown(0.3);
    document.fillColor(palette.graphite).font("Helvetica").fontSize(9).text(
      `Status: ${input.status}   Prioridade: ${input.priority}   Autor: ${input.author || "NODERE"}   Gerado em: ${(input.generatedAt || new Date()).toLocaleString("pt-BR")}`
    );
    document.moveDown(1.2);

    let currentSection = "";
    for (const field of BRIEFING_FIELDS) {
      const value = input.answers[field.key];
      if (field.section !== currentSection) {
        ensureSpace(56);
        currentSection = field.section;
        document.moveDown(0.7);
        document.roundedRect(44, document.y, pageWidth, 25, 5).fill(palette.mint);
        document.fillColor(palette.green).font("Helvetica-Bold").fontSize(11).text(currentSection, 54, document.y - 18);
        document.moveDown(1.1);
      }
      ensureSpace(46);
      document.fillColor(palette.gold).font("Helvetica-Bold").fontSize(8.5).text(field.label.toUpperCase());
      document.fillColor(palette.graphite).font("Helvetica").fontSize(10.5).text(printable(value), { width: pageWidth, lineGap: 2 });
      document.moveDown(0.55);
    }

    ensureSpace(70);
    document.moveDown(0.7);
    document.roundedRect(44, document.y, pageWidth, 25, 5).fill(palette.mint);
    document.fillColor(palette.green).font("Helvetica-Bold").fontSize(11).text("Anexos", 54, document.y - 18);
    document.moveDown(1.1);
    if (!input.attachments?.length) {
      document.fillColor(palette.graphite).font("Helvetica").fontSize(10).text("Nenhum anexo registrado.");
    } else {
      for (const attachment of input.attachments) {
        ensureSpace(34);
        document.fillColor(palette.gold).font("Helvetica-Bold").fontSize(9).text(attachment.original_name || "Arquivo");
        document.fillColor(palette.graphite).font("Helvetica").fontSize(8.5).text(`${attachment.mime_type || "tipo não informado"} · ${Math.max(1, Math.round(Number(attachment.size_bytes || 0) / 1024))} KB · SHA-256 ${attachment.sha256 || "não informado"}`);
        document.moveDown(0.45);
      }
    }

    const range = document.bufferedPageRange();
    for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
      document.switchToPage(pageIndex);
      document.fillColor(palette.graphite).font("Helvetica").fontSize(8).text(
        `NODERE · ${input.code} · página ${pageIndex + 1} de ${range.count}`,
        44,
        document.page.height - 32,
        { width: pageWidth, align: "center" }
      );
    }
    document.end();
  });
}
