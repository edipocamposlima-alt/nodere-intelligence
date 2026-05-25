const STORAGE = {
  leads: "nodere:leads:v3",
  settings: "nodere:settings:v3",
  legacyLeads: "nodere:leads:v2",
  legacySettings: "nodere:settings:v2"
};

const statuses = ["Novo lead", "Contato iniciado", "Diagnóstico enviado", "Reunião marcada", "Proposta enviada", "Fechado", "Perdido"];
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let leads = readJson(STORAGE.leads, readJson(STORAGE.legacyLeads, []));
let settings = { maxResults: 60, defaultSort: "opportunity", ...readJson(STORAGE.legacySettings, {}), ...readJson(STORAGE.settings, {}) };
let searchResults = [];
let nextPageToken = "";
let lastSearchBody = null;
let currentLeadId = "";

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function showView(id) {
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === id));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.nav === id));
  history.replaceState(null, "", `#${id}`);
  if (id === "dashboard") renderDashboard();
  if (id === "crm") renderCrm();
  if (id === "ia") renderAiLeadSelect();
  if (id === "integracoes") renderIntegrations();
}

function hasKey(name) {
  return Boolean(settings[name] && String(settings[name]).trim());
}

function setMessage(id, text, type = "") {
  const element = document.getElementById(id);
  element.textContent = text;
  element.className = `table-message ${type}`;
}

function scoreLead(lead) {
  let score = 25;
  if (!lead.website) score += 22;
  if (!lead.phone && !lead.whatsapp) score += 12;
  if (!lead.openingHours) score += 8;
  if (Number(lead.rating) && Number(lead.rating) < 4.2) score += 22;
  if (Number(lead.reviews || 0) < 50) score += 16;
  if (!lead.segment) score += 6;
  return Math.min(100, score);
}

function leadProblem(lead) {
  if (!lead.website) return "Sem site";
  if (!lead.phone && !lead.whatsapp) return "Sem telefone";
  if (Number(lead.rating) && Number(lead.rating) < 4.2) return "Baixa avaliação";
  if (Number(lead.reviews || 0) < 50) return "Poucas avaliações";
  if (!lead.openingHours) return "Sem horário";
  return "Perfil pronto para análise";
}

