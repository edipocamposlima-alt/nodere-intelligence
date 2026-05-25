const searchForm = document.getElementById("smartSearch");
const navItems = document.querySelectorAll(".nav-item");
const globalSearch = document.querySelector(".global-search input");
const apiBaseUrlInput = document.getElementById("apiBaseUrl");
const apiTokenInput = document.getElementById("apiToken");
const settingsMessage = document.getElementById("settingsMessage");
const integrationStatus = document.getElementById("integrationStatus");

const defaultApiBaseUrl = localStorage.getItem("nodere:api-base-url") || "http://localhost:3333";
apiBaseUrlInput.value = defaultApiBaseUrl;
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
  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Falha ao conectar com a API.");
  }
  return payload;
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
          <strong>${item.name}</strong>
          <span>${labels[status] || status}</span>
          <small>${item.message || item.capability || "Sem detalhes retornados."}</small>
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
          company_name: "Bella Fitness",
          segment: "Academias",
          city: "Porto Alegre",
          google_rating: 3.8,
          google_reviews: 23
        },
        scan: {
          score: 62,
          findings: ["Não responde avaliações", "Sem Google Ads detectado", "Site sem eventos de conversão"]
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
      body: JSON.stringify({ city: "Porto Alegre", segment: "Academia", keyword: "fitness", limit: 3 })
    });
    settingsMessage.textContent = `Google Places respondeu com ${payload.results?.length || 0} empresa(s).`;
  } catch (error) {
    settingsMessage.textContent = error.message;
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = searchForm.querySelector("button");
  const originalText = button.innerHTML;
  button.innerHTML = "<span>⌁</span> Buscando";
  button.disabled = true;

  window.setTimeout(() => {
    button.innerHTML = originalText;
    button.disabled = false;
    document.querySelector(".opportunities-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 650);
});

document.getElementById("saveApiSettings").addEventListener("click", () => {
  localStorage.setItem("nodere:api-base-url", getApiBaseUrl());
  localStorage.setItem("nodere:api-token", apiTokenInput.value || "");
  settingsMessage.textContent = "Configurações da API salvas neste navegador.";
  loadIntegrationStatus(false);
});

document.getElementById("refreshIntegrations").addEventListener("click", () => loadIntegrationStatus(true));
document.getElementById("testAi").addEventListener("click", testAiDiagnosis);
document.getElementById("testPlaces").addEventListener("click", testPlacesSearch);

globalSearch.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  document.querySelector(".opportunities-panel").scrollIntoView({ behavior: "smooth", block: "start" });
});

if (location.hash === "#configuracoes") {
  window.setTimeout(() => document.getElementById("configuracoes").scrollIntoView({ behavior: "smooth" }), 200);
}

loadIntegrationStatus(false);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
