import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 4173);
const root = process.cwd();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

function resolvePath(url) {
  const requestedPath = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath === "/" ? "index.html" : safePath);
  return existsSync(filePath) && statSync(filePath).isDirectory() ? join(filePath, "index.html") : filePath;
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-cache",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-allow-methods": "GET,POST,OPTIONS"
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function googleKeys(body) {
  return {
    googleApiKey: process.env.GOOGLE_API_KEY || "",
    places: process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY || "",
    maps: process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY || "",
    pageSpeed: process.env.GOOGLE_PAGESPEED_API_KEY || process.env.GOOGLE_API_KEY || "",
    openai: process.env.OPENAI_API_KEY || "",
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || "",
    whatsappCloudToken: process.env.WHATSAPP_CLOUD_TOKEN || "",
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || ""
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status === "REQUEST_DENIED" || payload.status === "INVALID_REQUEST") {
    const message = payload.error_message || payload?.error?.message || payload.error || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

function parseAddress(address = "") {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const stateMatch = address.match(/\b([A-Z]{2})\b/);
  return {
    address,
    city: parts.length > 1 ? parts.at(-3) || parts.at(-2) || "" : "",
    state: stateMatch?.[1] || ""
  };
}

async function searchPlaces(body) {
  const keys = googleKeys(body);
  if (!keys.places) {
    const error = new Error("GOOGLE_PLACES_API_KEY ausente. Configure no backend/.env.");
    error.status = 503;
    error.code = "GOOGLE_PLACES_KEY_MISSING";
    throw error;
  }

  const query = [body.companyName, body.segment, body.keyword, body.city, body.state].map((item) => String(item || "").trim()).filter(Boolean).join(" ");
  if (!query && !body.pageToken) throw new Error("Informe segmento, cidade, estado ou palavra-chave.");

  const textUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  if (body.pageToken) textUrl.searchParams.set("pagetoken", body.pageToken);
  else textUrl.searchParams.set("query", query);
  textUrl.searchParams.set("language", "pt-BR");
  textUrl.searchParams.set("region", "br");
  textUrl.searchParams.set("key", keys.places);

  const search = await fetchJson(textUrl);
  const limit = Math.max(1, Math.min(Number(body.limit || 20), 20));
  const raw = (search.results || []).slice(0, limit);
  const results = await Promise.all(raw.map(async (place) => {
    const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    detailsUrl.searchParams.set("place_id", place.place_id);
    detailsUrl.searchParams.set("language", "pt-BR");
    detailsUrl.searchParams.set("fields", "name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,rating,user_ratings_total,types,business_status,url");
    detailsUrl.searchParams.set("key", keys.places);
    const details = await fetchJson(detailsUrl);
    const result = details.result || {};
    const parsed = parseAddress(result.formatted_address || place.formatted_address || "");
    return {
      source: "google_places",
      googlePlaceId: place.place_id,
      companyName: result.name || place.name,
      phone: result.international_phone_number || result.formatted_phone_number || "",
      whatsapp: result.international_phone_number || result.formatted_phone_number || "",
      website: result.website || "",
      address: parsed.address,
      city: parsed.city || body.city || "",
      state: parsed.state || body.state || "",
      segment: body.segment || (result.types || place.types || []).slice(0, 2).join(", "),
      googleRating: result.rating || place.rating || null,
      googleReviews: result.user_ratings_total || place.user_ratings_total || 0,
      googleMapsUrl: result.url || "",
      businessStatus: result.business_status || place.business_status || "",
      openingHours: result.opening_hours?.weekday_text || []
    };
  }));

  return { results, nextPageToken: search.next_page_token || null };
}

async function analyzePageSpeed(body) {
  const keys = googleKeys(body);
  if (!keys.pageSpeed) throw new Error("GOOGLE_PAGESPEED_API_KEY ausente. Configure no backend/.env ou no modo desenvolvimento local.");
  let url = String(body.url || "").trim();
  if (!url) throw new Error("Informe a URL do site.");
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("key", keys.pageSpeed);
  const payload = await fetchJson(endpoint);
  const categories = payload.lighthouseResult?.categories || {};
  const result = {
    url,
    performance: Math.round((categories.performance?.score || 0) * 100),
    seo: Math.round((categories.seo?.score || 0) * 100),
    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((categories["best-practices"]?.score || 0) * 100),
    diagnosis: "Analise PageSpeed executada com credencial local/backend.",
    recommendations: [
      "Otimizar imagens, cache e scripts bloqueantes.",
      "Revisar SEO tecnico, headings e metadados.",
      "Conferir pagina de destino antes de escalar Google Ads."
    ],
    createdAt: new Date().toISOString()
  };
  return { result };
}

function fallbackDiagnosis(body) {
  const lead = body.lead || {};
  const company = lead.company || lead.companyName || "este lead";
  const score = Number(lead.potential || 60);
  return {
    mode: "server-fallback",
    diagnosis: {
      summary: `Analise operacional para ${company}`,
      diagnosis: `Potencial ${score >= 75 ? "alto" : score >= 50 ? "medio" : "baixo"}. Revise site, nota Google, avaliacoes e proximo contato antes da abordagem.`,
      recommendedServices: ["Google Ads", "Google Meu Negocio", "Landing Page", "Mensuracao GA4/GTM"],
      whatsappMessage: `Ola, tudo bem? Analisei a presenca digital da ${company} e vi oportunidades para gerar mais contatos pelo Google. Posso te mostrar rapidamente?`,
      emailMessage: `Assunto: oportunidades no Google para ${company}\n\nOla! Preparei uma leitura inicial de oportunidades para aumentar contatos qualificados pelo Google. Posso te enviar um diagnostico objetivo?`,
      followUp: "Retomar em 2 dias uteis com diagnostico curto.",
      callScript: `Oi, aqui e da NODERE. Vi pontos de melhoria para ${company} gerar mais contatos pelo Google. Posso explicar em 2 minutos?`,
      googleAdsStrategy: "Campanhas locais por servico/cidade, extensoes de chamada e landing page com conversoes medidas.",
      leadPotential: score >= 75 ? "Alto" : score >= 50 ? "Medio" : "Baixo",
      priority: score >= 75 ? "Alta" : "Media",
      opportunityScore: score,
      nextSteps: ["Confirmar responsavel", "Enviar diagnostico curto", "Agendar conversa de 15 minutos"]
    }
  };
}

async function openAi(body) {
  const keys = googleKeys(body);
  if (!keys.openai) return fallbackDiagnosis(body);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${keys.openai}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        "Voce e a IA operacional do NODERE Intelligence. Responda em JSON com summary, diagnosis, whatsappMessage, emailMessage, googleAdsStrategy, leadPotential, priority, opportunityScore e nextSteps.",
        JSON.stringify({ action: body.action, question: body.question, lead: body.lead, context: body.context, history: body.history, notes: body.notes, tasks: body.tasks }).slice(0, 14000)
      ].join("\n\n")
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "OpenAI nao respondeu.");
  const text = payload.output_text || payload.output?.flatMap((item) => item.content || []).map((item) => item.text).join("\n") || "";
  try {
    return { mode: "openai", diagnosis: JSON.parse(text) };
  } catch {
    return { mode: "openai", diagnosis: { summary: "Resposta da IA", diagnosis: text, nextSteps: [] } };
  }
}

