import assert from "node:assert/strict";
import test from "node:test";
import { classifyAiProviderError } from "../services/aiProviderErrors.js";

test("classifica quota do provedor sem confundir com créditos internos", () => {
  const actual = classifyAiProviderError(Object.assign(
    new Error("You exceeded your current quota; code=insufficient_quota"),
    { statusCode: 429 }
  ));

  assert.equal(actual.code, "AI_PROVIDER_QUOTA_EXHAUSTED");
  assert.equal(actual.status, 402);
  assert.match(actual.message, /créditos internos da NODERE não foram consumidos/i);
});

test("classifica rate limit temporário separadamente", () => {
  const actual = classifyAiProviderError({
    statusCode: 429,
    responseBody: JSON.stringify({ error: { code: "rate_limit_exceeded" } })
  });

  assert.equal(actual.code, "AI_PROVIDER_RATE_LIMITED");
  assert.equal(actual.retryable, true);
});

test("classifica autenticação e acesso ao modelo", () => {
  assert.equal(classifyAiProviderError({ status: 401, code: "invalid_api_key" }).code, "AI_PROVIDER_AUTH_FAILED");
  assert.equal(classifyAiProviderError({ status: 403, code: "model_not_found" }).code, "AI_MODEL_ACCESS_DENIED");
});
