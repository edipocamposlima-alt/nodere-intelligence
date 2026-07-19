import { config } from "../config.js";
import { WebsiteScan } from "../types.js";
import { fetchPublicText, UnsafePublicUrlError } from "../utils/publicHttp.js";

type PageSpeedStrategy = "mobile" | "desktop";

export async function scanWebsite(
  url?: string,
  options: { pageSpeedStrategies?: PageSpeedStrategy[] } = {}
): Promise<WebsiteScan> {
  const scannedAt = new Date().toISOString();

  if (!url) return emptyScan("", scannedAt);

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const scan = emptyScan(normalizedUrl, scannedAt);
  scan.hasSsl = normalizedUrl.startsWith("https://");

  let html = "";
  try {
    const site = await fetchPublicText(normalizedUrl, { timeoutMs: 5_000 });
    scan.url = site.url;
    scan.hasSsl = site.url.startsWith("https://");
    html = site.text;
  } catch (error) {
    if (error instanceof UnsafePublicUrlError) throw error;
    return scan;
  }

  scan.hasGoogleAds = detectGoogleAds(html);

  // Responsiveness
  scan.isResponsive = /name=["']viewport["']/i.test(html);

  // GA4 — specific measurement ID
  const ga4Match = /G-([A-Z0-9]{4,12})/i.exec(html);
  scan.hasGA4 = Boolean(ga4Match);
  scan.ga4MeasurementId = ga4Match ? `G-${ga4Match[1].toUpperCase()}` : undefined;
  // Legacy GA still counts as googleAnalytics on Company
  const hasAnyGA = scan.hasGA4 || /google-analytics\.com|gtag\(/i.test(html);

  // GTM — extract container ID
  const gtmMatch = /GTM-([A-Z0-9]{4,8})/i.exec(html);
  scan.hasGTM = Boolean(gtmMatch);
  scan.gtmContainerId = gtmMatch ? `GTM-${gtmMatch[1].toUpperCase()}` : undefined;

  // Meta Pixel — extract pixel ID
  const pixelIdMatch = /fbq\s*\(\s*['"]init['"],\s*['"](\d+)['"]/i.exec(html);
  scan.hasMetaPixel = Boolean(pixelIdMatch) || /connect\.facebook\.net/i.test(html);
  scan.metaPixelId = pixelIdMatch?.[1];

  // Conversion events
  const events: string[] = [];
  for (const m of html.matchAll(/fbq\s*\(\s*['"]track['"],\s*['"]([^'"]+)['"]/gi)) events.push(`FB: ${m[1]}`);
  const gaIgnored = new Set(["page_view", "user_engagement", "session_start"]);
  for (const m of html.matchAll(/gtag\s*\(\s*['"]event['"],\s*['"]([^'"]+)['"]/gi)) {
    if (!gaIgnored.has(m[1])) events.push(`GA: ${m[1]}`);
  }
  scan.conversionEvents = [...new Set(events)];
  scan.hasConversionEvents = events.length > 0;

  // SEO
  const titleMatch = /<title[^>]*>([^<]{3,})<\/title>/i.exec(html);
  scan.hasTitle = Boolean(titleMatch);
  scan.titleText = titleMatch?.[1]?.trim().slice(0, 80);

  scan.hasMetaDescription = /name=["']description["']/i.test(html);

  const h1Match = /<h1[^>]*>([^<]{2,})<\/h1>/i.exec(html);
  scan.hasH1 = Boolean(h1Match);
  scan.h1Text = h1Match?.[1]?.replace(/<[^>]+>/g, "").trim().slice(0, 80);

  scan.hasCanonical = /rel=["']canonical["']/i.test(html);
  scan.hasRobotsMeta = /name=["']robots["']/i.test(html);
  scan.hasOpenGraph = /property=["']og:/i.test(html);
  scan.hasStructuredData = /"@type"\s*:/.test(html) || /type=["']application\/ld\+json["']/i.test(html);

  // Social profiles
  scan.instagram = extractSocialUrl(html, "instagram.com", ["p", "explore", "reel", "tv"]);
  scan.facebook = extractSocialUrl(html, "facebook.com", ["share", "sharer", "login", "signup", "plugins"]);
  scan.linkedin = extractSocialUrl(html, "linkedin.com", ["share", "shareArticle", "authwall"]);
  scan.youtube = extractSocialUrl(html, "youtube.com", ["watch", "embed", "shorts"]);

  // Sitemap
  try {
    const sitemap = await fetchPublicText(new URL("/sitemap.xml", scan.url), { timeoutMs: 3_000, maxBytes: 512 * 1024 });
    scan.hasSitemap = sitemap.response.ok;
  } catch {
    scan.hasSitemap = false;
  }

  // PageSpeed + Core Web Vitals
  if (config.google.pageSpeedKey) {
    const strategies = [...new Set(options.pageSpeedStrategies?.length ? options.pageSpeedStrategies : ["mobile"] as PageSpeedStrategy[])];
    const results = await Promise.all(strategies.map(async (strategy) => {
      try {
        return { strategy, data: await fetchPageSpeed(scan.url, strategy) };
      } catch (error) {
        return { strategy, error: error instanceof Error ? error.message : "Falha desconhecida no PageSpeed." };
      }
    }));
    const mobile = results.find((item) => item.strategy === "mobile" && item.data)?.data;
    const desktop = results.find((item) => item.strategy === "desktop" && item.data)?.data;
    const failures = results.filter((item) => item.error);
    if (mobile) {
      scan.pageSpeed = mobile.performance;
      scan.seoScore = mobile.seo;
      scan.accessibilityScore = mobile.accessibility;
      scan.bestPracticesScore = mobile.bestPractices;
      scan.lcp = mobile.lcp;
      scan.cls = mobile.cls;
      scan.fcp = mobile.fcp;
    }
    if (desktop) scan.pageSpeedDesktop = desktop.performance;
    scan.pageSpeedStatus = failures.length === 0 ? "ok" : (mobile || desktop) ? "partial" : "error";
    scan.pageSpeedError = failures.length ? failures.map((item) => `${item.strategy}: ${item.error}`).join("; ") : undefined;
  }

  // Composite scores
  scan.maturityScore = calcMaturity(scan);
  scan.commercialScore = calcCommercial(scan);
  scan.paidTrafficScore = calcPaidTraffic(scan);

  // keep legacy fields for backward compat
  (scan as any).googleAnalytics = hasAnyGA;
  (scan as any).googleTagManager = scan.hasGTM;
  (scan as any).metaPixel = scan.hasMetaPixel;
  (scan as any).seoBasics = scan.hasTitle && scan.hasMetaDescription;

  return scan;
}

function calcMaturity(s: WebsiteScan): number {
  let n = 0;
  if (s.hasSsl) n += 10;
  if (s.isResponsive) n += 10;
  if (s.hasTitle) n += 8;
  if (s.hasMetaDescription) n += 8;
  if (s.hasH1) n += 6;
  if (s.hasCanonical) n += 6;
  if (s.hasOpenGraph) n += 8;
  if (s.hasStructuredData) n += 8;
  if (s.hasSitemap) n += 6;
  if (s.pageSpeed >= 70) n += 15;
  else if (s.pageSpeed >= 50) n += 8;
  const socials = [s.instagram, s.facebook, s.linkedin, s.youtube].filter(Boolean).length;
  if (socials >= 2) n += 8;
  else if (socials === 1) n += 4;
  return Math.min(100, n);
}

function calcCommercial(s: WebsiteScan): number {
  let n = 0;
  if (s.hasSsl) n += 10;
  if (s.isResponsive) n += 10;
  if (s.hasMetaPixel) n += 22;
  if (s.hasConversionEvents) n += 18;
  if (s.hasGA4) n += 18;
  if (s.hasGTM) n += 12;
  if (s.hasOpenGraph) n += 10;
  return Math.min(100, n);
}

function calcPaidTraffic(s: WebsiteScan): number {
  let n = 0;
  if (s.hasMetaPixel) n += 28;
  if (s.hasConversionEvents) n += 22;
  if (s.hasGA4) n += 22;
  if (s.hasGTM) n += 16;
  if (s.pageSpeed >= 60) n += 8;
  if (s.isResponsive) n += 4;
  return Math.min(100, n);
}

function emptyScan(url: string, scannedAt: string): WebsiteScan {
  return {
    url,
    scannedAt,
    hasSsl: false,
    isResponsive: false,
    hasGA4: false,
    hasGTM: false,
    hasMetaPixel: false,
    hasGoogleAds: null,
    hasConversionEvents: false,
    conversionEvents: [],
    hasTitle: false,
    hasMetaDescription: false,
    hasH1: false,
    hasCanonical: false,
    hasRobotsMeta: false,
    hasOpenGraph: false,
    hasStructuredData: false,
    hasSitemap: false,
    pageSpeed: 0,
    pageSpeedStatus: config.google.pageSpeedKey ? "error" : "not_configured",
    maturityScore: 0,
    commercialScore: 0,
    paidTrafficScore: 0
  };
}

async function fetchPageSpeed(url: string, strategy: PageSpeedStrategy) {
  const psUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  psUrl.searchParams.set("url", url);
  psUrl.searchParams.set("strategy", strategy);
  psUrl.searchParams.set("key", config.google.pageSpeedKey!);
  for (const category of ["performance", "seo", "accessibility", "best-practices"]) {
    psUrl.searchParams.append("category", category);
  }

  let lastError = "PageSpeed não respondeu.";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(psUrl, { signal: AbortSignal.timeout(30_000) });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      const categories = payload?.lighthouseResult?.categories ?? {};
      const audits = payload?.lighthouseResult?.audits ?? {};
      if (typeof categories.performance?.score !== "number") throw new Error("PageSpeed não retornou score de performance.");
      return {
        performance: score(categories.performance?.score),
        seo: nullableScore(categories.seo?.score),
        accessibility: nullableScore(categories.accessibility?.score),
        bestPractices: nullableScore(categories["best-practices"]?.score),
        lcp: numericOrUndefined(audits["largest-contentful-paint"]?.numericValue),
        cls: numericOrUndefined(audits["cumulative-layout-shift"]?.numericValue),
        fcp: numericOrUndefined(audits["first-contentful-paint"]?.numericValue)
      };
    }
    lastError = String(payload?.error?.message || `PageSpeed HTTP ${response.status}`);
    if (![429, 502, 503, 504].includes(response.status) || attempt === 1) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(lastError);
}

function score(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function nullableScore(value: unknown) {
  return typeof value === "number" ? score(value) : undefined;
}

function numericOrUndefined(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function detectGoogleAds(html: string): boolean | null {
  if (!html) return null;
  const normalized = html.toLowerCase();
  if (
    normalized.includes("googleads.g.doubleclick.net") ||
    normalized.includes("pagead2.googlesyndication.com") ||
    /AW-[A-Z0-9-]+/i.test(html) ||
    (/gtag/i.test(html) && /AW-[A-Z0-9-]+/i.test(html))
  ) {
    return true;
  }
  return null;
}

export function extractSocialUrl(html: string, domain: string, blocklist: string[]): string | undefined {
  const pattern = new RegExp(`href=["']https?://(?:www\\.)?${domain.replace(".", "\\.")}/([^/"'\\s?#]+)`, "gi");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const handle = match[1].toLowerCase();
    if (!blocklist.some((b) => handle.startsWith(b))) return `https://${domain}/${match[1]}`;
  }
  return undefined;
}
