"use client";

import { getApiBaseUrl } from "./apiBase";

const TOKEN_KEY = "nodere_admin_token";

export function getAdminToken() {
  return "";
}

export function setAdminToken(_token: string) {
  localStorage.removeItem(TOKEN_KEY);
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
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    cache: "no-store",
    credentials: "include"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminFetchError(payload.message || payload.error || `HTTP ${response.status}`, response.status);
  }
  return payload as T;
}
