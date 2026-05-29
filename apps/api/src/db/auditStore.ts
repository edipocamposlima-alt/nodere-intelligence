import { WebsiteScan } from "../types.js";

const scans = new Map<string, WebsiteScan>();

export function saveAudit(companyId: string, scan: WebsiteScan) {
  scans.set(companyId, scan);
}

export function getAudit(companyId: string): WebsiteScan | undefined {
  return scans.get(companyId);
}
