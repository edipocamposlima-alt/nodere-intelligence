function hasPattern(html, patterns) {
  return patterns.some((pattern) => pattern.test(html));
}

function normalizeWebsite(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export async function scanWebsite(rawUrl) {
  const url = normalizeWebsite(rawUrl);

  if (!url) {
    return {
      hasWebsite: false,
      findings: ["Empresa sem site informado."],
      score: 35
    };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Nodere Intelligence MVP Scanner"
      }
    });

    const html = await response.text();
    const lowerHtml = html.toLowerCase();
    const loadMs = Date.now() - started;

    const scan = {
      hasWebsite: true,
      finalUrl: response.url,
      statusCode: response.status,
      loadMs,
      hasHttps: response.url.startsWith("https://"),
      hasWhatsapp: hasPattern(lowerHtml, [/wa\.me/i, /api\.whatsapp\.com/i, /web\.whatsapp\.com/i, /whatsapp/i]),
      hasMetaPixel: hasPattern(html, [/fbq\(/i, /connect\.facebook\.net/i, /facebook.*pixel/i]),
      hasGtm: hasPattern(html, [/GTM-[A-Z0-9]+/i, /googletagmanager\.com\/gtm\.js/i]),
      hasGa4: hasPattern(html, [/G-[A-Z0-9]+/i, /gtag\(/i, /google-analytics\.com/i]),
      hasForm: hasPattern(lowerHtml, [/<form/i, /type=["']submit/i]),
      hasPhone: hasPattern(lowerHtml, [/tel:/i, /\(\d{2}\)\s?\d{4,5}-?\d{4}/i]),
      hasTitle: /<title>.*<\/title>/i.test(html),
      hasMetaDescription: /<meta[^>]+name=["']description["']/i.test(html),
      findings: []
    };

    if (!scan.hasWhatsapp) scan.findings.push("WhatsApp nao aparece de forma clara no site.");
    if (!scan.hasMetaPixel) scan.findings.push("Meta Pixel nao detectado.");
    if (!scan.hasGtm) scan.findings.push("Google Tag Manager nao detectado.");
    if (!scan.hasGa4) scan.findings.push("Google Analytics/GA4 nao detectado.");
    if (!scan.hasForm) scan.findings.push("Formulario de conversao nao detectado.");
    if (!scan.hasMetaDescription) scan.findings.push("Meta description nao detectada.");
    if (scan.loadMs > 3500) scan.findings.push("Site respondeu lentamente.");

    const penalties = [
      !scan.hasWhatsapp,
      !scan.hasMetaPixel,
      !scan.hasGtm,
      !scan.hasGa4,
      !scan.hasForm,
      !scan.hasMetaDescription,
      scan.loadMs > 3500
    ].filter(Boolean).length;

    scan.score = Math.max(20, 100 - penalties * 9);
    return scan;
  } catch (error) {
    return {
      hasWebsite: true,
      finalUrl: url,
      error: error.name === "AbortError" ? "Tempo limite excedido." : error.message,
      findings: ["Nao foi possivel auditar o site automaticamente."],
      score: 30
    };
  } finally {
    clearTimeout(timeout);
  }
}
