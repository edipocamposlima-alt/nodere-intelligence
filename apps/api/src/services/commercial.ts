import { z } from "zod";
import { getSupabase } from "../db/supabase.js";
import {
  CommercialCatalogItem,
  CommercialProposal,
  CommercialProposalAuditLog,
  CommercialProposalItem,
  CommercialProposalStatus,
  ProposalItemSnapshot
} from "../types.js";

export type AuthUserContext = {
  id: string;
  workspace_id: string;
  role: string;
};

const catalogPayload = z.object({
  type: z.enum(["product", "service"]),
  name: z.string().min(2),
  description: z.string().optional(),
  unit: z.string().min(1).default("un"),
  unitPriceCents: z.number().int().min(0),
  active: z.boolean().optional()
});

const proposalItemPayload = z.object({
  catalogItemId: z.string().uuid(),
  quantity: z.number().positive().default(1)
});

const proposalBasePayload = z.object({
  companyId: z.string().optional(),
  title: z.string().min(2).default("Proposta comercial"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "cancelled"]).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountValueCents: z.number().int().min(0).optional(),
  discountReason: z.string().optional(),
  items: z.array(proposalItemPayload).min(1)
});

function validateDiscount(
  value: { discountPercent?: number; discountValueCents?: number; discountReason?: string },
  ctx: z.RefinementCtx
) {
  if (value.discountPercent != null && value.discountValueCents != null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountPercent"],
      message: "Use desconto por percentual OU por valor."
    });
  }

  const hasDiscount = (value.discountPercent ?? 0) > 0 || (value.discountValueCents ?? 0) > 0;
  if (hasDiscount && !value.discountReason?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountReason"],
      message: "Informe o motivo do desconto."
    });
  }
}

export const proposalPayload = proposalBasePayload.superRefine(validateDiscount);

export const proposalPatchPayload = proposalBasePayload.partial().superRefine(validateDiscount);

function supabaseOrThrow() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
  return supabase;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value !== "") return Number(value);
  return undefined;
}

function fromCatalogRow(row: Record<string, unknown>): CommercialCatalogItem {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    type: row.type as CommercialCatalogItem["type"],
    name: String(row.name),
    description: toOptionalString(row.description),
    unit: String(row.unit ?? "un"),
    unitPriceCents: Number(row.unit_price_cents ?? 0),
    currency: String(row.currency ?? "BRL"),
    active: Boolean(row.active),
    createdBy: toOptionalString(row.created_by),
    updatedBy: toOptionalString(row.updated_by),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function fromSnapshot(raw: Record<string, unknown>): ProposalItemSnapshot {
  return {
    catalogItemId: String(raw.catalog_item_id ?? raw.catalogItemId),
    type: raw.type as ProposalItemSnapshot["type"],
    name: String(raw.name ?? ""),
    description: toOptionalString(raw.description),
    unit: String(raw.unit ?? "un"),
    unitPriceCents: Number(raw.unit_price_cents ?? raw.unitPriceCents ?? 0),
    currency: String(raw.currency ?? "BRL"),
    activeAtSnapshot: Boolean(raw.active_at_snapshot ?? raw.activeAtSnapshot),
    snapshottedAt: String(raw.snapshotted_at ?? raw.snapshottedAt ?? "")
  };
}

function fromProposalItemRow(row: Record<string, unknown>): CommercialProposalItem {
  return {
    id: String(row.id),
    proposalId: String(row.proposal_id),
    catalogItemId: String(row.catalog_item_id),
    itemSnapshot: fromSnapshot((row.item_snapshot as Record<string, unknown>) ?? {}),
    quantity: Number(row.quantity ?? 1),
    unitPriceCents: Number(row.unit_price_cents ?? 0),
    subtotalCents: Number(row.subtotal_cents ?? 0),
    createdAt: String(row.created_at)
  };
}

function fromProposalRow(row: Record<string, unknown>, items: CommercialProposalItem[] = []): CommercialProposal {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    companyId: toOptionalString(row.company_id),
    title: String(row.title ?? "Proposta comercial"),
    status: (row.status as CommercialProposalStatus) ?? "draft",
    subtotalCents: Number(row.subtotal_cents ?? 0),
    discountPercent: toOptionalNumber(row.discount_percent),
    discountValueCents: toOptionalNumber(row.discount_value_cents),
    discountReason: toOptionalString(row.discount_reason),
    totalCents: Number(row.total_cents ?? 0),
    commercialSnapshot: (row.commercial_snapshot as Record<string, unknown>) ?? {},
    createdBy: toOptionalString(row.created_by),
    updatedBy: toOptionalString(row.updated_by),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    items
  };
}

function fromAuditRow(row: Record<string, unknown>): CommercialProposalAuditLog {
  return {
    id: String(row.id),
    proposalId: String(row.proposal_id),
    workspaceId: String(row.workspace_id),
    actorId: toOptionalString(row.actor_id),
    action: String(row.action),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at)
  };
}

