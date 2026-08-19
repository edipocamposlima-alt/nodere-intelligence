const LOCAL_APP_URL = "http://localhost:3000";

function normalizePublicUrl(value: string | undefined) {
  const raw = String(value || "").trim().replace(/\/+$/, "");
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.hostname === "localhost" ? url.origin : "";
  } catch {
    return "";
  }
}

export function getConfiguredPublicAppUrl() {
  return normalizePublicUrl(
    process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || process.env.APP_URL
  );
}

export function getPublicAppUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return getConfiguredPublicAppUrl() || LOCAL_APP_URL;
}

export function getPublicAppHost() {
  try {
    return new URL(getPublicAppUrl()).host;
  } catch {
    return "NODERE";
  }
}
