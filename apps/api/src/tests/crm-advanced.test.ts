import assert from "node:assert/strict";
import test from "node:test";
import { inferProbability, inferTemperature } from "../services/companyStore.js";

test("probabilidade comercial padrao por etapa", () => {
  assert.equal(inferProbability("Novo Lead"), 5);
  assert.equal(inferProbability("Qualificado"), 12);
  assert.equal(inferProbability("Contatado"), 20);
  assert.equal(inferProbability("Diagnóstico enviado"), 30);
  assert.equal(inferProbability("Reunião marcada"), 45);
  assert.equal(inferProbability("Proposta enviada"), 60);
  assert.equal(inferProbability("Negociação"), 72);
  assert.equal(inferProbability("Fechado"), 100);
  assert.equal(inferProbability("Perdido"), 0);
});

test("temperatura comercial acompanha maturidade da etapa", () => {
  assert.equal(inferTemperature("Novo Lead"), "Frio");
  assert.equal(inferTemperature("Contatado"), "Morno");
  assert.equal(inferTemperature("Proposta enviada"), "Quente");
});