async function appendProposalAudit(user: AuthUserContext, proposalId: string, action: string, metadata: Record<string, unknown> = {}) {
  const supabase = supabaseOrThrow();
  const { error } = await supabase.from("nodere_proposal_audit_logs").insert({
    proposal_id: proposalId,
    workspace_id: user.workspace_id,
    actor_id: user.id,
    action,
    metadata
  });
  if (error) throw error;
}

async function assertActiveCatalogItems(user: AuthUserContext, itemIds: string[]) {
  const supabase = supabaseOrThrow();
  const uniqueIds = [...new Set(itemIds)];
  const { data, error } = await supabase
    .from("nodere_commercial_catalog_items")
    .select("id")
    .eq("workspace_id", user.workspace_id)
    .eq("active", true)
    .in("id", uniqueIds);

  if (error) throw error;
  const found = new Set((data ?? []).map((row: Record<string, unknown>) => String(row.id)));
  const missing = uniqueIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    const err = new Error("CATALOG_ITEM_UNAVAILABLE");
    (err as Error & { status?: number }).status = 422;
    throw err;
  }
}

export async function listCatalogItems(user: AuthUserContext, activeOnly = false) {
  const supabase = supabaseOrThrow();
  let query = supabase
    .from("nodere_commercial_catalog_items")
    .select("*")
    .eq("workspace_id", user.workspace_id)
    .order("active", { ascending: false })
    .order("name", { ascending: true });

  if (activeOnly) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(fromCatalogRow);
}

export async function createCatalogItem(user: AuthUserContext, payload: unknown) {
  const supabase = supabaseOrThrow();
  const body = catalogPayload.parse(payload);
  const { data, error } = await supabase
    .from("nodere_commercial_catalog_items")
    .insert({
      workspace_id: user.workspace_id,
      type: body.type,
      name: body.name,
      description: body.description ?? null,
      unit: body.unit,
      unit_price_cents: body.unitPriceCents,
      active: body.active ?? true,
      created_by: user.id,
      updated_by: user.id
    })
    .select("*")
    .single();

  if (error) throw error;
  return fromCatalogRow(data as Record<string, unknown>);
}

