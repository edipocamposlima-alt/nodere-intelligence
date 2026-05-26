const apiBase = process.env.VITE_API_BASE_URL || process.env.API_URL || "http://localhost:3333";
const googleKey = process.env.GOOGLE_PLACES_API_KEY || "";

function classify(message = "", status = "") {
  const text = String(message).toLowerCase();
  if (!message) return "OK";
  if (text.includes("failed to fetch") || text.includes("fetch failed") || text.includes("econnrefused") || text.includes("enotfound")) return "Erro de Endpoint";
  if (text.includes("api key not valid") || text.includes("invalid api key") || text.includes("chave") && text.includes("invalida")) return "Erro de Autenticacao";
  if (text.includes("not enabled") || text.includes("has not been used") || text.includes("disabled") || status === "REQUEST_DENIED") return "Erro de Permissao";
  if (text.includes("billing")) return "Billing nao ativo";
  if (text.includes("quota") || status === "OVER_QUERY_LIMIT") return "Quota excedida";
  if (text.includes("cors")) return "Erro de CORS";
  if (text.includes("mixed content") || text.includes("https")) return "Erro de Seguranca HTTPS";
  return "Erro nao classificado";
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

async function testGoogleDirect() {
  console.log("[1/3] Google Places Text Search: Academia em Caxias do Sul");
  if (!googleKey) {
    console.log("FAIL GOOGLE_PLACES_API_KEY ausente no ambiente.");
    return;
  }
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", "Academia em Caxias do Sul RS");
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("region", "br");
  url.searchParams.set("key", googleKey);
  const response = await fetch(url);
  const payload = await readJson(response);
  if (!response.ok || payload.status !== "OK") {
    console.log(`FAIL ${classify(payload.error_message, payload.status)} | http=${response.status} googleStatus=${payload.status} message=${payload.error_message || ""}`);
    return;
  }
  console.log(`OK Google retornou ${payload.results?.length || 0} resultado(s).`);
}

async function testBackendHealth() {
  console.log("[2/3] Backend /api/health");
  const url = `${apiBase.replace(/\/$/, "")}/api/health`;
  const response = await fetch(url);
  const payload = await readJson(response);
  console.log(response.ok ? `OK ${JSON.stringify(payload)}` : `FAIL http=${response.status} ${JSON.stringify(payload)}`);
}

async function testBackendPlaces() {
  console.log("[3/3] Backend /api/places/search");
  const url = new URL(`${apiBase.replace(/\/$/, "")}/api/places/search`);
  url.searchParams.set("segment", "academia");
  url.searchParams.set("city", "Caxias do Sul");
  url.searchParams.set("state", "RS");
  url.searchParams.set("limit", "3");
  const response = await fetch(url);
  const payload = await readJson(response);
  if (!response.ok) {
    console.log(`FAIL ${payload.code || classify(payload.error, payload.googleStatus)} | http=${response.status} googleStatus=${payload.googleStatus || ""} message=${payload.error || ""}`);
    return;
  }
  console.log(`OK Backend retornou ${payload.results?.length || 0} resultado(s).`);
}

for (const test of [testGoogleDirect, testBackendHealth, testBackendPlaces]) {
  try {
    await test();
  } catch (error) {
    console.log(`FAIL ${classify(error.message)} | ${error.message}`);
  }
}