function whatsappUrl(lead) {
  const digits = String(lead.whatsapp || lead.phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  const message = encodeURIComponent(lead.aiMessage || `Olá, tudo bem? Analisei a presença digital da ${lead.company} e identifiquei oportunidades no Google. Posso te mostrar rapidamente?`);
  return `https://wa.me/${number}?text=${message}`;
}

function normalizePlace(place, formData = {}) {
  return {
    tempId: place.id || uid(),
    placeId: place.id || "",
    company: place.displayName?.text || "Empresa sem nome",
    address: place.formattedAddress || "",
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
    whatsapp: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
    email: "",
    website: place.websiteUri || "",
    rating: place.rating || "",
    reviews: place.userRatingCount || 0,
    segment: place.primaryTypeDisplayName?.text || formData.segment || "",
    city: formData.city || "",
    state: formData.state || "",
    mapsUrl: place.googleMapsUri || "",
    openingHours: place.regularOpeningHours?.weekdayDescriptions?.join(" | ") || "",
    source: "Google Places",
    status: "Novo lead",
    notes: "",
    history: []
  };
}

function getFilteredResults() {
  const filter = $("#resultFilter")?.value || "";
  const sort = $("#resultSort")?.value || settings.defaultSort || "opportunity";
  let rows = [...searchResults];
  if (filter === "noWebsite") rows = rows.filter((lead) => !lead.website);
  if (filter === "noPhone") rows = rows.filter((lead) => !lead.phone);
  if (filter === "noWhatsapp") rows = rows.filter((lead) => !lead.whatsapp);
  if (filter === "fewReviews") rows = rows.filter((lead) => Number(lead.reviews || 0) < 50);
  if (filter === "noHours") rows = rows.filter((lead) => !lead.openingHours);
  if (filter === "incomplete") rows = rows.filter((lead) => !lead.website || !lead.phone || !lead.openingHours || !lead.segment);
  rows.sort((a, b) => {
    if (sort === "ratingAsc") return (Number(a.rating) || 99) - (Number(b.rating) || 99);
    if (sort === "ratingDesc") return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (sort === "reviewsAsc") return Number(a.reviews || 0) - Number(b.reviews || 0);
    return scoreLead(b) - scoreLead(a);
  });
  return rows;
}

function renderDashboard() {
  $("#metricLeads").textContent = leads.length;
  $("#metricLowRating").textContent = leads.filter((lead) => Number(lead.rating) && Number(lead.rating) < 4.2).length;
  $("#metricNoSite").textContent = leads.filter((lead) => !lead.website).length;
  $("#metricWhatsapp").textContent = leads.filter((lead) => lead.whatsapp || lead.phone).length;
  $("#funnelList").innerHTML = statuses.map((status) => `<div class="funnel-item"><span>${status}</span><strong>${leads.filter((lead) => lead.status === status).length}</strong></div>`).join("");
}

function renderLeadRows(rows, target, mode) {
  const container = document.getElementById(target);
  if (!rows.length) {
    container.innerHTML = `<div class="empty-state">Nenhum registro encontrado.</div>`;
    return;
  }
  container.innerHTML = `
    <div class="table-row table-head"><span>Empresa</span><span>Contato</span><span>Avaliação</span><span>Score</span><span>Status</span><span>Ações</span></div>
    ${rows.map((lead) => {
      const wa = whatsappUrl(lead);
      const maps = lead.mapsUrl || (lead.address ? `https://maps.google.com/?q=${encodeURIComponent(lead.address)}` : "");
      return `
        <div class="table-row compact-row">
          <div class="company-cell"><span class="logo-ball">${escapeHtml((lead.company || "?").slice(0, 1))}</span><span><strong>${escapeHtml(lead.company)}</strong><small>${escapeHtml([lead.city, lead.state].filter(Boolean).join(", ") || lead.address || "Sem local")}</small></span></div>
          <span>${escapeHtml(lead.phone || lead.whatsapp || lead.email || "Sem contato")}</span>
          <span>${lead.rating ? `${escapeHtml(lead.rating)} ★` : "-"} <small>${lead.reviews ? `${lead.reviews} avaliações` : ""}</small></span>
          <span><b class="score ${scoreLead(lead) >= 70 ? "high" : "mid"}">${scoreLead(lead)}</b><small>${escapeHtml(leadProblem(lead))}</small></span>
          <span>${mode === "crm" ? statusSelect(lead) : `<button class="row-button" data-save-place="${lead.tempId}">Salvar CRM</button>`}</span>
          <span class="actions">
            <button class="row-button" data-open="${mode === "crm" ? lead.id : lead.tempId}" data-mode="${mode}">Ficha</button>
            ${wa ? `<a class="whatsapp" target="_blank" rel="noreferrer" href="${wa}">☏</a>` : ""}
            ${maps ? `<a class="maps" target="_blank" rel="noreferrer" href="${maps}">◆</a>` : ""}
            ${mode === "crm" ? `<button class="row-button danger" data-delete="${lead.id}">Excluir</button>` : ""}
          </span>
        </div>`;
    }).join("")}`;
}

function statusSelect(lead) {
  return `<select class="status blue" data-status="${lead.id}">${statuses.map((status) => `<option ${lead.status === status ? "selected" : ""}>${status}</option>`).join("")}</select>`;
}

function buildSearchBody(form, pageToken = "") {
  const data = Object.fromEntries(new FormData(form));
  const query = [data.segment, data.keyword, data.city, data.state].map((v) => String(v || "").trim()).filter(Boolean).join(" ");
  if (!query) throw new Error("Informe pelo menos segmento, cidade, estado ou palavra-chave.");
  const body = { textQuery: query, languageCode: "pt-BR", regionCode: "BR", maxResultCount: 20 };
  if (pageToken) body.pageToken = pageToken;
  return { body, formData: data };
}

async function searchPlaces(form, append = false) {
  if (!hasKey("googlePlacesKey")) {
    setMessage("searchMessage", "Google Places API não configurada. Abrindo Configurações.", "error");
    showView("configuracoes");
    return;
  }
  const { body, formData } = append && lastSearchBody ? { body: { ...lastSearchBody.body, pageToken: nextPageToken }, formData: lastSearchBody.formData } : buildSearchBody(form);
  setMessage("searchMessage", append ? "Carregando mais empresas..." : "Consultando Google Places...", "loading");
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": settings.googlePlacesKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName,places.regularOpeningHours,nextPageToken"
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "Falha no Google Places.");
  const newRows = (payload.places || []).map((place) => normalizePlace(place, formData));
  searchResults = append ? dedupePlaces([...searchResults, ...newRows]) : newRows;
  nextPageToken = payload.nextPageToken || "";
  lastSearchBody = { body, formData };
  renderLeadRows(getFilteredResults(), "searchResults", "search");
  $("#loadMorePlaces").disabled = !nextPageToken || searchResults.length >= Number(settings.maxResults || 20);
  setMessage("searchMessage", `${searchResults.length} empresa(s) carregada(s). Ordene e filtre para priorizar oportunidades.`, "success");
}

function dedupePlaces(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.placeId || `${row.company}-${row.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function saveLeadFromPlace(tempId) {
  const place = searchResults.find((item) => item.tempId === tempId);
  if (!place) return;
  if (leads.some((lead) => lead.placeId && lead.placeId === place.placeId)) {
    setMessage("searchMessage", "Esse lead já está salvo no CRM.", "warning");
    return;
  }
  const now = nowIso();
  leads.unshift({ ...place, id: uid(), createdAt: now, updatedAt: now, history: [`${new Date().toLocaleString()}: salvo a partir do Google Places`] });
  persistLeads();
  renderDashboard();
  setMessage("searchMessage", "Lead salvo no CRM.", "success");
}

function persistLeads() {
  writeJson(STORAGE.leads, leads);
  renderAiLeadSelect();
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
  currentLeadId = lead.id || "";
  const form = $("#leadForm");
  form.reset();
  $("#leadDialogTitle").textContent = lead.id ? "Ficha da empresa" : "Novo lead";
  Object.entries({ id: lead.id || "", company: lead.company || "", phone: lead.phone || "", whatsapp: lead.whatsapp || "", email: lead.email || "", website: lead.website || "", city: lead.city || "", state: lead.state || "", segment: lead.segment || "", address: lead.address || "", rating: lead.rating || "", reviews: lead.reviews || "", status: lead.status || "Novo lead", notes: lead.notes || "" }).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
  renderLeadAnalysis(lead);
  $("#leadDialog").showModal();
}

function renderLeadAnalysis(lead = {}) {
  const parts = [];
  if (lead.pageSpeed) parts.push(`<strong>PageSpeed</strong><p>Performance ${lead.pageSpeed.performance}/100 | SEO ${lead.pageSpeed.seo}/100 | Acessibilidade ${lead.pageSpeed.accessibility}/100 | Boas práticas ${lead.pageSpeed.bestPractices}/100</p><p>${escapeHtml(lead.pageSpeed.diagnosis || "")}</p>`);
  if (lead.ai) parts.push(`<strong>IA</strong><p>${escapeHtml(lead.ai.summary || lead.ai.diagnosis || "")}</p><p>${escapeHtml(lead.ai.whatsappMessage || "")}</p>`);
  if (lead.history?.length) parts.push(`<strong>Histórico</strong><ul>${lead.history.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
  $("#leadAnalysisBox").innerHTML = parts.join("") || "Histórico, PageSpeed e IA aparecem aqui após salvar análises.";
}

function saveLeadFromForm() {
  const data = Object.fromEntries(new FormData($("#leadForm")));
  const now = nowIso();
  if (data.id) {
    leads = leads.map((lead) => lead.id === data.id ? { ...lead, ...data, updatedAt: now, history: [...(lead.history || []), `${new Date().toLocaleString()}: ficha atualizada`] } : lead);
  } else {
    leads.unshift({ ...data, id: uid(), createdAt: now, updatedAt: now, source: data.source || "Manual", history: [`${new Date().toLocaleString()}: lead criado manualmente`] });
  }
  persistLeads();
  renderCrm();
  renderDashboard();
}

async function runPageSpeed(url, targetId = "pageSpeedResult", leadId = "") {
  if (!hasKey("googlePageSpeedKey")) throw new Error("GOOGLE_PAGESPEED_API_KEY não configurada.");
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("key", settings.googlePageSpeedKey);
  document.getElementById(targetId).textContent = "Analisando PageSpeed...";
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
  result.diagnosis = buildPageSpeedDiagnosis(result);
  result.recommendations = buildPageSpeedRecommendations(result);
  document.getElementById(targetId).innerHTML = `<strong>Resultado</strong><p>Performance: ${result.performance}/100</p><p>SEO: ${result.seo}/100</p><p>Acessibilidade: ${result.accessibility}/100</p><p>Boas práticas: ${result.bestPractices}/100</p><p>${result.diagnosis}</p><ul>${result.recommendations.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  if (leadId) {
    leads = leads.map((lead) => lead.id === leadId ? { ...lead, pageSpeed: result, history: [...(lead.history || []), `${new Date().toLocaleString()}: PageSpeed salvo`] } : lead);
    persistLeads();
    renderLeadAnalysis(leads.find((lead) => lead.id === leadId));
  }
  return result;
}

function buildPageSpeedDiagnosis(result) {
  if (result.performance < 50) return "Site lento com risco alto de perda de conversões.";
  if (result.performance < 80) return "Site aceitável, mas ainda há oportunidades de velocidade e conversão.";
  return "Site com boa performance técnica.";
}

function buildPageSpeedRecommendations(result) {
  const items = [];
  if (result.performance < 80) items.push("Otimizar imagens, cache, scripts e tempo de carregamento mobile.");
  if (result.seo < 90) items.push("Revisar title, meta description, headings e dados estruturados.");
  if (result.accessibility < 90) items.push("Melhorar contraste, labels e navegação acessível.");
  if (result.bestPractices < 90) items.push("Corrigir boas práticas de segurança e compatibilidade.");
  return items.length ? items : ["Manter monitoramento e testar páginas de conversão periodicamente."];
}

async function analyzeLeadWithAi(leadId, targetId = "aiResult") {
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) throw new Error("Selecione um lead.");
  if (!settings.aiEndpoint) throw new Error("Configure um endpoint IA seguro em Configurações.");
  document.getElementById(targetId).textContent = "Analisando com IA...";
  const response = await fetch(settings.aiEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead, pageSpeed: lead.pageSpeed || null })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || payload.message || "Falha no endpoint IA.");
  const ai = payload.diagnosis || payload;
  leads = leads.map((item) => item.id === lead.id ? { ...item, ai, aiMessage: ai.whatsappMessage || item.aiMessage, history: [...(item.history || []), `${new Date().toLocaleString()}: análise IA salva`] } : item);
  persistLeads();
  document.getElementById(targetId).innerHTML = `<strong>${escapeHtml(ai.summary || "Análise gerada")}</strong><p>${escapeHtml(ai.diagnosis || "")}</p><p><b>WhatsApp:</b> ${escapeHtml(ai.whatsappMessage || "")}</p><p><b>Email:</b> ${escapeHtml(ai.emailMessage || "")}</p>`;
  renderLeadAnalysis(leads.find((item) => item.id === lead.id));
}

