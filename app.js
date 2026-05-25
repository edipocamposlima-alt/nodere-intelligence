const searchForm = document.getElementById("smartSearch");
const navItems = document.querySelectorAll(".nav-item");
const globalSearch = document.querySelector(".global-search input");
const apiBaseUrlInput = document.getElementById("apiBaseUrl");
const apiTokenInput = document.getElementById("apiToken");
const settingsMessage = document.getElementById("settingsMessage");
const integrationStatus = document.getElementById("integrationStatus");
const leadRows = document.getElementById("leadRows");
const leadTableMessage = document.getElementById("leadTableMessage");

const statusOptions = [
  ["lead_new", "Novo Lead"],
  ["contact_started", "Contatado"],
  ["negotiating", "Em negociação"],
  ["meeting_scheduled", "Reunião marcada"],
  ["proposal_sent", "Proposta enviada"],
  ["won", "Fechado"],
  ["lost", "Perdido"]
];

let currentRows = [];
let allRows = [];

apiBaseUrlInput.value = localStorage.getItem("nodere:api-base-url") || "http://localhost:3333";
apiTokenInput.value = localStorage.getItem("nodere:api-token") || "";

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((navItem) => navItem.classList.remove("active"));
    item.classList.add("active");
  });
});

function getApiBaseUrl() {
  return (apiBaseUrlInput.value || "").trim().replace(/\/$/, "");
}

function getApiHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = (apiTokenInput.value || "").trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function apiFetch(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new Error("Informe a URL da API.");

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...getApiHeaders(),
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || payload.message || "Falha ao conectar com a API.");
  return payload;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeLead(row) {
  return {
    id: row.id,
    companyName: row.company_name || row.companyName || "Empresa sem nome",
    googlePlaceId: row.google_place_id || row.googlePlaceId,
    phone: row.phone || "",
    whatsapp: row.whatsapp || row.phone || "",
    website: row.website || "",
    address: row.address || "",
    city: row.city || "",
    state: row.state || "",
    segment: row.segment || row.category || "",
    googleRating: Number(row.google_rating || row.googleRating || 0),
    googleReviews: Number(row.google_reviews || row.googleReviews || 0),
    googleMapsUrl: row.google_maps_url || row.googleMapsUrl || "",
    status: row.status || "lead_new",
    source: row.source || "google_places",
    opportunityScore: Number(row.opportunity_score || row.opportunityScore || 0),
    problem: row.problem || row.notes || "Aguardando diagnóstico real"
  };
}

