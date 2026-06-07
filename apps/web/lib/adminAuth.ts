"use client";

import { getApiBaseUrl } from "./apiBase";

const TOKEN_KEY = "nodere_admin_token";

export function getAdminToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class AdminFetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminFetchError";
    this.status = status;
  }
}

export async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const useLocalProxy = path.startsWith("/admin/");
  const response = await fetch(useLocalProxy ? `/api${path}` : `${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    cache: "no-store",
    credentials: useLocalProxy ? "include" : options.credentials
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminFetchError(payload.message || payload.error || `HTTP ${response.status}`, response.status);
  }
  return payload as T;
}
