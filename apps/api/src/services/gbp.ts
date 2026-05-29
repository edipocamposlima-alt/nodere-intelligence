import { config } from "../config.js";
import { GbpInsights } from "../types.js";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GBP_BASE = "https://mybusinessaccountmanagement.googleapis.com/v1";
const REVIEWS_BASE = "https://mybusiness.googleapis.com/v4";

let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at - 30_000) {
    return cachedToken.access_token;
  }

  const clientId = config.google.businessProfileClientId;
  const clientSecret = config.google.businessProfileClientSecret;
  const businessProfileRefreshToken = config.google.businessProfileRefreshToken;
  if (!clientId || !clientSecret || !businessProfileRefreshToken) {
    throw new Error("GBP OAuth credentials not fully configured");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: businessProfileRefreshToken,
      grant_type: "refresh_token"
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GBP token exchange failed: ${err}`);
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000
  };
  return cachedToken.access_token;
}

async function gbpFetch(url: string) {
  const token = await getAccessToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error(`GBP API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function getGbpInsights(): Promise<GbpInsights> {
  const { businessProfileRefreshToken, businessProfileClientId, businessProfileClientSecret } = config.google;

  if (!businessProfileRefreshToken || !businessProfileClientId || !businessProfileClientSecret) {
    return {
      status: "not_configured",
      message:
        "Configure GOOGLE_BUSINESS_PROFILE_CLIENT_ID, GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET e GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN para ingerir dados de avaliações, posts, fotos e Q&A do Google Business Profile."
    };
  }

  try {
    const accounts = await gbpFetch(`${GBP_BASE}/accounts`);
    const accountList: any[] = accounts.accounts ?? [];
    if (accountList.length === 0) {
      return { status: "authorized", message: "Conta GBP autorizada, mas sem perfis de negócio vinculados.", data: {} };
    }

    const accountName = accountList[0].name;
    const locRes = await gbpFetch(`${GBP_BASE}/${accountName}/locations`);
    const locations: any[] = locRes.locations ?? [];

    let reviewCount = 0;
    let ratingSum = 0;
    let ratedCount = 0;

    for (const loc of locations.slice(0, 5)) {
      try {
        const reviews = await gbpFetch(`${REVIEWS_BASE}/${loc.name}/reviews?pageSize=50`);
        reviewCount += reviews.totalReviewCount ?? 0;
        const avg = reviews.averageRating;
        if (avg) { ratingSum += avg; ratedCount++; }
      } catch { /* skip location */ }
    }

    return {
      status: "authorized",
      message: `${locations.length} local(is) encontrado(s) na conta Google Business Profile.`,
      data: {
        accountName,
        locationCount: locations.length,
        reviewCount,
        averageRating: ratedCount ? Math.round((ratingSum / ratedCount) * 10) / 10 : undefined,
        hasPhotos: true,
        hasRecentPosts: false
      }
    };
  } catch (error) {
    return {
      status: "error",
      message: "Falha ao autenticar com a API do Google Business Profile. Verifique as credenciais OAuth.",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function getGbpInsightsForCompany(companyName: string, _city: string): Promise<GbpInsights> {
  return getGbpInsights();
}