export async function updateCatalogItem(user: AuthUserContext, id: string, payload: unknown) {
  const supabase = supabaseOrThrow();
  const body = catalogPayload.partial().parse(payload);
  const updates: Record<string, unknown> = { updated_by: user.id };

  if (body.type !== undefined) updates.type = body.type;
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description || null;
  if (body.unit !== undefined) updates.unit = body.unit;
  if (body.unitPriceCents !== undefined) updates.unit_price_cents = body.unitPriceCents;
  if (body.active !== undefined) updates.active = body.active;

  const { data, error } = await supabase
    .from("nodere_commercial_catalog_items")
    .update(updates)
    .eq("id", id)
    .eq("workspace_id", user.workspace_id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return fromCatalogRow(data as Record<string, unknown>);
}

export async function listProposals(user: AuthUserContext) {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from("nodere_proposals")
    .select("*")
    .eq("workspace_id", user.workspace_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Promise.all(((data ?? []) as Record<string, unknown>[]).map((row) => getProposal(user, String(row.id))));
}

export async function getProposal(user: AuthUserContext, id: string) {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from("nodere_proposals")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", user.workspace_id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: items, error: itemsError } = await supabase
    .from("nodere_proposal_items")
    .select("*")
    .eq("proposal_id", id)
    .order("created_at", { ascending: true });

  if (itemsError) throw itemsError;
  return fromProposalRow(data as Record<string, unknown>, ((items ?? []) as Record<string, unknown>[]).map(fromProposalItemRow));
}

export async function createProposal(user: AuthUserContext, payload: unknown) {
  const supabase = supabaseOrThrow();
  const body = proposalPayload.parse(payload);
  await assertActiveCatalogItems(user, body.items.map((item) => item.catalogItemId));

  const { data, error } = await supabase
    .from("nodere_proposals")
    .insert({
      workspace_id: user.workspace_id,
      company_id: body.companyId ?? null,
      title: body.title,
      status: body.status ?? "draft",
      discount_percent: body.discountPercent ?? null,
      discount_value_cents: body.discountValueCents ?? null,
      discount_reason: body.discountReason?.trim() || null,
      created_by: user.id,
      updated_by: user.id
    })
    .select("id")
    .single();

  if (error) throw error;
  const proposalId = String(data.id);

  const { error: itemsError } = await supabase.from("nodere_proposal_items").insert(
    body.items.map((item) => ({
      proposal_id: proposalId,
      catalog_item_id: item.catalogItemId,
      quantity: item.quantity,
      item_snapshot: {},
      unit_price_cents: 0,
      subtotal_cents: 0
    }))
  );
  if (itemsError) throw itemsError;

  await appendProposalAudit(user, proposalId, "proposal_created", {
    title: body.title,
    itemCount: body.items.length,
    discountMode: body.discountPercent != null ? "percent" : body.discountValueCents != null ? "value" : "none"
  });

  return getProposal(user, proposalId);
}

export async function updateProposal(user: AuthUserContext, id: string, payload: unknown) {
  const supabase = supabaseOrThrow();
  const body = proposalPatchPayload.parse(payload);

  if (body.items) await assertActiveCatalogItems(user, body.items.map((item) => item.catalogItemId));

  const updates: Record<string, unknown> = { updated_by: user.id };
  if (body.companyId !== undefined) updates.company_id = body.companyId || null;
  if (body.title !== undefined) updates.title = body.title;
  if (body.status !== undefined) updates.status = body.status;
  if (body.discountPercent !== undefined) {
    updates.discount_percent = body.discountPercent;
    updates.discount_value_cents = null;
  }
  if (body.discountValueCents !== undefined) {
    updates.discount_value_cents = body.discountValueCents;
    updates.discount_percent = null;
  }
  if (body.discountReason !== undefined) updates.discount_reason = body.discountReason?.trim() || null;

  const { data, error } = await supabase
    .from("nodere_proposals")
    .update(updates)
    .eq("id", id)
    .eq("workspace_id", user.workspace_id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (body.items) {
    const { error: deleteError } = await supabase.from("nodere_proposal_items").delete().eq("proposal_id", id);
    if (deleteError) throw deleteError;

    const { error: itemsError } = await supabase.from("nodere_proposal_items").insert(
      body.items.map((item) => ({
        proposal_id: id,
        catalog_item_id: item.catalogItemId,
        quantity: item.quantity,
        item_snapshot: {},
        unit_price_cents: 0,
        subtotal_cents: 0
      }))
    );
    if (itemsError) throw itemsError;
  }

  await appendProposalAudit(user, id, "proposal_updated", {
    changed: Object.keys(body),
    itemCount: body.items?.length
  });

  return getProposal(user, id);
}

export async function listProposalAudit(user: AuthUserContext, proposalId: string) {
  const supabase = supabaseOrThrow();
  const proposal = await getProposal(user, proposalId);
  if (!proposal) return null;

  const { data, error } = await supabase
    .from("nodere_proposal_audit_logs")
    .select("*")
    .eq("proposal_id", proposalId)
    .eq("workspace_id", user.workspace_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(fromAuditRow);
}

function formatCents(cents: number) {
  return `BRL ${(cents / 100).toFixed(2)}`;
}

function pdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(line: string, width = 82) {
  const words = line.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildPdf(lines: string[]) {
  const safeLines = lines.flatMap((line) => wrapLine(line)).slice(0, 48);
  const content = [
    "BT",
    "/F1 11 Tf",
    "14 TL",
    "50 790 Td",
    ...safeLines.map((line) => `(${pdfText(line)}) Tj T*`),
    "ET"
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n");
  pdf += `\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "ascii");
}

export function proposalPdfBuffer(proposal: CommercialProposal) {
  const snapshot = proposal.commercialSnapshot;
  const rawItems = Array.isArray(snapshot.items) ? snapshot.items : [];
  const lines = [
    "NODERE - Proposta comercial",
    `Titulo: ${proposal.title}`,
    `Status: ${proposal.status}`,
    `Gerada em: ${new Date().toLocaleDateString("pt-BR")}`,
    "",
    "Itens comerciais"
  ];

  if (rawItems.length > 0) {
    for (const raw of rawItems) {
      const item = raw as Record<string, unknown>;
      const name = String(item.name ?? "Item");
      const quantity = Number(item.quantity ?? 1);
      const unit = String(item.unit ?? "un");
      const unitPrice = Number(item.unit_price_cents ?? item.unitPriceCents ?? 0);
      const subtotal = Number(item.subtotal_cents ?? item.subtotalCents ?? 0);
      lines.push(`- ${name}: ${quantity} ${unit} x ${formatCents(unitPrice)} = ${formatCents(subtotal)}`);
    }
  } else {
    for (const item of proposal.items) {
      lines.push(`- ${item.itemSnapshot.name}: ${item.quantity} ${item.itemSnapshot.unit} x ${formatCents(item.unitPriceCents)} = ${formatCents(item.subtotalCents)}`);
    }
  }

  lines.push("");
  lines.push(`Subtotal: ${formatCents(proposal.subtotalCents)}`);
  if (proposal.discountPercent != null && proposal.discountPercent > 0) {
    lines.push(`Desconto: ${proposal.discountPercent}%`);
  }
  if (proposal.discountValueCents != null && proposal.discountValueCents > 0) {
    lines.push(`Desconto: ${formatCents(proposal.discountValueCents)}`);
  }
  lines.push(`Total: ${formatCents(proposal.totalCents)}`);
  lines.push("");
  lines.push("Observacao: esta proposta usa snapshot comercial salvo. Alteracoes futuras no catalogo nao alteram este PDF.");

  return buildPdf(lines);
}
