import { randomUUID } from "node:crypto";
import { Operator, OperatorMetrics, OperatorGoal } from "../types.js";
import { appendAuditLog } from "./auditLog.js";
import { getSupabase } from "../db/supabase.js";

const operators: Array<Operator & { workspaceId?: string }> = [];

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

export async function getOperators(workspaceId = "default") {
  const supabase = getSupabase();
  if (supabase) {
    let query = supabase.from("nodere_operators").select("*");
    query = query.eq("workspace_id", workspaceId);
    const { data, error } = await query.order("created_at", { ascending: true });
    if (!error && Array.isArray(data) && data.length) {
      return data.map(rowToOperator);
    }
  }
  return operators.filter((op) => (op.workspaceId ?? "default") === workspaceId);
}

export async function addOperator(name: string, email: string, role: "admin" | "operator" = "operator", workspaceId = "default"): Promise<Operator> {
  const op: Operator & { workspaceId?: string } = { id: randomUUID(), name, email, role, workspaceId, createdAt: new Date().toISOString() };
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("nodere_operators").upsert({
      id: op.id,
      workspace_id: workspaceId,
      name: op.name,
      email: op.email,
      role: op.role,
      created_at: op.createdAt
    });
  }
  operators.push(op);
  appendAuditLog("user", "operator_created", `Operador ${name} criado`, { metadata: { email, role } });
  return op;
}

export async function getOperatorRanking(workspaceId = "default"): Promise<OperatorMetrics[]> {
  const companies = await import("./companyStore.js").then((m) => m.listCompaniesAsync(workspaceId));
  const activeOperators = await getOperators(workspaceId);
  return activeOperators.map((op) => {
    const slice = companies.filter((company) => (company as any).operatorId === op.id || (company as any).ownerId === op.id);
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
      searchesDone: slice.length,
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

export async function getGoals(operatorId: string, workspaceId = "default"): Promise<OperatorGoal | null> {
  const month = new Date().toISOString().slice(0, 7);
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("nodere_operator_goals")
      .select("*")
      .eq("operator_id", operatorId)
      .eq("workspace_id", workspaceId)
      .eq("month", month)
      .maybeSingle();
    if (!error && data) return rowToGoal(data);
  }
  return goals.find((g) => g.operatorId === operatorId && g.month === month && (g as any).workspaceId === workspaceId) ?? null;
}

export async function setGoals(input: Omit<OperatorGoal, "month">, workspaceId = "default"): Promise<OperatorGoal> {
  const month = new Date().toISOString().slice(0, 7);
  const full: OperatorGoal & { workspaceId?: string } = { ...input, month, workspaceId };
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("nodere_operator_goals").upsert({
      workspace_id: workspaceId,
      operator_id: input.operatorId,
      month,
      target_searches: input.targetSearches,
      target_contacts: input.targetContacts,
      target_deals: input.targetDeals,
      target_revenue_brl: input.targetRevenueBRL
    });
  }
  const idx = goals.findIndex((g) => g.operatorId === input.operatorId && g.month === month && (g as any).workspaceId === workspaceId);
  if (idx >= 0) goals[idx] = full;
  else goals.push(full);
  appendAuditLog("user", "goals_updated", `Metas atualizadas para operador ${input.operatorId}`, {
    operatorId: input.operatorId,
    metadata: { ...input }
  });
  return full;
}

function rowToOperator(row: any): Operator {
  return {
    id: String(row.id),
    name: String(row.name ?? "Operador"),
    email: String(row.email ?? ""),
    role: row.role === "admin" ? "admin" : "operator",
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString())
  };
}

function rowToGoal(row: any): OperatorGoal {
  return {
    operatorId: String(row.operator_id ?? row.operatorId),
    month: String(row.month),
    targetSearches: Number(row.target_searches ?? row.targetSearches ?? 20),
    targetContacts: Number(row.target_contacts ?? row.targetContacts ?? 15),
    targetDeals: Number(row.target_deals ?? row.targetDeals ?? 3),
    targetRevenueBRL: Number(row.target_revenue_brl ?? row.targetRevenueBRL ?? 36000)
  };
}