async function integrationStatus(body, live = false) {
  const keys = googleKeys(body);
  const rows = [
    ["google_places", "Google Places API", Boolean(keys.places)],
    ["google_maps", "Google Maps API", Boolean(keys.maps)],
    ["google_pagespeed", "Google PageSpeed API", Boolean(keys.pageSpeed)],
    ["openai", "OpenAI / ChatGPT API", Boolean(keys.openai)],
    ["google_calendar", "Google Calendar API", Boolean(keys.clientId && keys.clientSecret && keys.refreshToken)],
    ["gmail", "Gmail API", Boolean(keys.clientId && keys.clientSecret && keys.refreshToken)],
    ["google_drive", "Google Drive API", Boolean(keys.clientId && keys.clientSecret && keys.refreshToken)],
    ["google_business_profile", "Google Business Profile API", Boolean(keys.clientId && keys.clientSecret && keys.refreshToken)],
    ["whatsapp_cloud", "WhatsApp Cloud API", Boolean(keys.whatsappCloudToken && keys.whatsappPhoneNumberId)]
  ];
  const integrations = rows.map(([key, name, configured]) => ({
    key,
    name,
    configured,
    status: configured ? (live ? "pending_validation" : "pending") : "pending",
    message: configured ? "Credencial encontrada para validacao." : "Configure esta chave no backend/.env ou no modo desenvolvimento local."
  }));
  return { ok: true, live, integrations };
}

async function handleApi(request, response, pathname) {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});
  const body = await readBody(request);
  const params = new URL(request.url, `http://localhost:${port}`).searchParams;
  const queryBody = request.method === "GET" ? {
    companyName: params.get("companyName") || "",
    segment: params.get("segment") || "",
    city: params.get("city") || "",
    state: params.get("state") || "",
    keyword: params.get("keyword") || "",
    limit: params.get("limit") || 20,
    pageToken: params.get("pageToken") || ""
  } : body;
  try {
    if (pathname === "/health" || pathname === "/api/health") return sendJson(response, 200, { ok: true, service: "nodere-local-dev" });
    if (pathname === "/api/places/search" || pathname === "/api/v1/search/google-places") return sendJson(response, 200, await searchPlaces(queryBody));
    if (pathname === "/api/pagespeed" || pathname === "/api/v1/pagespeed/analyze") return sendJson(response, 200, await analyzePageSpeed(queryBody));
    if (pathname === "/api/openai" || pathname === "/api/openai/analyze" || pathname === "/api/v1/ai/diagnosis") return sendJson(response, 200, await openAi(queryBody));
    if (pathname === "/api/v1/integrations/status") return sendJson(response, 200, await integrationStatus(queryBody, params.get("live") === "1"));
    if (pathname === "/api/v1/integrations/test") return sendJson(response, 200, { integration: (await integrationStatus(queryBody, true)).integrations.find((item) => item.key === queryBody.key) || null });
    return sendJson(response, 404, { error: "Endpoint local nao encontrado." });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", path: pathname, message: error.message }));
    return sendJson(response, error.status || 500, { error: error.message || "Falha na API local.", code: error.code || "LOCAL_API_ERROR" });
  }
}

createServer((request, response) => {
  const pathname = new URL(request.url, `http://localhost:${port}`).pathname;
  if (pathname === "/health" || pathname.startsWith("/api/")) {
    handleApi(request, response, pathname);
    return;
  }

  const filePath = resolvePath(request.url);
  if (!existsSync(filePath)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Arquivo nao encontrado.");
    return;
  }

  response.writeHead(200, {
    "content-type": mimeTypes[extname(filePath)] || "application/octet-stream",
    "cache-control": "no-cache"
  });
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`Nodere Intelligence pronto em http://localhost:${port}`);
});
