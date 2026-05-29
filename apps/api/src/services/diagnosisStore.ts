import { CommercialDiagnosis } from "../types.js";

const store = new Map<string, CommercialDiagnosis>();

export function getCachedDiagnosis(companyId: string): CommercialDiagnosis | undefined {
  return store.get(companyId);
}

export function cacheDiagnosis(diagnosis: CommercialDiagnosis): void {
  store.set(diagnosis.companyId, diagnosis);
}

export function clearDiagnosis(companyId: string): void {
  store.delete(companyId);
}