function buildWhatsappUrl(lead) {
  const digits = String(lead.whatsapp || lead.phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  const text = encodeURIComponent(
    `Olá, tudo bem? Analisei a presença digital da ${lead.companyName} no Google e identifiquei oportunidades comerciais. Posso te mostrar rapidamente?`
  );
  return `https://wa.me/${number}?text=${text}`;
}

function scoreForLead(lead) {
  if (lead.opportunityScore) return Math.round(lead.opportunityScore);
  let score = 20;
  if (!lead.website) score += 25;
  if (lead.googleRating && lead.googleRating < 4.2) score += 20;
  if (lead.googleReviews < 50) score += 15;
  if (!lead.phone && !lead.whatsapp) score += 10;
  return Math.min(95, score);
}

function levelForScore(score) {
  if (score >= 70) return ["Alta", "high"];
  if (score >= 45) return ["Média", "mid"];
  return ["Baixa", "low"];
}

function problemForLead(lead) {
  if (lead.problem && lead.problem !== "Aguardando diagnóstico real") return lead.problem;
  if (!lead.website) return "Sem site detectado";
  if (lead.googleRating && lead.googleRating < 4.2) return "Baixa avaliação no Google";
  if (lead.googleReviews < 50) return "Poucas avaliações";
  return "Aguardando análise PageSpeed/IA";
}

function renderRows(rows, mode = "saved") {
  currentRows = rows.map(normalizeLead);
  if (mode !== "filtered") allRows = currentRows;
  updateMetrics(currentRows);
  if (!currentRows.length) {
    leadRows.innerHTML = `<div class="empty-row">Nenhum lead real carregado. Use a busca inteligente com o backend conectado.</div>`;
    leadTableMessage.textContent = "Sem dados reais carregados.";
    return;
  }

  leadTableMessage.textContent =
    mode === "search"
      ? `${currentRows.length} empresa(s) real(is) retornada(s) pelo Google Places. Salve no CRM para persistir.`
      : `${currentRows.length} lead(s) carregado(s) do CRM.`;

  leadRows.innerHTML = currentRows
    .map((lead, index) => {
      const score = scoreForLead(lead);
      const [level, levelClass] = levelForScore(score);
      const location = [lead.city, lead.state].filter(Boolean).join(", ") || lead.address || "Local não informado";
      const rating = lead.googleRating ? lead.googleRating.toFixed(1) : "-";
      const mapsUrl = lead.googleMapsUrl || (lead.address ? `https://maps.google.com/?q=${encodeURIComponent(lead.address)}` : "");
      const whatsappUrl = buildWhatsappUrl(lead);
      const statusSelect = lead.id
        ? `<select class="status blue" data-status-id="${lead.id}">${statusOptions
            .map(([value, label]) => `<option value="${value}" ${value === lead.status ? "selected" : ""}>${label}</option>`)
            .join("")}</select>`
        : `<button class="row-button" data-save-index="${index}">Salvar CRM</button>`;

      return `
        <div class="table-row" role="row">
          <div class="company-cell"><span class="logo-ball dark">${escapeHtml(lead.companyName.slice(0, 1))}</span><span><strong>${escapeHtml(lead.companyName)}</strong><small>${escapeHtml(location)}</small></span></div>
          <span>${escapeHtml(lead.segment || "Sem categoria")}</span>
          <span>${rating} ${lead.googleRating ? '<b class="star">★</b>' : ""}</span>
          <span>${lead.googleReviews || 0}</span>
          <span><b class="score ${levelClass}">${score}</b><em class="level ${levelClass}">${level}</em></span>
          <span>${escapeHtml(problemForLead(lead))}</span>
          <span>${statusSelect}</span>
          <span class="actions">
            ${whatsappUrl ? `<a class="whatsapp" href="${whatsappUrl}" target="_blank" rel="noreferrer">☏</a>` : `<button class="row-button" disabled>Sem WhatsApp</button>`}
            ${mapsUrl ? `<a class="maps" href="${mapsUrl}" target="_blank" rel="noreferrer">◆</a>` : ""}
          </span>
        </div>
      `;
    })
    .join("");
}

function updateMetrics(rows) {
  const scores = rows.map(scoreForLead);
  document.getElementById("metricCompanies").textContent = rows.length;
  document.getElementById("metricLowRating").textContent = rows.filter((lead) => lead.googleRating && lead.googleRating < 4.2).length;
  document.getElementById("metricNoSite").textContent = rows.filter((lead) => !lead.website).length;
  document.getElementById("metricNoWhatsapp").textContent = rows.filter((lead) => !lead.whatsapp && !lead.phone).length;
  document.getElementById("metricHotLeads").textContent = scores.filter((score) => score >= 70).length;
}

async function loadSavedLeads() {
  leadTableMessage.textContent = "Carregando CRM...";
  try {
    const payload = await apiFetch("/api/v1/leads");
    renderRows(payload.leads || [], "saved");
  } catch (error) {
    leadRows.innerHTML = `<div class="empty-row">${escapeHtml(error.message)}. Publique o backend e configure a URL da API em Configurações.</div>`;
    leadTableMessage.textContent = "Backend indisponível.";
  }
}

async function saveLead(lead) {
  const payload = await apiFetch("/api/v1/leads", {
    method: "POST",
    body: JSON.stringify({
      companyName: lead.companyName,
      googlePlaceId: lead.googlePlaceId,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      website: lead.website,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      segment: lead.segment,
      googleRating: lead.googleRating || null,
      googleReviews: lead.googleReviews || 0,
      source: lead.source || "google_places"
    })
  });
  return payload.lead;
}

function renderIntegrations(items = []) {
  if (!items.length) return;

  const labels = {
    connected: "Conectado",
    error: "Erro",
    pending: "Pendente",
    pending_validation: "Pendente"
  };

  integrationStatus.innerHTML = items
    .map((item) => {
      const status = item.status || (item.configured ? "pending_validation" : "pending");
      return `
        <div class="integration-row ${status}">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${labels[status] || escapeHtml(status)}</span>
          <small>${escapeHtml(item.message || item.capability || "Sem detalhes retornados.")}</small>
        </div>
      `;
    })
    .join("");
}

async function loadIntegrationStatus(live = false) {
  settingsMessage.textContent = live ? "Validando conexões..." : "Carregando status das integrações...";
  try {
    const payload = await apiFetch(`/api/v1/integrations/status${live ? "?live=1" : ""}`);
    renderIntegrations(payload.integrations);
    settingsMessage.textContent = live ? "Validação concluída." : "Status carregado do backend.";
  } catch (error) {
    settingsMessage.textContent = error.message;
  }
}

async function testAiDiagnosis() {
  settingsMessage.textContent = "Testando IA...";
  try {
    const payload = await apiFetch("/api/v1/ai/diagnosis", {
      method: "POST",
      body: JSON.stringify({
        lead: {
          company_name: "Empresa real em análise",
          segment: "Serviços locais",
          city: "Porto Alegre",
          google_rating: 3.8,
          google_reviews: 23
        },
        scan: {
          score: 62,
          findings: ["Baixa avaliação", "Site sem eventos de conversão"]
        }
      })
    });
    settingsMessage.textContent = `IA respondeu: ${payload.diagnosis.summary || payload.diagnosis.diagnosis || "diagnóstico gerado"}`;
  } catch (error) {
    settingsMessage.textContent = error.message;
  }
}

async function testPlacesSearch() {
  settingsMessage.textContent = "Testando Google Places...";
  try {
    const payload = await apiFetch("/api/v1/search/google-places", {
      method: "POST",
      body: JSON.stringify({ city: "Porto Alegre", state: "RS", segment: "Academia", keyword: "fitness", limit: 3 })
    });
    settingsMessage.textContent = `Google Places respondeu com ${payload.results?.length || 0} empresa(s).`;
  } catch (error) {
    settingsMessage.textContent = error.message;
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = searchForm.querySelector("button");
  const originalText = button.innerHTML;
  button.innerHTML = "<span>⌁</span> Buscando";
  button.disabled = true;
  leadTableMessage.textContent = "Buscando empresas reais no Google Places...";

  try {
    const payload = await apiFetch("/api/v1/search/google-places", {
      method: "POST",
      body: JSON.stringify({
        segment: document.getElementById("searchSegment").value,
        city: document.getElementById("searchCity").value,
        state: document.getElementById("searchState").value,
        keyword: document.getElementById("searchKeyword").value,
        limit: 10
      })
    });
    renderRows(payload.results || [], "search");
    document.querySelector(".opportunities-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    leadTableMessage.textContent = error.message;
  } finally {
    button.innerHTML = originalText;
    button.disabled = false;
  }
});

leadRows.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-save-index]");
  if (!button) return;

  const lead = currentRows[Number(button.dataset.saveIndex)];
  button.textContent = "Salvando...";
  button.disabled = true;

  try {
    await saveLead(lead);
    await loadSavedLeads();
  } catch (error) {
    leadTableMessage.textContent = error.message;
    button.textContent = "Salvar CRM";
    button.disabled = false;
  }
});

