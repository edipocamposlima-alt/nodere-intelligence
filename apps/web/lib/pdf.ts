import { jsPDF } from "jspdf";

const LOGO_CANDIDATES = ["/logo-noderi-full.png", "/nodere-wordmark.png", "/nodere-logo.png", "/nodere-logo-192.png"];

async function getNoderiLogoBase64() {
  if (typeof window === "undefined") return null;
  for (const candidate of LOGO_CANDIDATES) {
    try {
      const response = await fetch(candidate, { cache: "force-cache" });
      if (!response.ok) continue;
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      // Try next logo candidate.
    }
  }
  console.error("[PDF] Logo file not found. Checked:", LOGO_CANDIDATES);
  return null;
}

function formatPdfDate(value = new Date()) {
  return value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).replace(",", " às");
}

function stripMarkdown(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function addHeaderFooter(doc: jsPDF, title: string, logoBase64: string | null) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", 12, 8, 40, 16, undefined, "FAST");
      } catch {
        doc.setFillColor(3, 98, 76);
        doc.roundedRect(12, 9, 16, 16, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("N", 18, 20, { align: "center" });
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(3, 98, 76);
    doc.text(title, 105, 16, { align: "center", maxWidth: 118 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text(formatPdfDate(), 198, 16, { align: "right" });

    doc.setDrawColor(229, 231, 235);
    doc.line(12, 28, 198, 28);
    doc.line(12, 278, 198, 278);
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text("Gerado pelo NODERI Nexus · nodere.com.br", 12, 285);
    doc.text(`Página ${page} de ${pages}`, 198, 285, { align: "right" });
  }
}

export async function downloadNoderiPdf({ title, subtitle, body, fileName }: { title: string; subtitle?: string; body: string; fileName?: string }) {
  const logoBase64 = await getNoderiLogoBase64();
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const cleanBody = stripMarkdown(body);
  const lines = doc.splitTextToSize(cleanBody || "Sem conteúdo.", 176);
  let y = 44;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text(title, 12, 38, { maxWidth: 182 });
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(subtitle, 12, 44, { maxWidth: 182 });
    y = 52;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  for (const line of lines) {
    if (y > 268) {
      doc.addPage();
      y = 38;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
    }
    doc.text(line, 12, y);
    y += 5.2;
  }

  await addHeaderFooter(doc, title, logoBase64);
  doc.save(fileName || `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.pdf`);
}

