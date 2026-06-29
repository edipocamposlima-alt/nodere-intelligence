"use client";

import { getSupabaseBrowserClient } from "./supabase";
import type {
  CommercialCatalogItem,
  CommercialProposal,
  CommercialProposalAuditLog,
  CommercialProposalStatus,
  PlatformRole
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://nodere-api.onrender.com/api";

export type CommercialContext = {
  userId: string;
  workspaceId: string;
  role: PlatformRole;
  canManageCatalog: boolean;
  canWriteProposals: boolean;
};

export type CatalogPayload = {
  type: "product" | "service";
  name: string;
  description?: string;
  unit: string;
  unitPriceCents: number;
  active?: boolean;
};

export type ProposalPayload = {
  companyId?: string;
  title: string;
  status?: CommercialProposalStatus;
  discountPercent?: number;
  discountValueCents?: number;
  discountReason?: string;
  items: Array<{ catalogItemId: string; quantity: number }>;
};

async function authToken() {
  const supabase = await getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sessao expirada. Entre novamente.");
  return session.access_token;
}

async function commercialApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await authToken();
  const response = await fetch(`${API_URL}/commercial${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? data.message ?? `Erro ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getCommercialContext() {
  return commercialApi<CommercialContext>("/context");
}

export function getCatalogItems(activeOnly = false) {
  return commercialApi<CommercialCatalogItem[]>(`/catalog${activeOnly ? "?activeOnly=true" : ""}`);
}

export function createCatalogItem(payload: CatalogPayload) {
  return commercialApi<CommercialCatalogItem>("/catalog", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateCatalogItem(id: string, payload: Partial<CatalogPayload>) {
  return commercialApi<CommercialCatalogItem>(`/catalog/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function getProposals() {
  return commercialApi<CommercialProposal[]>("/proposals");
}

export function createProposal(payload: ProposalPayload) {
  return commercialApi<CommercialProposal>("/proposals", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateProposal(id: string, payload: Partial<ProposalPayload>) {
  return commercialApi<CommercialProposal>(`/proposals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function getProposalAudit(id: string) {
  return commercialApi<CommercialProposalAuditLog[]>(`/proposals/${id}/audit`);
}

export async function openProposalPdf(id: string) {
  const token = await authToken();
  const response = await fetch(`${API_URL}/commercial/proposals/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? data.message ?? "Erro ao gerar PDF");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
