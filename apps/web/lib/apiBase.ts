const DEFAULT_BACKEND_URL = "https://nodere-api.onrender.com";

export function getApiBaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

export function getBackendRootUrl() {
  return getApiBaseUrl().replace(/\/api$/, "");
}
