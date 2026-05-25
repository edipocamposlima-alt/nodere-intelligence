const STORAGE = {
  leads: "nodere:leads:v2",
  settings: "nodere:settings:v2",
  selectedLead: "nodere:selected-lead:v2"
};

const statuses = ["Novo Lead", "Contatado", "Em negociação", "Proposta enviada", "Fechado", "Perdido"];
let leads = readJson(STORAGE.leads, []);
let settings = readJson(STORAGE.settings, {});
let searchResults = [];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nowIso() {
  return new Date().toISOString();
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showView(id) {
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === id));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.nav === id));
  history.replaceState(null, "", `#${id}`);
  if (id === "crm") renderCrm();
  if (id === "integracoes") renderIntegrations();
  if (id === "dashboard") renderDashboard();
}

function hasKey(name) {
  return Boolean(settings[name] && String(settings[name]).trim());
}

function setMessage(id, text, type = "") {
  const element = document.getElementById(id);
  element.textContent = text;
  element.className = `table-message ${type}`;
}

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

function whatsappUrl(lead) {
  const digits = normalizePhone(lead.whatsapp || lead.phone);
  if (!digits) return "";
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  const message = encodeURIComponent(
    lead.aiMessage ||
      `Olá, tudo bem? Analisei a presença digital da ${lead.company} no Google e encontrei oportunidades para melhorar captação e conversões. Posso te mostrar rapidamente?`
  );
  return `https://wa.me/${number}?text=${message}`;
}

function scoreLead(lead) {
  let score = 35;
  if (!lead.website) score += 20;
  if (Number(lead.rating) && Number(lead.rating) < 4.2) score += 20;
  if (Number(lead.reviews || 0) < 50) score += 15;
  if (!lead.phone && !lead.whatsapp) score += 10;
  return Math.min(95, score);
}

function leadProblem(lead) {
  if (!lead.website) return "Sem site detectado";
  if (Number(lead.rating) && Number(lead.rating) < 4.2) return "Baixa avaliação no Google";
  if (Number(lead.reviews || 0) < 50) return "Poucas avaliações";
  return "Pronto para diagnóstico";
}

function renderDashboard() {
  $("#metricLeads").textContent = leads.length;
  $("#metricLowRating").textContent = leads.filter((lead) => Number(lead.rating) && Number(lead.rating) < 4.2).length;
  $("#metricNoSite").textContent = leads.filter((lead) => !lead.website).length;
  $("#metricWhatsapp").textContent = leads.filter((lead) => lead.whatsapp || lead.phone).length;

  const counts = statuses.map((status) => [status, leads.filter((lead) => lead.status === status).length]);
  $("#funnelList").innerHTML = counts
    .map(([status, count]) => `<div class="funnel-item"><span>${escapeHtml(status)}</span><strong>${count}</strong></div>`)
    .join("");
}