function renderAiLeadSelect() {
  const options = leads.map((lead) => `<option value="${lead.id}">${escapeHtml(lead.company)}</option>`).join("");
  $("#aiLeadSelect").innerHTML = options || `<option value="">Nenhum lead salvo</option>`;
}

function renderIntegrations() {
  const items = [
    ["googlePlacesKey", "Google Places", "Busca real de empresas"],
    ["googleMapsKey", "Google Maps", "Links e mapas"],
    ["googlePageSpeedKey", "Google PageSpeed", "Performance, SEO e boas práticas"],
    ["aiEndpoint", "IA / OpenAI Backend", "Diagnóstico comercial via endpoint seguro"],
    ["whatsappToken", "WhatsApp Cloud API", "Envio futuro via backend oficial"]
  ];
  $("#integrationGrid").innerHTML = items.map(([key, name, description]) => `<article class="integration-row"><strong>${name}</strong><span>${hasKey(key) ? "Configurado" : "Pendente"}</span><small>${description}</small><div class="settings-actions"><button class="secondary-button" type="button" data-nav="configuracoes">Configurar</button><button class="secondary-button" type="button" data-test="${key}">Testar conexão</button></div></article>`).join("");
}

function loadSettingsForm() {
  Object.entries(settings).forEach(([key, value]) => {
    if ($("#settingsForm").elements[key]) $("#settingsForm").elements[key].value = value;
  });
}

