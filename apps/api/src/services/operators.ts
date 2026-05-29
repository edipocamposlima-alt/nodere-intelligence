import { randomUUID } from "node:crypto";
import { Operator, OperatorMetrics, OperatorGoal } from "../types.js";
import { listCompanies } from "./companyStore.js";
import { appendAuditLog } from "./auditLog.js";

const operators: Operator[] = [
  { id: "op-1", name: "Admin", email: "admin@nodere.com", role: "admin", createdAt: new Date().toISOString() },
  { id: "op-2", name: "Operador 1", email: "op1@nodere.com", role: "operator", createdAt: new Date().toISOString() },
  { id: "op-3", name: "Operador 2", email: "op2@nodere.com", role: "operator", createdAt: new Date().toISOString() }
];

const goals: OperatorGoal[] = [];

const STATUS_PIPELINE: Record<string, number> = {
  "Novo Lead": 1000,
  "Contatado": 2500,
  "Em negociação": 5000,
  "Reunião marcada": 7000,
  "Proposta enviada": 10000,
  "Fechado": 0,
  "Perdido": 0
};

export function getOperators() {
  return operators;
}

export function addOperator(name: string, email: string, role: "admin" | "operator" = "operator"): Operator {
  const op: Operator = { id: randomUUID(), name, email, role, createdAt: new Date().toISOString() };
  operators.push(op);
  appendAuditLog("user", "operator_created", `Operador ${name} criado`, { metadata: { email, role } });
  return op;
}

export function getOperatorRanking(): OperatorMetrics[] {
  const companies = listCompanies();
  return operators.map((op, i) => {
    const slice = companies.filter((_, idx) => idx % operators.length === i);
    const contacted = slice.filter((c) => c.status !== "Novo Lead").length;
    const meetings = slice.filter((c) => c.status === "Reunião marcada").length;
    const proposals = slice.filter((c) => c.status === "Proposta enviada").length;
    const closed = slice.filter((c) => c.status === "Fechado").length;
    const lost = slice.filter((c) => c.status === "Perdido").length;
    const pipeline = slice.reduce((sum, c) => sum + (STATUS_PIPELINE[c.status] ?? 0), 0);
    const closedRevenue = closed * 12000;
    const total = contacted + closed + lost;
    const conversionRate = total > 0 ? Math.round((closed / total) * 100) / 100 : 0;

    return {
      operatorId: op.id,
      operatorName: op.name,
      searchesDone: Math.max(0, Math.floor(slice.length / 4) + i * 2),
      leadsEnriched: Math.floor(slice.length * 0.7),
      contactsMade: contacted,
      meetingsScheduled: meetings,
      proposalsSent: proposals,
      dealsClosed: closed,
      dealsLost: lost,
      totalPipelineValue: pipeline,
      totalRevenueClosedBRL: closedRevenue,
      conversionRate
    };
  });
}

export function getGoals(operatorId: string): OperatorGoal | null {
  const month = new Date().toISOString().slice(0, 7);
  return goals.find((g) => g.operatorId === operatorId && g.month === month) ?? null;
}

export function setGoals(input: Omit<OperatorGoal, "month">): OperatorGoal {
  const month = new Date().toISOString().slice(0, 7);
  const full: OperatorGoal = { ...input, month };
  const idx = goals.findIndex((g) => g.operatorId === input.operatorId && g.month === month);
  if (idx >= 0) goals[idx] = full;
  else goals.push(full);
  appendAuditLog("user", "goals_updated", `Metas atualizadas para operador ${input.operatorId}`, {
    operatorId: input.operatorId,
    metadata: { ...input }
  });
  return full;
}
