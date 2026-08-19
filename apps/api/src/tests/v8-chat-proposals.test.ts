import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { normalizedScore } from "../services/reports.js";

const repositoryRoot = path.resolve(process.cwd(), "../..");
const read = (relative: string) => fs.readFileSync(path.join(repositoryRoot, relative), "utf8");

test("histórico da NODERE AI usa arquivamento reversível e isolamento por workspace", () => {
  const repository = read("apps/api/src/services/aiRepository.ts");
  const route = read("apps/api/src/routes/ai.ts");
  assert.match(repository, /\.eq\("workspace_id", workspaceId\)/);
  assert.match(repository, /\.eq\("status", status\)/);
  assert.match(repository, /setAiConversationStatus/);
  assert.match(route, /router\.patch\("\/conversations\/:id\/status"/);
  assert.doesNotMatch(route, /router\.delete\("\/conversations/);
});

test("modelos de proposta preenchem rascunho sem persistir ou gerar documento", () => {
  const page = read("apps/web/app/app/proposals/page.tsx");
  const start = page.indexOf("function applyTemplate()");
  const end = page.indexOf("function startNewVersion", start);
  const handler = page.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(handler, /setCustomerNotes\(templateDraft/);
  assert.doesNotMatch(handler, /createProposal|downloadProposalPdf|downloadContractPdf|generateProposal/);
});

test("proposta exige cliente, item real e motivo de nova versão", () => {
  const page = read("apps/web/app/app/proposals/page.tsx");
  assert.match(page, /if \(!leadId\)/);
  assert.match(page, /if \(!selectedRows\.length\)/);
  assert.match(page, /documentGroupId && !changeReason\.trim\(\)/);
  assert.match(page, /max_discount_pct/);
});

test("relatórios limitam scores corrompidos à escala zero a cem", () => {
  assert.equal(normalizedScore({ score: 1000 } as never), 100);
  assert.equal(normalizedScore({ score: -12 } as never), 0);
  assert.equal(normalizedScore({ score: 73 } as never), 73);
});

test("arquivos da Ficha 360 usam download assinado, checksum e lixeira reversível", () => {
  const route = read("apps/api/src/routes/companies.ts");
  const start = route.indexOf('router.delete("/:id/files/:fileId"');
  const end = route.indexOf('router.post("/:id/analyze"', start);
  const lifecycle = route.slice(start, end);
  assert.match(route, /createSignedUrl\(String\(data\.storage_path\), 60\)/);
  assert.match(route, /createHash\("sha256"\)/);
  assert.match(lifecycle, /deleted_at:/);
  assert.doesNotMatch(lifecycle, /storage\.from\("client-files"\)\.remove|\.delete\(\)/);
  assert.match(route, /\/:fileId\/restore/);
});

test("pesquisa pública bloqueia SSRF e valida cada redirecionamento", () => {
  const research = read("apps/api/src/services/publicResearch.ts");
  assert.match(research, /lookup\(url\.hostname/);
  assert.match(research, /isPrivateAddress/);
  assert.match(research, /redirect: "manual"/);
  assert.match(research, /await assertPublicTarget\(current\)/);
  assert.match(research, /metadata\.google\.internal/);
});