async function testIntegration(key) {
  if (!hasKey(key)) throw new Error("Configuração ausente.");
  if (key === "googlePlacesKey") {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": settings.googlePlacesKey, "X-Goog-FieldMask": "places.id" },
      body: JSON.stringify({ textQuery: "Padaria em Porto Alegre", languageCode: "pt-BR", maxResultCount: 1 })
    });
    if (!response.ok) throw new Error((await response.json()).error?.message || "Places inválido.");
    return "Google Places conectado.";
  }
  if (key === "googlePageSpeedKey") {
    await runPageSpeed("https://www.wikipedia.org", "pageSpeedResult");
    return "PageSpeed conectado.";
  }
  if (key === "aiEndpoint") {
    const response = await fetch(settings.aiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead: { company: "Teste NODERE", website: "https://www.google.com", rating: 4.1, reviews: 22 } })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || payload.message || "Endpoint IA retornou erro.");
    }
    return "Endpoint IA conectado.";
  }
  return "Configuração encontrada.";
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
    searchPlaces($("#placesSearchForm")).catch((error) => setMessage("searchMessage", error.message, "error"));
  });
  $("#placesSearchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    searchResults = [];
    nextPageToken = "";
    searchPlaces(event.target).catch((error) => setMessage("searchMessage", error.message, "error"));
  });
  $("#loadMorePlaces").addEventListener("click", () => {
    if (!nextPageToken) return setMessage("searchMessage", "Não há próxima página disponível para esta busca.", "warning");
    searchPlaces($("#placesSearchForm"), true).catch((error) => setMessage("searchMessage", error.message, "error"));
  });
  $("#resultSort").addEventListener("change", () => renderLeadRows(getFilteredResults(), "searchResults", "search"));
  $("#resultFilter").addEventListener("change", () => renderLeadRows(getFilteredResults(), "searchResults", "search"));
  $("#searchResults").addEventListener("click", (event) => {
    const save = event.target.closest("[data-save-place]");
    const open = event.target.closest("[data-open]");
    if (save) saveLeadFromPlace(save.dataset.savePlace);
    if (open) openLeadDialog(searchResults.find((lead) => lead.tempId === open.dataset.open));
  });
  $("#newLeadButton").addEventListener("click", () => openLeadDialog());
  $("#crmSearch").addEventListener("input", renderCrm);
  $("#crmStatusFilter").addEventListener("change", renderCrm);
  $("#crmTable").addEventListener("click", (event) => {
    const open = event.target.closest("[data-open]");
    const remove = event.target.closest("[data-delete]");
    if (open) openLeadDialog(leads.find((lead) => lead.id === open.dataset.open));
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
    leads = leads.map((lead) => lead.id === select.dataset.status ? { ...lead, status: select.value, updatedAt: nowIso(), history: [...(lead.history || []), `${new Date().toLocaleString()}: status alterado para ${select.value}`] } : lead);
    persistLeads();
    renderCrm();
    renderDashboard();
  });
  $("#leadForm").addEventListener("submit", (event) => { if (event.submitter?.value === "save") saveLeadFromForm(); });
  $("#leadPageSpeedButton").addEventListener("click", () => {
    const lead = leads.find((item) => item.id === currentLeadId);
    const url = lead?.website || $("#leadForm").elements.website.value;
    if (!url) return alert("Informe o site da empresa.");
    runPageSpeed(url, "leadAnalysisBox", currentLeadId).catch((error) => alert(error.message));
  });
  $("#leadAiButton").addEventListener("click", () => analyzeLeadWithAi(currentLeadId, "leadAnalysisBox").catch((error) => alert(error.message)));
  $("#pageSpeedForm").addEventListener("submit", (event) => {
    event.preventDefault();
    runPageSpeed(new FormData(event.target).get("url"), "pageSpeedResult").catch((error) => $("#pageSpeedResult").textContent = error.message);
  });
  $("#dashboardPageSpeedForm").addEventListener("submit", (event) => {
    event.preventDefault();
    runPageSpeed(new FormData(event.target).get("url"), "dashboardPageSpeedResult").catch((error) => $("#dashboardPageSpeedResult").textContent = error.message);
  });
  $("#aiAnalyzeButton").addEventListener("click", () => analyzeLeadWithAi($("#aiLeadSelect").value).catch((error) => $("#aiResult").textContent = error.message));
  $("#settingsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    settings = { ...settings, ...Object.fromEntries(new FormData(event.target)) };
    writeJson(STORAGE.settings, settings);
    $("#settingsMessage").textContent = "Configurações salvas.";
    renderIntegrations();
  });
  $("#clearSettings").addEventListener("click", () => {
    if (!confirm("Apagar configurações locais?")) return;
    settings = { maxResults: 20, defaultSort: "opportunity" };
    writeJson(STORAGE.settings, settings);
    $("#settingsForm").reset();
    loadSettingsForm();
    renderIntegrations();
  });
  $("#validateSettings").addEventListener("click", () => showView("integracoes"));
  $("#integrationGrid").addEventListener("click", async (event) => {
    const nav = event.target.closest("[data-nav]");
    const test = event.target.closest("[data-test]");
    if (nav) showView(nav.dataset.nav);
    if (test) {
      try { alert(await testIntegration(test.dataset.test)); } catch (error) { alert(error.message); }
    }
  });
  $("#testAllIntegrations").addEventListener("click", renderIntegrations);
  $("#globalSearch").addEventListener("input", (event) => {
    $("#crmSearch").value = event.target.value;
    showView("crm");
    renderCrm();
  });
}

function initSelects() {
  $("#crmStatusFilter").innerHTML += statuses.map((status) => `<option>${status}</option>`).join("");
  $("#leadStatusSelect").innerHTML = statuses.map((status) => `<option>${status}</option>`).join("");
}

function init() {
  initSelects();
  loadSettingsForm();
  $("#resultSort").value = settings.defaultSort || "opportunity";
  writeJson(STORAGE.settings, settings);
  writeJson(STORAGE.leads, leads);
  bindEvents();
  renderDashboard();
  renderCrm();
  renderIntegrations();
  renderAiLeadSelect();
  const initial = location.hash?.replace("#", "") || "dashboard";
  showView(["dashboard", "empresas", "crm", "pagespeed", "ia", "integracoes", "configuracoes"].includes(initial) ? initial : "dashboard");
}

init();
