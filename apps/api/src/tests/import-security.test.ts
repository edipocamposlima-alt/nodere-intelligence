import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ExcelJS from "exceljs";
import { parseImportFile } from "../routes/companies.js";

describe("importação segura de planilhas", () => {
  it("lê a primeira planilha XLSX sem depender do pacote vulnerável xlsx", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Leads");
    sheet.addRow(["name", "city", "score"]);
    sheet.addRow(["Empresa Teste", "Goiânia", 82]);
    const payload = await workbook.xlsx.writeBuffer();

    const rows = await parseImportFile(Buffer.from(payload), "leads.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    assert.deepEqual(rows, [
      ["name", "city", "score"],
      ["Empresa Teste", "Goiânia", "82"]
    ]);
  });

  it("recusa o formato binário XLS legado", async () => {
    await assert.rejects(
      () => parseImportFile(Buffer.from("arquivo"), "leads.xls", "application/vnd.ms-excel"),
      (error: Error & { status?: number }) => error.status === 415
    );
  });

  it("recusa planilhas compactadas acima do limite seguro", async () => {
    const oversized = Buffer.alloc(8 * 1024 * 1024 + 1);
    await assert.rejects(
      () => parseImportFile(oversized, "leads.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
      (error: Error & { status?: number }) => error.status === 413
    );
  });

  it("aplica o limite de registros também a arquivos CSV", async () => {
    const oversizedCsv = Buffer.from(["name,city", ...Array.from({ length: 5001 }, (_, index) => `Empresa ${index},Goiânia`)].join("\n"));
    await assert.rejects(
      () => parseImportFile(oversizedCsv, "leads.csv", "text/csv"),
      (error: Error & { status?: number }) => error.status === 413
    );
  });
});
