import assert from "node:assert/strict";
import test from "node:test";
import { buildInboxRow, listWhatsappTemplates, normalizeAttachments, sortInboxChronologically } from "../services/inbox.js";

test("WhatsApp templates cover the required commercial moments", () => {
  const templates = listWhatsappTemplates();
  assert.deepEqual(templates.map((item) => item.key), [
    "primeira_abordagem",
    "follow_up",
    "agendamento",
    "apresentacao",
    "proposta",
    "recuperacao_oportunidade",
    "pos_venda"
  ]);
  assert.ok(templates.every((item) => item.body.length > 40));
});

test("inbox row stores structured WhatsApp metadata and attachments", () => {
  const row = buildInboxRow({
    workspaceId: "workspace-1",
    companyId: "company-1",
    type: "whatsapp",
    direction: "outbound",
    body: "Mensagem enviada ao lead",
    phoneTo: "559999999999",
    templateKey: "follow_up",
    providerMessageId: "wamid.123",
    attachments: [{ name: "Proposta", url: "https://example.com/proposta.pdf" }]
  });

  assert.equal(row.workspace_id, "workspace-1");
  assert.equal(row.company_id, "company-1");
  assert.equal(row.type, "whatsapp");
  assert.equal(row.direction, "outbound");
  assert.equal(row.status, "read");
  assert.equal(row.metadata.providerMessageId, "wamid.123");
  assert.equal(row.metadata.templateKey, "follow_up");
  assert.deepEqual(row.metadata.attachments, [{ name: "Proposta", url: "https://example.com/proposta.pdf" }]);
});

test("inbound WhatsApp row defaults to unread", () => {
  const row = buildInboxRow({
    workspaceId: "workspace-1",
    body: "Mensagem recebida",
    direction: "inbound",
    phoneFrom: "559999999999"
  });

  assert.equal(row.status, "unread");
  assert.equal(row.phone_from, "559999999999");
});

test("attachments are normalized and invalid rows are ignored", () => {
  const attachments = normalizeAttachments([
    { name: "Contrato", url: "https://example.com/contrato.pdf", size: "42" },
    { name: "", url: "https://example.com/invalido.pdf" },
    { name: "Sem URL" }
  ]);

  assert.deepEqual(attachments, [{ name: "Contrato", url: "https://example.com/contrato.pdf", size: 42 }]);
});

test("timeline is sorted chronologically", () => {
  const sorted = sortInboxChronologically([
    { id: "2", sent_at: "2026-06-23T12:00:00.000Z" },
    { id: "1", sent_at: "2026-06-23T10:00:00.000Z" },
    { id: "3", sent_at: "2026-06-23T14:00:00.000Z" }
  ]);

  assert.deepEqual(sorted.map((item) => item.id), ["1", "2", "3"]);
});