leadRows.addEventListener("change", async (event) => {
  const select = event.target.closest("[data-status-id]");
  if (!select) return;

  try {
    await apiFetch(`/api/v1/leads/${select.dataset.statusId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: select.value })
    });
    leadTableMessage.textContent = "Status atualizado no CRM.";
  } catch (error) {
    leadTableMessage.textContent = error.message;
  }
});

document.getElementById("saveApiSettings").addEventListener("click", () => {
  localStorage.setItem("nodere:api-base-url", getApiBaseUrl());
  localStorage.setItem("nodere:api-token", apiTokenInput.value || "");
  settingsMessage.textContent = "Configurações da API salvas neste navegador.";
  loadIntegrationStatus(false);
  loadSavedLeads();
});

document.getElementById("refreshIntegrations").addEventListener("click", () => loadIntegrationStatus(true));
document.getElementById("testAi").addEventListener("click", testAiDiagnosis);
document.getElementById("testPlaces").addEventListener("click", testPlacesSearch);

globalSearch.addEventListener("input", () => {
  const query = globalSearch.value.trim().toLowerCase();
  if (!query) {
    renderRows(allRows, "filtered");
    return;
  }
  renderRows(
    allRows.filter((lead) =>
      [lead.companyName, lead.city, lead.state, lead.segment, lead.phone, lead.website].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    ),
    "filtered"
  );
});

if (location.hash === "#configuracoes") {
  window.setTimeout(() => document.getElementById("configuracoes").scrollIntoView({ behavior: "smooth" }), 200);
}

loadIntegrationStatus(false);
loadSavedLeads();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
