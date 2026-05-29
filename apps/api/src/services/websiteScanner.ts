import { config } from "../config.js";
import { WebsiteScan } from "../types.js";

export async function scanWebsite(url?: string): Promise<WebsiteScan> {
  const scannedAt = new Date().toISOString();

  if (!url) return emptyScan("", scannedAt);

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const scan = emptyScan(normalizedUrl, scannedAt);
  scan.hasSsl = normalizedUrl.startsWith("https://");

  let html = "";
  try {
    const res = await fetch(normalizedUrl, { signal: AbortSignal.timeout(8000) });
    html = await res.text();
  } catch {
    return scan;
  }

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
    const sitemapRes = await fetch(new URL("/sitemap.xml", normalizedUrl).toString(), {
      signal: AbortSignal.timeout(3000)
    });
    scan.hasSitemap = sitemapRes.ok;
  } catch {
    scan.hasSitemap = false;
  }

  // PageSpeed + Core Web Vitals
  if (config.google.pageSpeedKey) {
    try {
      const psUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
      psUrl.searchParams.set("url", normalizedUrl);
      psUrl.searchParams.set("strategy", "mobile");
      psUrl.searchParams.set("key", config.google.pageSpeedKey);
      const psRes = await fetch(psUrl);
      if (psRes.ok) {
        const ps = await psRes.json();
        const audits = ps.lighthouseResult?.audits ?? {};
        scan.pageSpeed = Math.round((ps.lighthouseResult?.categories?.performance?.score ?? 0) * 100);
        scan.lcp = audits["largest-contentful-paint"]?.numericValue;
        scan.cls = audits["cumulative-layout-shift"]?.numericValue;
        scan.fcp = audits["first-contentful-paint"]?.numericValue;
      }
    } catch { /* pageSpeed stays 0 */ }
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
    maturityScore: 0,
    commercialScore: 0,
    paidTrafficScore: 0
  };
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
