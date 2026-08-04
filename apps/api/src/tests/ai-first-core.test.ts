import assert from "node:assert/strict";
import test from "node:test";
import type { LanguageModelUsage } from "ai";
import { buildAiTools, buildToolIdempotencyKey } from "../services/aiTools.js";
import { calculateActualCost, estimateReservationCredit } from "../services/creditLedger.js";
import {
  isModelAllowedForAgent,
  isModelAllowedForRole,
  type AiAgentRecord,
  type AiModelRecord
} from "../services/aiRegistry.js";

const model: AiModelRecord = {
  id: "openai:gpt-5.6-terra",
  provider: "openai",
  providerModelId: "gpt-5.6-terra",
  label: "GPT-5.6 Terra",
  capabilityTier: "balanced",
  inputCostUsdPerMillion: 2.5,
  cachedInputCostUsdPerMillion: 0.25,
  outputCostUsdPerMillion: 15,
  reasoningEffort: "medium",
  allowedRoles: ["owner", "admin", "operator", "viewer"],
  enabled: true,
  providerAvailable: true,
  availabilityCheckedAt: new Date().toISOString(),
  supportsResponses: true,
  supportsTools: true,
  supportsWebSearch: false,
  supportsAudio: false,
  rateLimitProfile: {},
  discoverySource: "test",
  availabilityError: null
};

const agent: AiAgentRecord = {
  id: "test-agent",
  workspaceId: null,
  label: "Test",
  description: "Test",
  systemPrompt: "Test",
  defaultModelId: model.id,
  allowedModelIds: [model.id],
  allowedTools: ["list_companies", "get_company", "create_company", "update_pipeline_stage"],
  enabled: true
};

test("reserva de IA cobre um uso normal dentro do teto configurado", () => {
  const reservation = estimateReservationCredit({
    messagesJson: JSON.stringify([{ role: "user", parts: [{ type: "text", text: "Analise o pipeline" }] }]),
    model,
    creditsPerUsd: 100
  });
  const usage: LanguageModelUsage = {
    inputTokens: 500,
    inputTokenDetails: { noCacheTokens: 500, cacheReadTokens: 0, cacheWriteTokens: 0 },
    outputTokens: 800,
    outputTokenDetails: { textTokens: 800, reasoningTokens: 0 },
    totalTokens: 1300,
    raw: undefined
  };
  const actual = calculateActualCost(model, usage, 100);
  assert.ok(reservation > actual.chargedCredit);
  assert.equal(actual.providerCostUsd, 0.01325);
  assert.equal(actual.chargedCredit, 1.325);
});

test("leitura de cache usa o preço descontado do registro", () => {
  const usage: LanguageModelUsage = {
    inputTokens: 1000,
    inputTokenDetails: { noCacheTokens: 100, cacheReadTokens: 900, cacheWriteTokens: 0 },
    outputTokens: 0,
    outputTokenDetails: { textTokens: 0, reasoningTokens: 0 },
    totalTokens: 1000,
    raw: undefined
  };
  const actual = calculateActualCost(model, usage, 100);
  assert.equal(actual.providerCostUsd, 0.000475);
  assert.equal(actual.cachedInputTokens, 900);
});

test("viewer recebe apenas ferramentas de leitura", () => {
  const tools = buildAiTools({
    workspaceId: "workspace-a",
    executionId: "00000000-0000-0000-0000-000000000001",
    conversationId: "00000000-0000-0000-0000-000000000002",
    session: { role: "viewer", userId: "viewer-1" },
    agent
  });
  assert.deepEqual(Object.keys(tools).sort(), ["get_company", "list_companies"]);
});

test("operador recebe mutações protegidas por aprovação", () => {
  const tools = buildAiTools({
    workspaceId: "workspace-a",
    executionId: "00000000-0000-0000-0000-000000000001",
    conversationId: "00000000-0000-0000-0000-000000000002",
    session: { role: "operator", userId: "operator-1" },
    agent
  });
  assert.equal(tools.create_company?.needsApproval, true);
  assert.equal(tools.update_pipeline_stage?.needsApproval, true);
});

test("registry aplica limites de perfil e de agente", () => {
  const frontier = { ...model, id: "openai:gpt-5.6-sol", allowedRoles: ["owner", "admin", "operator"] };
  assert.equal(isModelAllowedForRole(frontier, "viewer"), false);
  assert.equal(isModelAllowedForRole(frontier, "operator"), true);
  assert.equal(isModelAllowedForAgent(frontier.id, [model.id]), false);
  assert.equal(isModelAllowedForAgent(model.id, [model.id]), true);
});

test("idempotência de ferramenta é estável entre execuções da mesma conversa", () => {
  const key = buildToolIdempotencyKey("conversation-1", "tool-call-1");
  assert.equal(key, "ai:conversation:conversation-1:tool:tool-call-1");
  assert.equal(buildToolIdempotencyKey("conversation-1", "tool-call-1"), key);
  assert.notEqual(buildToolIdempotencyKey("conversation-2", "tool-call-1"), key);
});