function renderLeadRows(rows, target, mode) {
  const container = document.getElementById(target);
  if (!rows.length) {
    container.innerHTML = `<div class="empty-state">Nenhum registro encontrado.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-row table-head">
      <span>Empresa</span><span>Contato</span><span>Avaliação</span><span>Score</span><span>Status</span><span>Ações</span>
    </div>
    ${rows
      .map((lead) => {
        const maps = lead.mapsUrl || (lead.address ? `https://maps.google.com/?q=${encodeURIComponent(lead.address)}` : "");
        const wa = whatsappUrl(lead);
        return `
          <div class="table-row compact-row">
            <div class="company-cell"><span class="logo-ball dark">${escapeHtml((lead.company || "?").slice(0, 1))}</span><span><strong>${escapeHtml(lead.company)}</strong><small>${escapeHtml([lead.city, lead.state].filter(Boolean).join(", ") || lead.address || "Sem local")}</small></span></div>
            <span>${escapeHtml(lead.phone || lead.whatsapp || lead.email || "Sem contato")}</span>
            <span>${lead.rating ? `${escapeHtml(lead.rating)} ★` : "-"} <small>${lead.reviews ? `${lead.reviews} avaliações` : ""}</small></span>
            <span><b class="score ${scoreLead(lead) >= 70 ? "high" : "mid"}">${scoreLead(lead)}</b><small>${escapeHtml(leadProblem(lead))}</small></span>
            <span>${mode === "crm" ? statusSelect(lead) : `<button class="row-button" data-save-place="${lead.tempId}">Salvar CRM</button>`}</span>
            <span class="actions">
              ${wa ? `<a class="whatsapp" target="_blank" rel="noreferrer" href="${wa}">☏</a>` : ""}
              ${maps ? `<a class="maps" target="_blank" rel="noreferrer" href="${maps}">◆</a>` : ""}
              ${mode === "crm" ? `<button class="row-button" data-edit="${lead.id}">Editar</button><button class="row-button danger" data-delete="${lead.id}">Excluir</button>` : ""}
            </span>
          </div>
        `;
      })
      .join("")}
  `;
}

function statusSelect(lead) {
  return `<select class="status blue" data-status="${lead.id}">${statuses
    .map((status) => `<option ${lead.status === status ? "selected" : ""}>${status}</option>`)
    .join("")}</select>`;
}

async function searchPlaces(form, messageId) {
  if (!hasKey("googlePlacesKey")) {
    setMessage(messageId, "Google Places API não configurada. Abrindo Configurações.", "error");
    showView("configuracoes");
    return;
  }

  const data = new FormData(form);
  const query = [data.get("segment"), data.get("keyword"), data.get("city"), data.get("state")].filter(Boolean).join(" ");
  setMessage(messageId, "Consultando Google Places...", "loading");

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": settings.googlePlacesKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName"
    },
    body: JSON.stringify({ textQuery: query, languageCode: "pt-BR", regionCode: "BR", maxResultCount: 10 })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "Falha no Google Places.");

  searchResults = (payload.places || []).map((place) => ({
    tempId: place.id,
    placeId: place.id,
    company: place.displayName?.text || "Empresa sem nome",
    address: place.formattedAddress || "",
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
    whatsapp: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
    website: place.websiteUri || "",
    rating: place.rating || "",
    reviews: place.userRatingCount || 0,
    segment: place.primaryTypeDisplayName?.text || data.get("segment") || "",
    city: data.get("city") || "",
    state: data.get("state") || "",
    mapsUrl: place.googleMapsUri || "",
    source: "Google Places",
    status: "Novo Lead",
    notes: ""
  }));

  renderLeadRows(searchResults, "searchResults", "search");
  setMessage(messageId, `${searchResults.length} empresa(s) reais retornadas pelo Google Places.`, "success");
}

function saveLeadFromPlace(tempId) {
  const place = searchResults.find((item) => item.tempId === tempId);
  if (!place) return;
  const exists = leads.some((lead) => lead.placeId && lead.placeId === place.placeId);
  if (exists) {
    setMessage("searchMessage", "Esse lead já está salvo no CRM.", "warning");
    return;
  }
  const now = nowIso();
  leads.unshift({ ...place, id: uid(), createdAt: now, updatedAt: now });
  persistLeads();
  setMessage("searchMessage", "Lead salvo no CRM.", "success");
  renderDashboard();
}

function persistLeads() {
  writeJson(STORAGE.leads, leads);
}

function renderCrm() {
  const query = $("#crmSearch").value.trim().toLowerCase();
  const status = $("#crmStatusFilter").value;
  const rows = leads.filter((lead) => {
    const haystack = [lead.company, lead.city, lead.state, lead.segment, lead.phone, lead.email].join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && (!status || lead.status === status);
  });
  renderLeadRows(rows, "crmTable", "crm");
  $("#crmMessage").textContent = `${rows.length} lead(s) exibido(s).`;
}

function openLeadDialog(lead = {}) {
  const form = $("#leadForm");
  form.reset();
  $("#leadDialogTitle").textContent = lead.id ? "Editar lead" : "Novo lead";
  Object.entries({
    id: lead.id || "",
    company: lead.company || "",
    phone: lead.phone || "",
    whatsapp: lead.whatsapp || "",
    email: lead.email || "",
    website: lead.website || "",
    city: lead.city || "",
    state: lead.state || "",
    segment: lead.segment || "",
    source: lead.source || "Manual",
    status: lead.status || "Novo Lead",
    notes: lead.notes || ""
  }).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field) field.value = value;
  });
  $("#leadDialog").showModal();
}

function saveLeadFromForm() {
  const form = $("#leadForm");
  const data = Object.fromEntries(new FormData(form));
  const now = nowIso();
  if (data.id) {
    leads = leads.map((lead) => (lead.id === data.id ? { ...lead, ...data, updatedAt: now } : lead));
  } else {
    leads.unshift({ ...data, id: uid(), createdAt: now, updatedAt: now });
  }
  persistLeads();
  renderCrm();
  renderDashboard();
}

function renderIntegrations() {
  const items = [
    ["googlePlacesKey", "Google Places", "Busca real de empresas"],
    ["googleMapsKey", "Google Maps", "Links e mapas"],
    ["googlePageSpeedKey", "Google PageSpeed", "Performance, SEO e boas práticas"],
    ["openaiKey", "OpenAI", "Análise comercial com IA"],
    ["whatsappToken", "WhatsApp Cloud API", "Envio futuro via API oficial"]
  ];
  $("#integrationGrid").innerHTML = items
    .map(([key, name, description]) => `
      <article class="integration-row ${hasKey(key) ? "pending_validation" : "pending"}">
        <strong>${name}</strong>
        <span>${hasKey(key) ? "Configurado" : "Pendente"}</span>
        <small>${description}</small>
        <div class="settings-actions">
          <button class="secondary-button" type="button" data-nav="configuracoes">Configurar</button>
          <button class="secondary-button" type="button" data-test="${key}">Testar conexão</button>
        </div>
      </article>
    `)
    .join("");
}

function loadSettingsForm() {
  const form = $("#settingsForm");
  Object.entries(settings).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
}

async function testIntegration(key) {
  if (!hasKey(key)) throw new Error("Chave não configurada.");
  if (key === "googlePlacesKey") {
    const form = new FormData();
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.googlePlacesKey,
        "X-Goog-FieldMask": "places.id"
      },
      body: JSON.stringify({ textQuery: "Padaria em Porto Alegre", languageCode: "pt-BR", maxResultCount: 1 })
    });
    if (!response.ok) throw new Error((await response.json()).error?.message || "Places inválido.");
    return "Google Places conectado.";
  }
  if (key === "googlePageSpeedKey") {
    return testPageSpeed("https://www.wikipedia.org", true);
  }
  if (key === "googleMapsKey") return "Google Maps configurado. Os links de Maps funcionam via URL pública.";
  if (key === "openaiKey") {
    if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
      throw new Error("Por segurança, OpenAI direto no frontend está bloqueado em produção. Use backend /api/openai.");
    }
    return "OpenAI configurado para teste local.";
  }
  if (key === "whatsappToken") return "Token salvo. Envio via Cloud API deve ser feito no backend.";
  return "Configuração encontrada.";
}

async function testPageSpeed(url, silent = false) {
  if (!hasKey("googlePageSpeedKey")) throw new Error("GOOGLE_PAGESPEED_API_KEY não configurada.");
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("key", settings.googlePageSpeedKey);
  const response = await fetch(endpoint);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "Falha no PageSpeed.");
  const categories = payload.lighthouseResult?.categories || {};
  const result = {
    performance: Math.round((categories.performance?.score || 0) * 100),
    seo: Math.round((categories.seo?.score || 0) * 100),
    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((categories["best-practices"]?.score || 0) * 100)
  };
  if (silent) return `PageSpeed OK. Performance ${result.performance}/100.`;
  $("#pageSpeedResult").innerHTML = `<strong>Resultado PageSpeed</strong><p>Performance: ${result.performance}/100</p><p>SEO: ${result.seo}/100</p><p>Acessibilidade: ${result.accessibility}/100</p><p>Boas práticas: ${result.bestPractices}/100</p>`;
}

function analyzeLeadLocally() {
  const lead = leads[0];
  if (!lead) {
    $("#aiResult").textContent = "Crie ou salve um lead antes de analisar.";
    return;
  }
  if (!hasKey("openaiKey")) {
    $("#aiResult").textContent = "OPENAI_API_KEY não configurada. Configure a chave ou use backend /api/openai em produção.";
    return;
  }
  if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    $("#aiResult").textContent = "Chave OpenAI não será enviada pelo GitHub Pages. Para IA real em produção, publique o backend seguro /api/openai.";
    return;
  }
  const message = `Olá, tudo bem? Notei que a ${lead.company} pode melhorar captação pelo Google. Posso te mostrar um diagnóstico rápido?`;
  leads = leads.map((item) => (item.id === lead.id ? { ...item, aiMessage: message, updatedAt: nowIso() } : item));
  persistLeads();
  $("#aiResult").innerHTML = `<strong>${escapeHtml(lead.company)}</strong><p>Resumo: ${escapeHtml(leadProblem(lead))}.</p><p>Abordagem sugerida: contato consultivo com foco em presença local, avaliações e conversão.</p><p>WhatsApp: ${escapeHtml(message)}</p>`;
  renderCrm();
}

function bindEvents() {
  $$("[data-nav]").forEach((item) => item.addEventListener("click", () => showView(item.dataset.nav)));
  $("#quickSearchForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    showView("empresas");
    Object.entries(Object.fromEntries(new FormData(event.target))).forEach(([key, value]) => {
      const field = $(`#placesSearchForm [name="${key}"]`);
      if (field) field.value = value;
    });
    await searchPlaces($("#placesSearchForm"), "searchMessage").catch((error) => setMessage("searchMessage", error.message, "error"));
  });
  $("#placesSearchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    searchPlaces(event.target, "searchMessage").catch((error) => setMessage("searchMessage", error.message, "error"));
  });
  $("#searchResults").addEventListener("click", (event) => {
    const button = event.target.closest("[data-save-place]");
    if (button) saveLeadFromPlace(button.dataset.savePlace);
  });
  $("#newLeadButton").addEventListener("click", () => openLeadDialog());
  $("#crmSearch").addEventListener("input", renderCrm);
  $("#crmStatusFilter").addEventListener("change", renderCrm);
  $("#crmTable").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit]");
    const remove = event.target.closest("[data-delete]");
    if (edit) openLeadDialog(leads.find((lead) => lead.id === edit.dataset.edit));
    if (remove && confirm("Excluir este lead?")) {
      leads = leads.filter((lead) => lead.id !== remove.dataset.delete);
      persistLeads();
      renderCrm();
      renderDashboard();
    }
  });
  $("#crmTable").addEventListener("change", (event) => {
    const select = event.target.closest("[data-status]");
    if (!select) return;
    leads = leads.map((lead) => (lead.id === select.dataset.status ? { ...lead, status: select.value, updatedAt: nowIso() } : lead));
    persistLeads();
    renderCrm();
    renderDashboard();
  });
  $("#leadForm").addEventListener("submit", (event) => {
    if (event.submitter?.value === "save") saveLeadFromForm();
  });
  $("#settingsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    settings = Object.fromEntries(new FormData(event.target));
    writeJson(STORAGE.settings, settings);
    $("#settingsMessage").textContent = "Configurações salvas localmente.";
    renderIntegrations();
  });
  $("#clearSettings").addEventListener("click", () => {
    if (!confirm("Apagar todas as chaves locais?")) return;
    settings = {};
    writeJson(STORAGE.settings, settings);
    $("#settingsForm").reset();
    renderIntegrations();
    $("#settingsMessage").textContent = "Chaves apagadas.";
  });
  $("#validateSettings").addEventListener("click", async () => {
    renderIntegrations();
    $("#settingsMessage").textContent = "Use Integrações > Testar conexão para validar cada API.";
  });
  $("#integrationGrid").addEventListener("click", async (event) => {
    const nav = event.target.closest("[data-nav]");
    const test = event.target.closest("[data-test]");
    if (nav) showView(nav.dataset.nav);
    if (test) {
      try {
        const result = await testIntegration(test.dataset.test);
        alert(result);
      } catch (error) {
        alert(error.message);
      }
    }
  });
  $("#testAllIntegrations").addEventListener("click", renderIntegrations);
  $("#pageSpeedForm").addEventListener("submit", (event) => {
    event.preventDefault();
    $("#pageSpeedResult").textContent = "Analisando...";
    testPageSpeed(new FormData(event.target).get("url")).catch((error) => {
      $("#pageSpeedResult").textContent = error.message;
    });
  });
  $("#aiAnalyzeButton").addEventListener("click", analyzeLeadLocally);
  $("#globalSearch").addEventListener("input", (event) => {
    $("#crmSearch").value = event.target.value;
    showView("crm");
    renderCrm();
  });
}

function init() {
  loadSettingsForm();
  bindEvents();
  renderDashboard();
  renderCrm();
  renderIntegrations();
  const initial = location.hash?.replace("#", "") || "dashboard";
  showView(["dashboard", "empresas", "crm", "integracoes", "configuracoes"].includes(initial) ? initial : "dashboard");
}

init();
