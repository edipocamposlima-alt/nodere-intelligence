const STORAGE = {
  leads: "nodere:leads:v4",
  settings: "nodere:settings:v4",
  chat: "nodere:ai-chat:v1",
  legacyLeads: "nodere:leads:v3",
  legacySettings: "nodere:settings:v3"
};

const statuses = [
  "Novo lead",
  "Primeiro contato",
  "Aguardando retorno",
  "Diagnostico enviado",
  "Reuniao agendada",
  "Proposta enviada",
  "Negociacao",
  "Fechado",
  "Perdido",
  "Sem interesse",
  "Retomar futuramente"
];

const temperatures = ["Frio", "Morno", "Quente"];
const noteTypes = ["Ligacao", "WhatsApp", "Email", "Reuniao", "Diagnostico enviado", "Proposta enviada", "Follow-up", "Objecao", "Informacao interna", "Outro"];
const taskChannels = ["WhatsApp", "Ligacao", "Email", "Reuniao", "Visita", "Outro"];
const priorities = ["Baixa", "Media", "Alta", "Urgente"];
const aiActions = {
  analyze: "Analisar lead",
  history: "Resumir historico",
  approach: "Criar proxima abordagem",
  whatsapp: "Criar WhatsApp",
  email: "Criar email",
  followup: "Criar follow-up",
  diagnosis: "Gerar diagnostico",
  potential: "Analisar potencial",
  proposal: "Criar proposta",
  strategy: "Sugerir estrategia",
  objections: "Identificar objecoes",
  meeting: "Criar resumo da reuniao",
  call: "Criar script de ligacao"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let settings = sanitizeSettings({
  maxResults: 60,
  defaultSort: "opportunity",
  defaultOwner: "Agencia Digital",
  theme: "nodere-dark",
  accentColor: "#147dff",
  hideSavedResults: "on",
  autoAiOnSave: "on",
  apiBaseUrl: "",
  ownerToken: "",
  chatMode: "compact",
  devMode: "off",
  devGoogleApiKey: "",
  devGooglePlacesApiKey: "",
  devGoogleMapsApiKey: "",
  devGooglePageSpeedApiKey: "",
  devOpenAiApiKey: "",
  devGoogleClientId: "",
  devGoogleClientSecret: "",
  devGoogleRefreshToken: "",
  devWhatsappCloudToken: "",
  devWhatsappPhoneNumberId: "",
  ...readJson(STORAGE.legacySettings, {}),
  ...readJson(STORAGE.settings, {})
});
let leads = readJson(STORAGE.leads, readJson(STORAGE.legacyLeads, [])).map(normalizeLead);
let chatMessages = readJson(STORAGE.chat, []);
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

function sanitizeSettings(raw = {}) {
  const allowed = [
    "maxResults", "defaultSort", "defaultOwner", "theme", "accentColor", "hideSavedResults", "autoAiOnSave",
    "apiBaseUrl", "ownerToken", "chatMode", "devMode", "devGoogleApiKey", "devGooglePlacesApiKey",
    "devGoogleMapsApiKey", "devGooglePageSpeedApiKey", "devOpenAiApiKey", "devGoogleClientId",
    "devGoogleClientSecret", "devGoogleRefreshToken", "devWhatsappCloudToken", "devWhatsappPhoneNumberId"
  ];
  return allowed.reduce((acc, key) => {
    if (raw[key] !== undefined) acc[key] = raw[key];
    return acc;
  }, {});
}

function applyTheme() {
  document.body.dataset.theme = settings.theme || "nodere-dark";
  document.documentElement.style.setProperty("--accent", settings.accentColor || "#147dff");
}

function isLocalDev() {
  return ["localhost", "127.0.0.1"].includes(location.hostname);
}

function devModeEnabled() {
  return isLocalDev() && (settings.devMode === "on" || settings.devMode === true);
}

function apiConfigured() {
  return Boolean((settings.apiBaseUrl && String(settings.apiBaseUrl).trim()) || isLocalDev());
}

function apiUrl(path) {
  const base = String(settings.apiBaseUrl || "").trim() || location.origin;
  return `${base.replace(/\/$/, "")}${path}`;
}

function devKeys() {
  if (!devModeEnabled()) return {};
  return {
    googleApiKey: settings.devGoogleApiKey || "",
    googlePlacesApiKey: settings.devGooglePlacesApiKey || settings.devGoogleApiKey || "",
    googleMapsApiKey: settings.devGoogleMapsApiKey || settings.devGoogleApiKey || "",
    googlePageSpeedApiKey: settings.devGooglePageSpeedApiKey || settings.devGoogleApiKey || "",
    openaiApiKey: settings.devOpenAiApiKey || "",
    googleClientId: settings.devGoogleClientId || "",
    googleClientSecret: settings.devGoogleClientSecret || "",
    googleRefreshToken: settings.devGoogleRefreshToken || "",
    whatsappCloudToken: settings.devWhatsappCloudToken || "",
    whatsappPhoneNumberId: settings.devWhatsappPhoneNumberId || ""
  };
}

async function apiFetch(path, options = {}) {
  if (!apiConfigured()) {
    const error = new Error("Configure a URL do backend seguro em Configuracoes para usar APIs reais.");
    error.status = 503;
    throw error;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || 30000));
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (settings.ownerToken) headers.Authorization = `Bearer ${settings.ownerToken}`;
  let body = options.body;
  if (devModeEnabled() && body && typeof body === "string" && headers["Content-Type"]?.includes("application/json")) {
    try {
      body = JSON.stringify({ ...JSON.parse(body), devKeys: devKeys() });
    } catch {
      body = options.body;
    }
  }
  try {
    const response = await fetch(apiUrl(path), { ...options, body, headers, signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || payload.message || `Backend retornou HTTP ${response.status}.`);
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function uid(prefix = "id") {
  return crypto.randomUUID ? crypto.randomUUID() : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function nowIso() {
  return new Date().toISOString();
}

function formatDate(value) {
  if (!value) return "Sem data";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function normalizeLead(raw = {}) {
  const now = raw.createdAt || raw.created_at || nowIso();
  const timeline = Array.isArray(raw.timeline) ? raw.timeline : (raw.history || []).map((item) => ({
    id: uid("event"),
    type: "Historico",
    text: String(item),
    createdAt: now,
    user: raw.owner || settings.defaultOwner || "Agencia Digital"
  }));
  return {
    id: raw.id || uid("lead"),
    tempId: raw.tempId || raw.id || uid("temp"),
    placeId: raw.placeId || raw.googlePlaceId || raw.google_place_id || "",
    company: raw.company || raw.companyName || raw.company_name || "Empresa sem nome",
    contactName: raw.contactName || "",
    role: raw.role || "",
    phone: raw.phone || "",
    whatsapp: raw.whatsapp || raw.phone || "",
    email: raw.email || "",
    website: raw.website || "",
    address: raw.address || "",
    city: raw.city || "",
    state: raw.state || "",
    segment: raw.segment || "",
    rating: raw.rating || raw.googleRating || raw.google_rating || "",
    reviews: raw.reviews || raw.googleReviews || raw.google_reviews || 0,
    mapsUrl: raw.mapsUrl || raw.googleMapsUrl || raw.google_maps_url || "",
    openingHours: raw.openingHours || "",
    owner: raw.owner || settings.defaultOwner || "Agencia Digital",
    temperature: raw.temperature || inferTemperature(raw),
    potential: raw.potential || scoreLead(raw),
    estimatedValue: raw.estimatedValue || "",
    serviceInterest: raw.serviceInterest || "",
    source: raw.source || "Manual",
    status: statuses.includes(raw.status) ? raw.status : migrateStatus(raw.status),
    notesText: raw.notesText || raw.notes || "",
    internalNotes: raw.internalNotes || "",
    notes: Array.isArray(raw.notes) ? raw.notes : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
    timeline,
    aiAnalyses: Array.isArray(raw.aiAnalyses) ? raw.aiAnalyses : (raw.ai ? [{ id: uid("ai"), action: "analyze", result: raw.ai, createdAt: raw.updatedAt || now }] : []),
    pageSpeed: raw.pageSpeed || null,
    ai: raw.ai || null,
    aiMessage: raw.aiMessage || raw.ai?.whatsappMessage || "",
    createdAt: now,
    updatedAt: raw.updatedAt || raw.updated_at || now
  };
}

function migrateStatus(status) {
  const map = {
    "Contato iniciado": "Primeiro contato",
    "Em negociacao": "Negociacao",
    "Reuniao marcada": "Reuniao agendada"
  };
  return map[status] || status || "Novo lead";
}

function persistAll() {
  leads = leads.map(normalizeLead);
  writeJson(STORAGE.leads, leads);
  writeJson(STORAGE.settings, settings);
  writeJson(STORAGE.chat, chatMessages);
  applyTheme();
  renderAll();
}

function showView(id) {
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === id));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.nav === id));
  history.replaceState(null, "", `#${id}`);
  renderAll();
}

function hasKey(name) {
  return Boolean(settings[name] && String(settings[name]).trim());
}

function setMessage(id, text, type = "") {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = text;
  element.className = `table-message ${type}`;
}

function daysSince(value) {
  if (!value) return 999;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
}

function lastContactDate(lead) {
  const contactEvents = [
    ...(lead.notes || []).map((note) => note.createdAt),
    ...(lead.timeline || []).filter((event) => /contato|whatsapp|email|ligacao|reuniao/i.test(event.type + event.text)).map((event) => event.createdAt)
  ].filter(Boolean).sort();
  return contactEvents.at(-1) || lead.updatedAt || lead.createdAt;
}

function nextTask(lead) {
  return (lead.tasks || [])
    .filter((task) => task.status !== "Concluida" && task.status !== "Cancelada")
    .sort((a, b) => new Date(a.dueAt || "2999-01-01") - new Date(b.dueAt || "2999-01-01"))[0];
}

function isOverdue(task) {
  return task?.dueAt && new Date(task.dueAt) < new Date() && task.status !== "Concluida" && task.status !== "Cancelada";
}

function isToday(task) {
  if (!task?.dueAt) return false;
  const due = new Date(task.dueAt);
  const now = new Date();
  return due.toDateString() === now.toDateString() && task.status !== "Concluida" && task.status !== "Cancelada";
}

function leadAlerts(lead) {
  const alerts = [];
  const task = nextTask(lead);
  if (!task) alerts.push("Sem proximo passo");
  if (isOverdue(task)) alerts.push("Follow-up atrasado");
  if (daysSince(lastContactDate(lead)) >= 10 && !["Fechado", "Perdido", "Sem interesse"].includes(lead.status)) alerts.push("Lead esquecido");
  if (!lead.notes?.length && !lead.notesText) alerts.push("Sem observacao");
  if (scoreLead(lead) >= 75) alerts.push("Alta oportunidade");
  return alerts;
}

function scoreLead(lead) {
  let score = 25;
  if (!lead.website) score += 18;
  if (!lead.phone && !lead.whatsapp) score += 10;
  if (!lead.openingHours) score += 6;
  if (Number(lead.rating) && Number(lead.rating) < 4.2) score += 16;
  if (Number(lead.reviews || 0) < 50) score += 14;
  if (lead.temperature === "Quente") score += 14;
  if (lead.estimatedValue) score += 8;
  if (!nextTask(lead)) score += 5;
  return Math.min(100, score);
}

function inferTemperature(lead) {
  const score = scoreLead({ ...lead, temperature: "" });
  if (score >= 75) return "Quente";
  if (score >= 50) return "Morno";
  return "Frio";
}

function leadProblem(lead) {
  if (!lead.website) return "Sem site";
  if (!lead.phone && !lead.whatsapp) return "Sem telefone";
  if (Number(lead.rating) && Number(lead.rating) < 4.2) return "Baixa avaliacao";
  if (Number(lead.reviews || 0) < 50) return "Poucas avaliacoes";
  if (!nextTask(lead)) return "Sem follow-up";
  return "Pronto para evoluir";
}

function whatsappUrl(lead) {
  const digits = String(lead.whatsapp || lead.phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  const message = encodeURIComponent(lead.aiMessage || `Ola, tudo bem? Analisei a presenca digital da ${lead.company} e encontrei oportunidades para gerar mais contatos pelo Google. Posso te mostrar rapidamente?`);
  return `https://wa.me/${number}?text=${message}`;
}

function addTimeline(lead, type, text, user = settings.defaultOwner || "Agencia Digital") {
  lead.timeline = [{ id: uid("event"), type, text, user, createdAt: nowIso() }, ...(lead.timeline || [])];
  lead.updatedAt = nowIso();
}

function normalizeKey(value = "") {
  return String(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}

function leadIdentity(lead = {}) {
  const phone = String(lead.whatsapp || lead.phone || "").replace(/\D/g, "");
  return {
    place: lead.placeId ? `place:${lead.placeId}` : "",
    site: lead.website ? `site:${normalizeKey(lead.website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, ""))}` : "",
    phone: phone ? `phone:${phone}` : "",
    nameAddress: `name:${normalizeKey(lead.company)}:${normalizeKey(lead.address || `${lead.city}${lead.state}`)}`
  };
}

function sameLead(a = {}, b = {}) {
  const ia = leadIdentity(a);
  const ib = leadIdentity(b);
  return Boolean(
    (ia.place && ia.place === ib.place) ||
    (ia.site && ia.site === ib.site) ||
    (ia.phone && ia.phone === ib.phone) ||
    (normalizeKey(a.company) && ia.nameAddress === ib.nameAddress)
  );
}

function savedLeadFor(candidate) {
  return leads.find((lead) => sameLead(lead, candidate));
}

function isSavedLead(candidate) {
  return Boolean(savedLeadFor(candidate));
}

function normalizePlace(place, formData = {}) {
  return normalizeLead({
    tempId: place.id || place.googlePlaceId || place.google_place_id || uid("temp"),
    placeId: place.id || place.googlePlaceId || place.google_place_id || "",
    company: place.displayName?.text || place.companyName || place.company_name || place.name || "Empresa sem nome",
    address: place.formattedAddress || place.address || place.formatted_address || "",
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || place.phone || "",
    whatsapp: place.nationalPhoneNumber || place.internationalPhoneNumber || place.whatsapp || place.phone || "",
    website: place.websiteUri || place.website || "",
    rating: place.rating || place.googleRating || place.google_rating || "",
    reviews: place.userRatingCount || place.googleReviews || place.google_reviews || 0,
    segment: place.primaryTypeDisplayName?.text || place.segment || formData.segment || "",
    city: formData.city || "",
    state: formData.state || "",
    mapsUrl: place.googleMapsUri || place.googleMapsUrl || place.google_maps_url || "",
    openingHours: place.regularOpeningHours?.weekdayDescriptions?.join(" | ") || (Array.isArray(place.openingHours) ? place.openingHours.join(" | ") : place.openingHours || ""),
    source: "Google Places"
  });
}

function renderAll() {
  renderDashboard();
  renderCrm();
  renderAgenda();
  renderPipeline();
  renderReports();
  renderAiLeadSelect();
  renderIntegrations();
  renderChat();
}

function allowedViews() {
  return ["dashboard", "empresas", "crm", "agenda", "pipeline", "pagespeed", "ia", "relatorios", "integracoes", "servicos", "contratos", "templates", "configuracoes"];
}

function renderDashboard() {
  if (!$("#metricLeads")) return;
  const tasks = leads.flatMap((lead) => (lead.tasks || []).map((task) => ({ ...task, lead })));
  const alerts = leads.flatMap((lead) => leadAlerts(lead).map((alert) => ({ alert, lead })));
  $("#metricLeads").textContent = leads.length;
  $("#metricHot").textContent = leads.filter((lead) => lead.temperature === "Quente" || scoreLead(lead) >= 75).length;
  $("#metricOverdue").textContent = tasks.filter(isOverdue).length;
  $("#metricToday").textContent = tasks.filter(isToday).length;
  $("#metricNoFollow").textContent = leads.filter((lead) => !nextTask(lead)).length;
  $("#metricProposal").textContent = leads.filter((lead) => lead.status === "Proposta enviada").length;
  $("#funnelList").innerHTML = statuses.map((status) => `<div class="funnel-item"><span>${status}</span><strong>${leads.filter((lead) => lead.status === status).length}</strong></div>`).join("");
  $("#alertsList").innerHTML = alerts.slice(0, 8).map(({ alert, lead }) => `<div class="alert-row"><strong>${escapeHtml(alert)}</strong><span>${escapeHtml(lead.company)}</span><button class="row-button" data-open-lead="${lead.id}">Abrir</button></div>`).join("") || `<div class="empty-state">Nenhum alerta operacional agora.</div>`;
  $("#todayList").innerHTML = tasks.filter(isToday).slice(0, 8).map(renderTaskRow).join("") || `<div class="empty-state">Nenhum contato para hoje.</div>`;
  renderMiniChart();
}

function renderMiniChart() {
  const total = Math.max(leads.length, 1);
  $("#pipelineChart").innerHTML = statuses.map((status) => {
    const count = leads.filter((lead) => lead.status === status).length;
    return `<div class="chart-row"><span>${status}</span><b style="width:${Math.max(3, (count / total) * 100)}%"></b><strong>${count}</strong></div>`;
  }).join("");
}

function renderTaskRow(task) {
  const lead = task.lead || leads.find((item) => item.id === task.leadId) || {};
  return `<div class="task-row ${isOverdue(task) ? "urgent" : ""}">
    <div><strong>${escapeHtml(task.title || "Follow-up")}</strong><small>${escapeHtml(lead.company || "")} | ${escapeHtml(task.channel || "")} | ${formatDate(task.dueAt)}</small></div>
    <span class="badge">${escapeHtml(task.priority || "Media")}</span>
    <button class="row-button" data-complete-task="${task.id}" data-lead-id="${lead.id || task.leadId}">Concluir</button>
    <button class="row-button" data-open-lead="${lead.id || task.leadId}">Abrir</button>
  </div>`;
}

function renderLeadRows(rows, target, mode) {
  const container = document.getElementById(target);
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = `<div class="empty-state">Nenhum registro encontrado.</div>`;
    return;
  }
  container.innerHTML = `
    <div class="table-row table-head"><span>Empresa</span><span>Contato</span><span>Pipeline</span><span>Score</span><span>Proximo passo</span><span>Acoes</span></div>
    ${rows.map((lead) => {
      const saved = mode !== "crm" ? savedLeadFor(lead) : null;
      const wa = whatsappUrl(lead);
      const maps = lead.mapsUrl || (lead.address ? `https://maps.google.com/?q=${encodeURIComponent(lead.address)}` : "");
      const task = nextTask(lead);
      const site = lead.website || "";
      return `<div class="table-row">
        <div class="company-cell"><span class="logo-ball">${escapeHtml((lead.company || "?").slice(0, 1))}</span><span><strong>${escapeHtml(lead.company)}</strong>${saved ? `<em class="saved-tag">Ja esta no CRM</em>` : ""}<small>${escapeHtml([lead.city, lead.state, lead.segment].filter(Boolean).join(" | ") || "Sem local")}</small></span></div>
        <span>${escapeHtml(lead.phone || lead.whatsapp || lead.email || "Sem contato")}<small>${escapeHtml(lead.contactName || lead.role || "")}</small></span>
        <span>${mode === "crm" ? statusSelect(lead) : saved ? `<button class="row-button" data-open-lead="${saved.id}">Abrir no CRM</button>` : `<button class="row-button accent" data-save-place="${lead.tempId}">Salvar no CRM</button>`}<small>${escapeHtml(lead.temperature)}</small></span>
        <span><b class="score ${scoreLead(lead) >= 75 ? "high" : "mid"}">${scoreLead(lead)}</b><small>${escapeHtml(leadProblem(lead))}</small></span>
        <span>${task ? `${escapeHtml(task.title)}<small>${formatDate(task.dueAt)}</small>` : "Sem follow-up"}</span>
        <span class="actions">
          <button class="row-button" data-open="${mode === "crm" ? lead.id : lead.tempId}" data-mode="${mode}">Ficha</button>
          ${mode !== "crm" ? `<button class="row-button purple" data-ai-preview="${lead.tempId}">Diagnostico IA</button>` : ""}
          ${wa ? `<a class="whatsapp" target="_blank" rel="noreferrer" href="${wa}">WA</a>` : ""}
          ${site ? `<a class="site-link" target="_blank" rel="noreferrer" href="${escapeHtml(site)}">Site</a>` : ""}
          ${maps ? `<a class="maps" target="_blank" rel="noreferrer" href="${maps}">Map</a>` : ""}
          ${lead.phone || lead.whatsapp ? `<button class="row-button" data-copy="${escapeHtml(lead.phone || lead.whatsapp)}">Copiar tel</button>` : ""}
          ${lead.address ? `<button class="row-button" data-copy="${escapeHtml(lead.address)}">Copiar end.</button>` : ""}
          ${mode === "crm" ? `<button class="row-button danger" data-delete="${lead.id}">Excluir</button>` : ""}
        </span>
      </div>`;
    }).join("")}`;
}

function statusSelect(lead) {
  return `<select class="status blue" data-status="${lead.id}">${statuses.map((status) => `<option ${lead.status === status ? "selected" : ""}>${status}</option>`).join("")}</select>`;
}

function getFilteredCrm() {
  const query = ($("#crmSearch")?.value || "").trim().toLowerCase();
  const status = $("#crmStatusFilter")?.value || "";
  const temperature = $("#crmTemperatureFilter")?.value || "";
  const owner = ($("#crmOwnerFilter")?.value || "").trim().toLowerCase();
  const special = $("#crmSpecialFilter")?.value || "";
  return leads.filter((lead) => {
    const notes = (lead.notes || []).map((note) => note.text).join(" ");
    const haystack = [lead.company, lead.contactName, lead.phone, lead.whatsapp, lead.email, lead.city, lead.state, lead.segment, lead.owner, lead.serviceInterest, notes, lead.notesText].join(" ").toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (status && lead.status !== status) return false;
    if (temperature && lead.temperature !== temperature) return false;
    if (owner && !String(lead.owner || "").toLowerCase().includes(owner)) return false;
    if (special === "overdue" && !isOverdue(nextTask(lead))) return false;
    if (special === "noNotes" && lead.notes?.length) return false;
    if (special === "noNextStep" && nextTask(lead)) return false;
    if (special === "hot" && scoreLead(lead) < 75 && lead.temperature !== "Quente") return false;
    return true;
  });
}

function renderCrm() {
  if (!$("#crmTable")) return;
  const rows = getFilteredCrm();
  renderLeadRows(rows, "crmTable", "crm");
  $("#crmMessage").textContent = `${rows.length} lead(s) exibido(s). Dados estruturados salvos neste navegador.`;
}

function renderAgenda() {
  if (!$("#agendaBoard")) return;
  const tasks = leads.flatMap((lead) => (lead.tasks || []).map((task) => ({ ...task, lead })));
  const today = tasks.filter(isToday);
  const overdue = tasks.filter(isOverdue);
  const next = tasks.filter((task) => !isToday(task) && !isOverdue(task) && task.status !== "Concluida" && task.status !== "Cancelada").sort((a, b) => new Date(a.dueAt || "2999-01-01") - new Date(b.dueAt || "2999-01-01"));
  const done = tasks.filter((task) => task.status === "Concluida");
  const noStep = leads.filter((lead) => !nextTask(lead));
  $("#agendaBoard").innerHTML = [
    ["Contatos de hoje", today],
    ["Contatos atrasados", overdue],
    ["Proximos contatos", next.slice(0, 12)],
    ["Tarefas concluidas", done.slice(0, 8)]
  ].map(([title, rows]) => `<article class="panel slim"><h3>${title}</h3>${rows.map(renderTaskRow).join("") || `<div class="empty-state">Nada aqui.</div>`}</article>`).join("") +
  `<article class="panel slim"><h3>Leads sem proximo passo</h3>${noStep.slice(0, 12).map((lead) => `<div class="task-row"><div><strong>${escapeHtml(lead.company)}</strong><small>${escapeHtml(lead.status)}</small></div><button class="row-button" data-open-lead="${lead.id}">Abrir</button></div>`).join("") || `<div class="empty-state">Todos possuem proximo passo.</div>`}</article>`;
}

function renderPipeline() {
  if (!$("#pipelineBoard")) return;
  $("#pipelineBoard").innerHTML = statuses.map((status) => {
    const rows = leads.filter((lead) => lead.status === status);
    return `<section class="pipeline-col" data-pipeline-status="${status}">
      <h3>${status}<span>${rows.length}</span></h3>
      ${rows.map((lead) => `<article class="pipeline-card" draggable="true" data-drag-lead="${lead.id}">
        <strong>${escapeHtml(lead.company)}</strong>
        <small>${escapeHtml([lead.city, lead.segment].filter(Boolean).join(" | "))}</small>
        <div><b class="score ${scoreLead(lead) >= 75 ? "high" : "mid"}">${scoreLead(lead)}</b><span class="badge">${escapeHtml(lead.temperature)}</span></div>
        <button class="row-button" data-open-lead="${lead.id}">Abrir</button>
      </article>`).join("") || `<div class="empty-state">Sem leads</div>`}
    </section>`;
  }).join("");
}

function renderReports() {
  if (!$("#reportsGrid")) return;
  if ($("#reportThemeSelect")) $("#reportThemeSelect").value = settings.theme || "nodere-dark";
  const won = leads.filter((lead) => lead.status === "Fechado").length;
  const lost = leads.filter((lead) => ["Perdido", "Sem interesse"].includes(lead.status)).length;
  const proposals = leads.filter((lead) => lead.status === "Proposta enviada").length;
  const potential = leads.reduce((sum, lead) => sum + Number(String(lead.estimatedValue || "0").replace(/\D/g, "")), 0);
  $("#reportsGrid").innerHTML = [
    ["Conversao", `${leads.length ? Math.round((won / leads.length) * 100) : 0}%`],
    ["Propostas", proposals],
    ["Ganhos", won],
    ["Perdas", lost],
    ["Valor potencial", potential ? potential.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0"],
    ["Produtividade", `${leads.flatMap((lead) => lead.notes || []).length} obs.`]
  ].map(([label, value]) => `<article class="metric-card compact"><div><p>${label}</p><strong>${value}</strong></div></article>`).join("");
  renderMiniChart();
}

function renderIntegrationStatusList(statuses = []) {
  if (!statuses.length) return `<div class="empty-state">Clique em validar para consultar o backend.</div>`;
  return statuses.map((item) => `<article class="integration-row ${escapeHtml(item.status || "")}">
    <strong>${escapeHtml(item.name)}</strong>
    <span>${item.status === "connected" ? "Conectado" : item.status === "error" ? "Erro" : item.configured ? "Pendente" : "Desconectado"}</span>
    <small>${escapeHtml(item.message || (item.configured ? "Credencial encontrada no backend/.env." : "Configure esta chave no backend/.env."))}</small>
    <button class="secondary-button" type="button" data-test="${escapeHtml(item.key)}">Validar</button>
  </article>`).join("");
}

function buildSearchBody(form, pageToken = "") {
  const data = Object.fromEntries(new FormData(form));
  const query = [data.segment, data.keyword, data.city, data.state].map((value) => String(value || "").trim()).filter(Boolean).join(" ");
  if (!query) throw new Error("Informe pelo menos segmento, cidade, estado ou palavra-chave.");
  const body = { textQuery: query, languageCode: "pt-BR", regionCode: "BR", maxResultCount: 20 };
  if (pageToken) body.pageToken = pageToken;
  return { body, formData: data };
}

async function searchPlaces(form, append = false) {
  if (!apiConfigured()) {
    setMessage("searchMessage", "Backend seguro nao configurado. Em localhost, ative o modo desenvolvimento e informe as chaves em Configuracoes.", "error");
    showView("configuracoes");
    return;
  }
  const { body, formData } = append && lastSearchBody ? { body: { ...lastSearchBody.body, pageToken: nextPageToken }, formData: lastSearchBody.formData } : buildSearchBody(form);
  setMessage("searchMessage", append ? "Carregando mais empresas..." : "Consultando Google Places...", "loading");
  const payload = await apiFetch("/api/v1/search/google-places", {
    method: "POST",
    body: JSON.stringify({
      ...formData,
      limit: 20,
      pageToken: body.pageToken || ""
    })
  });
  const newRows = (payload.results || payload.places || []).map((place) => normalizePlace(place, formData));
  searchResults = append ? dedupePlaces([...searchResults, ...newRows]) : newRows;
  searchResults = searchResults.map((lead) => ({ ...lead, aiPreview: localAi("analyze", lead, buildSystemContext()).summary }));
  nextPageToken = payload.nextPageToken || payload.next_page_token || "";
  lastSearchBody = { body, formData };
  renderLeadRows(getFilteredResults(), "searchResults", "search");
  $("#loadMorePlaces").disabled = !nextPageToken || searchResults.length >= Number(settings.maxResults || 60);
  setMessage("searchMessage", `${searchResults.length} empresa(s) carregada(s). Resultados ordenados e prontos para salvar no CRM.`, "success");
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
  if (filter === "hideSaved" || (settings.hideSavedResults === "on" && filter !== "savedOnly")) rows = rows.filter((lead) => !isSavedLead(lead));
  if (filter === "savedOnly") rows = rows.filter((lead) => isSavedLead(lead));
  rows.sort((a, b) => {
    if (sort === "ratingAsc") return (Number(a.rating) || 99) - (Number(b.rating) || 99);
    if (sort === "ratingDesc") return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (sort === "reviewsAsc") return Number(a.reviews || 0) - Number(b.reviews || 0);
    return scoreLead(b) - scoreLead(a);
  });
  return rows;
}

function saveLeadFromPlace(tempId) {
  const place = searchResults.find((item) => item.tempId === tempId);
  if (!place) return;
  const duplicate = savedLeadFor(place);
  if (duplicate) {
    setMessage("searchMessage", "Esse lead ja esta salvo no CRM. Abrindo ficha existente.", "warning");
    openLeadDialog(duplicate);
    return;
  }
  const lead = normalizeLead({ ...place, id: uid("lead"), createdAt: nowIso(), updatedAt: nowIso() });
  addTimeline(lead, "Prospecao", "Lead salvo a partir do Google Places.");
  attachAutomaticAi(lead, "Lead salvo no CRM a partir da busca.");
  leads.unshift(lead);
  persistAll();
  refreshAiInBackground(lead.id, "Lead salvo no CRM a partir da busca.");
  renderLeadRows(getFilteredResults(), "searchResults", "search");
  setMessage("searchMessage", "Lead salvo no CRM com score, timeline e IA local.", "success");
}

function openLeadDialog(lead = {}) {
  const normalized = normalizeLead(lead);
  currentLeadId = normalized.id || "";
  const form = $("#leadForm");
  form.reset();
  $("#leadDialogTitle").textContent = normalized.id && leads.some((item) => item.id === normalized.id) ? "Ficha operacional do lead" : "Novo lead";
  const fields = ["id", "company", "contactName", "role", "phone", "whatsapp", "email", "website", "city", "state", "segment", "address", "rating", "reviews", "owner", "temperature", "potential", "estimatedValue", "serviceInterest", "source", "status", "internalNotes"];
  fields.forEach((field) => {
    if (form.elements[field]) form.elements[field].value = normalized[field] || "";
  });
  renderLeadTabs(normalized);
  $("#leadDialog").showModal();
}

function currentLead() {
  return leads.find((lead) => lead.id === currentLeadId);
}

function saveLeadFromForm() {
  const data = Object.fromEntries(new FormData($("#leadForm")));
  const now = nowIso();
  if (data.id && leads.some((lead) => lead.id === data.id)) {
    leads = leads.map((lead) => {
      if (lead.id !== data.id) return lead;
      const updated = normalizeLead({ ...lead, ...data, updatedAt: now });
      addTimeline(updated, "Ficha", "Dados principais atualizados.");
      attachAutomaticAi(updated, "Lead atualizado na ficha.");
      return updated;
    });
  } else {
    const duplicate = savedLeadFor(data);
    if (duplicate) {
      alert("Este lead ja esta salvo no CRM. Vou abrir a ficha existente.");
      openLeadDialog(duplicate);
      return;
    }
    const lead = normalizeLead({ ...data, id: uid("lead"), createdAt: now, updatedAt: now, source: data.source || "Manual" });
    addTimeline(lead, "Criacao", "Lead criado manualmente.");
    attachAutomaticAi(lead, "Lead criado manualmente.");
    leads.unshift(lead);
    currentLeadId = lead.id;
    setTimeout(() => refreshAiInBackground(lead.id, "Lead criado manualmente."), 0);
  }
  persistAll();
  if (data.id) refreshAiInBackground(data.id, "Lead atualizado na ficha.");
}

function renderLeadTabs(lead) {
  const safeLead = normalizeLead(lead);
  renderLeadOverview(safeLead);
  renderLeadNotes(safeLead);
  renderLeadTasks(safeLead);
  renderLeadTimeline(safeLead);
  renderLeadAi(safeLead);
  renderLeadPageSpeed(safeLead);
}

function activateLeadTab(tabName) {
  $$("#leadTabs [data-tab]").forEach((item) => item.classList.toggle("active", item.dataset.tab === tabName));
  $$(".lead-tab").forEach((tab) => tab.classList.toggle("active", tab.id === `leadTab-${tabName}`));
}

function renderLeadOverview(lead) {
  $("#leadOverview").innerHTML = `
    <div class="client-site-card ${lead.website ? "" : "missing"}">
      <span>Site do cliente</span>
      <strong>${lead.website ? `<a target="_blank" rel="noreferrer" href="${escapeHtml(lead.website)}">${escapeHtml(lead.website)}</a>` : "Este lead nao possui site cadastrado"}</strong>
      <div class="settings-actions">
        <button class="primary-button xl" type="button" data-tab="pagespeed">Analisar PageSpeed</button>
        <button class="secondary-button xl" type="button" data-tab="ia">Analisar com IA</button>
      </div>
    </div>
    <div class="insight-grid">
      <div><small>Score oportunidade</small><strong>${scoreLead(lead)}/100</strong></div>
      <div><small>Temperatura</small><strong>${escapeHtml(lead.temperature)}</strong></div>
      <div><small>Ultimo contato</small><strong>${formatDate(lastContactDate(lead))}</strong></div>
      <div><small>Proximo passo</small><strong>${nextTask(lead)?.title ? escapeHtml(nextTask(lead).title) : "Nao definido"}</strong></div>
    </div>
    <div class="result-box"><strong>Alertas IA locais</strong><ul>${leadAlerts(lead).map((alert) => `<li>${escapeHtml(alert)}</li>`).join("") || "<li>Nenhum alerta critico.</li>"}</ul></div>`;
}

function renderLeadNotes(lead) {
  $("#leadNotesList").innerHTML = (lead.notes || []).map((note) => `<article class="timeline-item">
    <div><strong>${escapeHtml(note.type)}</strong><small>${formatDate(note.createdAt)} | ${escapeHtml(note.user || "")}</small></div>
    <p>${escapeHtml(note.text).replaceAll("\n", "<br>")}</p>
    <button class="row-button danger" data-delete-note="${note.id}">Excluir</button>
  </article>`).join("") || `<div class="empty-state">Nenhuma observacao registrada.</div>`;
}

function renderLeadTasks(lead) {
  $("#leadTasksList").innerHTML = (lead.tasks || []).map((task) => renderTaskRow({ ...task, lead })).join("") || `<div class="empty-state">Nenhuma tarefa ou lembrete.</div>`;
}

function renderLeadTimeline(lead) {
  const items = [
    ...(lead.timeline || []),
    ...(lead.notes || []).map((note) => ({ id: note.id, type: `Obs: ${note.type}`, text: note.text, createdAt: note.createdAt, user: note.user })),
    ...(lead.tasks || []).map((task) => ({ id: task.id, type: `Agenda: ${task.status || "Aberta"}`, text: `${task.title} (${task.channel || "Canal nao definido"})`, createdAt: task.createdAt || task.dueAt, user: task.owner })),
    ...(lead.aiAnalyses || []).map((ai) => ({ id: ai.id, type: "IA", text: ai.result?.summary || ai.result?.diagnosis || ai.text || "Analise IA", createdAt: ai.createdAt, user: "NODERE IA" }))
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  $("#leadTimeline").innerHTML = items.map((item) => `<article class="timeline-item"><div><strong>${escapeHtml(item.type)}</strong><small>${formatDate(item.createdAt)} | ${escapeHtml(item.user || "")}</small></div><p>${escapeHtml(item.text).replaceAll("\n", "<br>")}</p></article>`).join("") || `<div class="empty-state">Timeline vazia.</div>`;
}

function renderLeadAi(lead) {
  const latest = lead.aiAnalyses?.[0]?.result || lead.ai;
  $("#leadAiActions").innerHTML = Object.entries(aiActions).map(([key, label]) => `<button class="secondary-button" type="button" data-ai-action="${key}">${label}</button>`).join("");
  $("#leadAiResult").innerHTML = latest ? renderAiResult(latest) : "Use os botoes para gerar inteligencia operacional contextual.";
}

function renderLeadPageSpeed(lead) {
  $("#leadPageSpeedBox").innerHTML = lead.website
    ? `<div class="client-site-card"><span>Site cadastrado</span><strong><a target="_blank" rel="noreferrer" href="${escapeHtml(lead.website)}">${escapeHtml(lead.website)}</a></strong></div>${lead.pageSpeed ? renderPageSpeedResult(lead.pageSpeed) : "Nenhuma analise PageSpeed salva."}`
    : `<div class="warning">Este lead nao possui site cadastrado.</div>`;
}

function attachAutomaticAi(lead, reason = "Atualizacao automatica") {
  if (settings.autoAiOnSave !== "on") return;
  const ai = localAi("analyze", lead, buildSystemContext(), reason);
  lead.ai = ai;
  lead.aiMessage = ai.whatsappMessage || lead.aiMessage;
  lead.aiAnalyses = [{ id: uid("ai"), action: "auto-save", result: ai, createdAt: nowIso() }, ...(lead.aiAnalyses || [])];
  addTimeline(lead, "IA automatica", `${ai.summary}: ${ai.leadPotential} potencial. ${ai.nextSteps?.[0] || ""}`);
}

function refreshAiInBackground(leadId, reason = "Analise automatica") {
  if (settings.autoAiOnSave !== "on" || !apiConfigured()) return;
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) return;
  requestAi("analyze", lead, reason).then((payload) => {
    const freshLead = leads.find((item) => item.id === leadId);
    if (!freshLead) return;
    const ai = payload.diagnosis || payload;
    freshLead.ai = ai;
    freshLead.aiMessage = ai.whatsappMessage || freshLead.aiMessage;
    freshLead.aiAnalyses = [{ id: uid("ai"), action: "auto-endpoint", result: ai, createdAt: nowIso() }, ...(freshLead.aiAnalyses || [])];
    addTimeline(freshLead, "IA OpenAI", `${ai.summary || "Analise atualizada"} via endpoint seguro.`);
    persistAll();
  }).catch((error) => {
    const freshLead = leads.find((item) => item.id === leadId);
    if (freshLead) addTimeline(freshLead, "IA pendente", `Endpoint IA nao respondeu: ${error.message}`);
    writeJson(STORAGE.leads, leads);
  });
}

function addNote() {
  const lead = currentLead();
  if (!lead) return alert("Salve o lead antes de adicionar observacoes.");
  const text = $("#noteText").value.trim();
  if (!text) return alert("Digite a observacao.");
  const note = { id: uid("note"), type: $("#noteType").value, text, user: $("#noteUser").value || settings.defaultOwner || "Agencia Digital", createdAt: nowIso(), updatedAt: nowIso() };
  lead.notes = [note, ...(lead.notes || [])];
  addTimeline(lead, "Observacao", `${note.type}: ${text.slice(0, 120)}`);
  $("#noteText").value = "";
  persistAll();
  openLeadDialog(lead);
}

function addTask() {
  const lead = currentLead();
  if (!lead) return alert("Salve o lead antes de criar agenda.");
  const title = $("#taskTitle").value.trim();
  if (!title) return alert("Digite o titulo da tarefa.");
  const task = {
    id: uid("task"),
    leadId: lead.id,
    title,
    dueAt: $("#taskDueAt").value,
    priority: $("#taskPriority").value,
    channel: $("#taskChannel").value,
    owner: $("#taskOwner").value || lead.owner || settings.defaultOwner || "Agencia Digital",
    status: "Aberta",
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  lead.tasks = [task, ...(lead.tasks || [])];
  addTimeline(lead, "Agenda", `Tarefa criada: ${task.title} para ${formatDate(task.dueAt)}.`);
  $("#taskTitle").value = "";
  persistAll();
  openLeadDialog(lead);
}

function completeTask(leadId, taskId) {
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) return;
  lead.tasks = (lead.tasks || []).map((task) => task.id === taskId ? { ...task, status: "Concluida", completedAt: nowIso(), updatedAt: nowIso() } : task);
  addTimeline(lead, "Agenda", "Tarefa marcada como concluida.");
  persistAll();
  if ($("#leadDialog").open) openLeadDialog(lead);
}

function deleteNote(noteId) {
  const lead = currentLead();
  if (!lead) return;
  lead.notes = (lead.notes || []).filter((note) => note.id !== noteId);
  addTimeline(lead, "Observacao", "Observacao excluida.");
  persistAll();
  openLeadDialog(lead);
}

async function runPageSpeed(url, targetId = "pageSpeedResult", leadId = "") {
  if (!apiConfigured()) throw new Error("Configure a URL do backend seguro para rodar PageSpeed sem expor chave no navegador.");
  document.getElementById(targetId).textContent = "Analisando PageSpeed...";
  const payload = await apiFetch("/api/v1/pagespeed/analyze", {
    method: "POST",
    body: JSON.stringify({ url }),
    timeoutMs: 45000
  });
  const result = payload.result || payload;
  document.getElementById(targetId).innerHTML = renderPageSpeedResult(result);
  if (leadId) {
    const lead = leads.find((item) => item.id === leadId);
    if (lead) {
      lead.pageSpeed = result;
      addTimeline(lead, "PageSpeed", `Analise salva: performance ${result.performance}/100.`);
      persistAll();
      openLeadDialog(lead);
    }
  }
  return result;
}

function renderPageSpeedResult(result) {
  return `<strong>Resultado</strong><p>Performance: ${result.performance}/100 | SEO: ${result.seo}/100 | Acessibilidade: ${result.accessibility}/100 | Boas praticas: ${result.bestPractices}/100</p><p>${escapeHtml(result.diagnosis)}</p><ul>${result.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function buildPageSpeedDiagnosis(result) {
  if (result.performance < 50) return "Site lento com alto risco de perda de conversoes e aumento do custo por lead.";
  if (result.performance < 80) return "Site aceitavel, mas ainda existe oportunidade clara de velocidade e conversao.";
  return "Site com boa base tecnica para campanhas.";
}

function buildPageSpeedRecommendations(result) {
  const items = [];
  if (result.performance < 80) items.push("Otimizar imagens, cache, scripts e carregamento mobile.");
  if (result.seo < 90) items.push("Revisar title, meta description, headings e dados estruturados.");
  if (result.accessibility < 90) items.push("Melhorar contraste, labels e navegacao acessivel.");
  if (result.bestPractices < 90) items.push("Corrigir boas praticas de seguranca, HTTPS e compatibilidade.");
  return items.length ? items : ["Monitorar paginas de conversao e landing pages antes de escalar midia."];
}

function buildSystemContext() {
  const tasks = leads.flatMap((lead) => (lead.tasks || []).map((task) => ({ ...task, leadCompany: lead.company, leadId: lead.id })));
  return {
    generatedAt: nowIso(),
    totals: {
      leads: leads.length,
      hot: leads.filter((lead) => lead.temperature === "Quente" || scoreLead(lead) >= 75).length,
      overdue: tasks.filter(isOverdue).length,
      today: tasks.filter(isToday).length,
      noFollowUp: leads.filter((lead) => !nextTask(lead)).length
    },
    pipeline: statuses.map((status) => ({ status, count: leads.filter((lead) => lead.status === status).length })),
    priorityLeads: leads.slice().sort((a, b) => scoreLead(b) - scoreLead(a)).slice(0, 8).map((lead) => ({
      id: lead.id,
      company: lead.company,
      status: lead.status,
      score: scoreLead(lead),
      alerts: leadAlerts(lead),
      nextTask: nextTask(lead) || null,
      lastContact: lastContactDate(lead)
    })),
    recentTimeline: leads.flatMap((lead) => (lead.timeline || []).map((event) => ({ ...event, company: lead.company }))).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20)
  };
}

async function requestAi(action, lead = null, question = "") {
  const context = buildSystemContext();
  if (!apiConfigured()) return { mode: "fallback-local", diagnosis: localAi(action, lead, context, question) };
  return apiFetch("/api/openai", {
    method: "POST",
    body: JSON.stringify({
      action,
      question,
      lead,
      context,
      conversation: chatMessages.slice(-12),
      pageSpeed: lead?.pageSpeed || null,
      history: lead?.timeline || [],
      notes: lead?.notes || [],
      tasks: lead?.tasks || []
    }),
    timeoutMs: 45000
  });
}

async function analyzeLeadWithAi(leadId, action = "analyze", targetId = "aiResult") {
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) throw new Error("Selecione um lead.");
  document.getElementById(targetId).textContent = "IA analisando contexto operacional...";
  const payload = await requestAi(action, lead);
  const ai = payload.diagnosis || payload;
  lead.ai = ai;
  lead.aiMessage = ai.whatsappMessage || lead.aiMessage;
  lead.aiAnalyses = [{ id: uid("ai"), action, result: ai, createdAt: nowIso() }, ...(lead.aiAnalyses || [])];
  addTimeline(lead, "IA", `${aiActions[action] || "Analise"}: ${ai.summary || ai.diagnosis || "resultado gerado"}`);
  persistAll();
  document.getElementById(targetId).innerHTML = renderAiResult(ai, payload.mode);
  if ($("#leadDialog").open) openLeadDialog(lead);
}

function renderAiResult(ai, mode = "") {
  return `<strong>${escapeHtml(ai.summary || "Analise operacional")}</strong>
    ${mode ? `<small>Modo: ${escapeHtml(mode)}</small>` : ""}
    <p>${escapeHtml(ai.diagnosis || "").replaceAll("\n", "<br>")}</p>
    ${ai.leadPotential ? `<p><b>Potencial:</b> ${escapeHtml(ai.leadPotential)}</p>` : ""}
    ${ai.priority ? `<p><b>Prioridade:</b> ${escapeHtml(ai.priority)}</p>` : ""}
    ${ai.googleAdsStrategy ? `<p><b>Google Ads:</b> ${escapeHtml(ai.googleAdsStrategy)}</p>` : ""}
    ${ai.nextSteps?.length ? `<p><b>Proximos passos:</b></p><ul>${ai.nextSteps.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
    ${ai.whatsappMessage ? `<p><b>WhatsApp:</b> ${escapeHtml(ai.whatsappMessage)}</p>` : ""}
    ${ai.emailMessage ? `<p><b>Email:</b> ${escapeHtml(ai.emailMessage)}</p>` : ""}
    ${ai.callScript ? `<p><b>Script:</b> ${escapeHtml(ai.callScript)}</p>` : ""}`;
}

function localAi(action, lead, context, question = "") {
  const target = lead || context.priorityLeads?.[0] || {};
  const alerts = lead ? leadAlerts(lead) : [];
  const score = lead ? scoreLead(lead) : 0;
  const company = target.company || "sua carteira";
  const nextSteps = lead ? [
    nextTask(lead) ? `Executar ${nextTask(lead).title} em ${formatDate(nextTask(lead).dueAt)}.` : "Criar follow-up com data e canal definidos.",
    lead.website ? "Auditar pagina principal e propor melhoria de conversao." : "Oferecer criacao ou otimizacao de site/landing page.",
    "Enviar diagnostico curto e convite para conversa de 15 minutos."
  ] : [
    "Priorizar leads quentes e atrasados.",
    "Criar follow-up para leads sem proximo passo.",
    "Revisar propostas sem resposta."
  ];
  const strategy = lead?.segment ? `Campanhas locais por segmento (${lead.segment}), extensoes de chamada, termos de alta intencao e landing page por cidade.` : "Separar campanhas por cidade/servico, medir conversoes e iniciar com termos de alta intencao.";
  return {
    summary: action === "history" ? `Resumo operacional de ${company}` : `Prioridade comercial para ${company}`,
    diagnosis: lead ? `Score ${score}/100. Alertas: ${alerts.join(", ") || "sem alerta critico"}. Status atual: ${lead.status}. Ultimo contato: ${formatDate(lastContactDate(lead))}. ${question}` : `Carteira com ${context.totals.leads} leads, ${context.totals.overdue} atrasados e ${context.totals.noFollowUp} sem proximo passo.`,
    recommendedServices: ["Google Ads local", "Rastreamento de conversoes", "Otimizacao Google Business", "Landing page"],
    whatsappMessage: `Ola, tudo bem? Analisei a presenca digital da ${company} e identifiquei oportunidades para aumentar contatos pelo Google. Posso te mostrar um diagnostico rapido?`,
    emailMessage: `Assunto: oportunidades no Google para ${company}\n\nOla! Fiz uma leitura inicial da presenca digital de voces e encontrei pontos que podem melhorar geracao de contatos e previsibilidade comercial. Posso enviar um diagnostico objetivo?`,
    followUp: "Retomar em 2 dias uteis com diagnostico e convite para reuniao curta.",
    callScript: `Oi, aqui e da NODERE. Vi alguns pontos de melhoria na presenca digital da ${company}, principalmente para gerar contatos via Google. Posso te explicar em 2 minutos?`,
    googleAdsStrategy: strategy,
    leadPotential: score >= 75 ? "Alto" : score >= 50 ? "Medio" : "Baixo",
    priority: alerts.includes("Follow-up atrasado") || score >= 75 ? "Alta" : "Media",
    opportunityScore: score || context.totals.hot,
    nextSteps
  };
}

function renderAiLeadSelect() {
  if (!$("#aiLeadSelect")) return;
  const options = leads.map((lead) => `<option value="${lead.id}">${escapeHtml(lead.company)}</option>`).join("");
  $("#aiLeadSelect").innerHTML = options || `<option value="">Nenhum lead salvo</option>`;
}

function renderChat() {
  if (!$("#chatMessages")) return;
  $("#chatMessages").innerHTML = chatMessages.slice(-30).map((message, index) => `<div class="chat-msg ${message.role}"><strong>${message.role === "user" ? "Voce" : "NODERE IA"}</strong><p>${escapeHtml(message.content).replaceAll("\n", "<br>")}</p>${message.role !== "user" ? `<div class="settings-actions"><button class="row-button" data-copy-chat="${index}">Copiar</button><button class="row-button" data-save-chat-note="${index}">Salvar como observacao</button><button class="row-button" data-save-chat-task="${index}">Criar tarefa</button></div>` : ""}</div>`).join("") || `<div class="empty-state">Pergunte quais leads priorizar, quem esta atrasado ou qual estrategia usar.</div>`;
}

async function sendChat() {
  const input = $("#chatInput");
  const question = input.value.trim();
  if (!question) return;
  chatMessages.push({ role: "user", content: question, createdAt: nowIso() });
  input.value = "";
  chatMessages.push({ role: "assistant", content: "Pensando com o contexto do CRM...", createdAt: nowIso(), loading: true });
  renderChat();
  try {
    const payload = await requestAi("global-chat", null, question);
    const ai = payload.diagnosis || payload;
    chatMessages = chatMessages.filter((message) => !message.loading);
    chatMessages.push({ role: "assistant", content: `${ai.summary || "Analise"}\n${ai.diagnosis || ""}\n${(ai.nextSteps || []).map((item) => `- ${item}`).join("\n")}`, createdAt: nowIso() });
  } catch (error) {
    const fallback = localAi("global-chat", null, buildSystemContext(), question);
    chatMessages = chatMessages.filter((message) => !message.loading);
    chatMessages.push({ role: "assistant", content: `${fallback.summary}\n${fallback.diagnosis}\n${fallback.nextSteps.map((item) => `- ${item}`).join("\n")}`, createdAt: nowIso() });
  }
  persistAll();
}

function copyText(text = "") {
  if (!text) return;
  navigator.clipboard?.writeText(text).then(() => {
    setMessage("searchMessage", "Copiado para a area de transferencia.", "success");
  }).catch(() => {
    prompt("Copie o conteudo:", text);
  });
}

function saveChatAsNote(index) {
  const message = chatMessages.slice(-30)[index];
  const lead = currentLead() || leads[0];
  if (!message || !lead) return alert("Nao ha lead salvo para associar esta resposta.");
  lead.notes = [{ id: uid("note"), type: "Interno", text: message.content, user: "NODERE IA", createdAt: nowIso(), updatedAt: nowIso() }, ...(lead.notes || [])];
  addTimeline(lead, "IA", "Resposta do chat salva como observacao.");
  persistAll();
}

function saveChatAsTask(index) {
  const message = chatMessages.slice(-30)[index];
  const lead = currentLead() || leads[0];
  if (!message || !lead) return alert("Nao ha lead salvo para associar esta tarefa.");
  const due = new Date(Date.now() + 86400000);
  lead.tasks = [{ id: uid("task"), leadId: lead.id, title: message.content.split("\n")[0].slice(0, 90), dueAt: due.toISOString().slice(0, 16), priority: "Media", channel: "Outro", owner: lead.owner || settings.defaultOwner, status: "Aberta", createdAt: nowIso(), updatedAt: nowIso() }, ...(lead.tasks || [])];
  addTimeline(lead, "Agenda", "Tarefa criada a partir de resposta da IA.");
  persistAll();
}

function renderIntegrations() {
  if (!$("#integrationGrid")) return;
  const items = [
    ["apiBaseUrl", "Backend seguro", "API privada para IA, Google, CRM e integrações"],
    ["openai", "OpenAI / ChatGPT", "Agente conversacional server-side"],
    ["google_places", "Google Places", "Busca de empresas via backend"],
    ["google_maps", "Google Maps", "Geocoding e links de mapa via backend"],
    ["google_pagespeed", "Google PageSpeed", "Performance, SEO e boas práticas via backend"],
    ["google_business_profile", "Google Business Profile", "OAuth e dados de perfis gerenciados"],
    ["google_calendar", "Google Calendar", "Agenda comercial via OAuth backend"],
    ["gmail", "Gmail", "Rascunhos e envio de emails via backend"],
    ["google_drive", "Google Drive", "Pastas e documentos de clientes via backend"],
    ["whatsapp_cloud", "WhatsApp Cloud API", "Envio futuro via backend oficial"]
  ];
  $("#integrationGrid").innerHTML = items.map(([key, name, description]) => `<article class="integration-row"><strong>${name}</strong><span>${key === "apiBaseUrl" ? (apiConfigured() ? "Configurado" : "Pendente") : "backend/.env"}</span><small>${description}. ${key !== "apiBaseUrl" ? "Configure esta chave no backend/.env." : ""}</small><div class="settings-actions"><button class="secondary-button" type="button" data-nav="configuracoes">Configurar</button><button class="secondary-button" type="button" data-test="${key}">Validar</button></div></article>`).join("");
}

function loadSettingsForm() {
  document.body.classList.toggle("local-dev", isLocalDev());
  Object.entries(settings).forEach(([key, value]) => {
    const field = $("#settingsForm")?.elements[key];
    if (!field) return;
    if (field.type === "checkbox") field.checked = value === "on" || value === true;
    else field.value = value;
  });
}

async function testIntegration(key) {
  if (!apiConfigured()) throw new Error("URL do backend seguro ausente.");
  if (key === "apiBaseUrl") {
    const health = await apiFetch("/health", { method: "GET" });
    return health.ok ? "Backend conectado." : "Backend respondeu, mas sem status ok.";
  }
  if (key === "openai") {
    const payload = await requestAi("test", normalizeLead({ company: "Teste NODERE", rating: 4.1, reviews: 22 }));
    return payload.mode ? `IA respondeu (${payload.mode}).` : "IA respondeu.";
  }
  if (key === "google_places") {
    await apiFetch("/api/v1/search/google-places", { method: "POST", body: JSON.stringify({ keyword: "padaria", city: "Porto Alegre", limit: 1 }) });
    return "Google Places validado pelo backend.";
  }
  if (key === "google_maps" || key === "google_business_profile" || key === "google_calendar" || key === "gmail" || key === "google_drive" || key === "whatsapp_cloud") {
    const payload = await apiFetch("/api/v1/integrations/test", { method: "POST", body: JSON.stringify({ key }) });
    return payload.integration?.message || `${key} validado pelo backend.`;
  }
  if (key === "google_pagespeed") {
    await apiFetch("/api/v1/pagespeed/analyze", { method: "POST", body: JSON.stringify({ url: "https://www.wikipedia.org" }), timeoutMs: 45000 });
    return "PageSpeed validado pelo backend.";
  }
  const payload = await apiFetch("/api/v1/integrations/status", { method: "POST", body: JSON.stringify({}) });
  return payload.ok ? "Status de integracoes carregado do backend." : "Backend respondeu.";
}

function bindEvents() {
  $$("[data-nav]").forEach((item) => item.addEventListener("click", () => showView(item.dataset.nav)));
  document.addEventListener("click", (event) => {
    const open = event.target.closest("[data-open-lead]");
    const complete = event.target.closest("[data-complete-task]");
    if (open) openLeadDialog(leads.find((lead) => lead.id === open.dataset.openLead));
    if (complete) completeTask(complete.dataset.leadId, complete.dataset.completeTask);
  });
  $("#quickSearchForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    showView("empresas");
    Object.entries(Object.fromEntries(new FormData(event.target))).forEach(([key, value]) => {
      const field = $(`#placesSearchForm [name="${key}"]`);
      if (field) field.value = value;
    });
    searchPlaces($("#placesSearchForm")).catch((error) => setMessage("searchMessage", error.message, "error"));
  });
  $("#placesSearchForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    searchResults = [];
    nextPageToken = "";
    searchPlaces(event.target).catch((error) => setMessage("searchMessage", error.message, "error"));
  });
  $("#loadMorePlaces")?.addEventListener("click", () => {
    if (!nextPageToken) return setMessage("searchMessage", "Nao ha proxima pagina disponivel para esta busca.", "warning");
    searchPlaces($("#placesSearchForm"), true).catch((error) => setMessage("searchMessage", error.message, "error"));
  });
  $("#resultSort")?.addEventListener("change", () => renderLeadRows(getFilteredResults(), "searchResults", "search"));
  $("#resultFilter")?.addEventListener("change", () => renderLeadRows(getFilteredResults(), "searchResults", "search"));
  $("#searchResults")?.addEventListener("click", (event) => {
    const save = event.target.closest("[data-save-place]");
    const open = event.target.closest("[data-open]");
    const preview = event.target.closest("[data-ai-preview]");
    const copy = event.target.closest("[data-copy]");
    if (save) saveLeadFromPlace(save.dataset.savePlace);
    if (open) openLeadDialog(searchResults.find((lead) => lead.tempId === open.dataset.open));
    if (preview) {
      const lead = searchResults.find((item) => item.tempId === preview.dataset.aiPreview);
      if (lead) {
        const ai = localAi("analyze", lead, buildSystemContext());
        alert(`${ai.summary}\n\n${ai.diagnosis}\n\nProximo passo: ${ai.nextSteps?.[0] || ""}`);
      }
    }
    if (copy) copyText(copy.dataset.copy);
  });
  $("#newLeadButton")?.addEventListener("click", () => openLeadDialog({ id: "" }));
  ["crmSearch", "crmStatusFilter", "crmTemperatureFilter", "crmOwnerFilter", "crmSpecialFilter"].forEach((id) => $(`#${id}`)?.addEventListener("input", renderCrm));
  $("#crmTable")?.addEventListener("click", (event) => {
    const open = event.target.closest("[data-open]");
    const remove = event.target.closest("[data-delete]");
    const copy = event.target.closest("[data-copy]");
    if (open) openLeadDialog(leads.find((lead) => lead.id === open.dataset.open));
    if (copy) copyText(copy.dataset.copy);
    if (remove && confirm("Excluir este lead?")) {
      leads = leads.filter((lead) => lead.id !== remove.dataset.delete);
      persistAll();
    }
  });
  $("#crmTable")?.addEventListener("change", (event) => {
    const select = event.target.closest("[data-status]");
    if (!select) return;
    const lead = leads.find((item) => item.id === select.dataset.status);
    if (lead) {
      lead.status = select.value;
      addTimeline(lead, "Pipeline", `Status alterado para ${select.value}.`);
      persistAll();
    }
  });
  $("#leadForm")?.addEventListener("submit", (event) => {
    if (event.submitter?.value === "save") saveLeadFromForm();
  });
  $("#leadTabs")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) return;
    activateLeadTab(button.dataset.tab);
  });
  $("#leadOverview")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (button) activateLeadTab(button.dataset.tab);
  });
  $("#addNoteButton")?.addEventListener("click", addNote);
  $("#addTaskButton")?.addEventListener("click", addTask);
  $("#leadNotesList")?.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-delete-note]");
    if (remove && confirm("Excluir observacao?")) deleteNote(remove.dataset.deleteNote);
  });
  $("#leadAiActions")?.addEventListener("click", (event) => {
    const action = event.target.closest("[data-ai-action]")?.dataset.aiAction;
    if (action) analyzeLeadWithAi(currentLeadId, action, "leadAiResult").catch((error) => $("#leadAiResult").textContent = error.message);
  });
  $("#leadPageSpeedButton")?.addEventListener("click", () => {
    const lead = currentLead();
    const url = lead?.website || $("#leadForm").elements.website.value;
    if (!url) {
      $("#leadPageSpeedBox").innerHTML = `<div class="warning">Este lead nao possui site cadastrado.</div>`;
      return;
    }
    runPageSpeed(url, "leadPageSpeedBox", currentLeadId).catch((error) => $("#leadPageSpeedBox").textContent = error.message);
  });
  $("#leadHeaderPageSpeed")?.addEventListener("click", () => {
    activateLeadTab("pagespeed");
    $("#leadPageSpeedButton")?.click();
  });
  $("#leadHeaderAi")?.addEventListener("click", () => {
    activateLeadTab("ia");
    analyzeLeadWithAi(currentLeadId, "analyze", "leadAiResult").catch((error) => $("#leadAiResult").textContent = error.message);
  });
  $("#pageSpeedForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    runPageSpeed(new FormData(event.target).get("url"), "pageSpeedResult").catch((error) => $("#pageSpeedResult").textContent = error.message);
  });
  $("#dashboardPageSpeedForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    runPageSpeed(new FormData(event.target).get("url"), "dashboardPageSpeedResult").catch((error) => $("#dashboardPageSpeedResult").textContent = error.message);
  });
  $("#aiAnalyzeButton")?.addEventListener("click", () => analyzeLeadWithAi($("#aiLeadSelect").value, $("#aiActionSelect").value, "aiResult").catch((error) => $("#aiResult").textContent = error.message));
  $("#settingsForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    data.hideSavedResults = event.target.elements.hideSavedResults?.checked ? "on" : "off";
    data.autoAiOnSave = event.target.elements.autoAiOnSave?.checked ? "on" : "off";
    data.devMode = event.target.elements.devMode?.checked ? "on" : "off";
    settings = sanitizeSettings({ ...settings, ...data });
    writeJson(STORAGE.settings, settings);
    $("#settingsMessage").textContent = "Configuracoes salvas.";
    persistAll();
  });
  $("#clearSettings")?.addEventListener("click", () => {
    if (!confirm("Apagar configuracoes locais?")) return;
    settings = { maxResults: 60, defaultSort: "opportunity", defaultOwner: "Agencia Digital", theme: "nodere-dark", accentColor: "#147dff", apiBaseUrl: "", ownerToken: "", hideSavedResults: "on", autoAiOnSave: "on", devMode: "off" };
    writeJson(STORAGE.settings, settings);
    $("#settingsForm").reset();
    loadSettingsForm();
    persistAll();
  });
  $("#validateSettings")?.addEventListener("click", () => showView("integracoes"));
  $("#integrationGrid")?.addEventListener("click", async (event) => {
    const nav = event.target.closest("[data-nav]");
    const test = event.target.closest("[data-test]");
    if (nav) showView(nav.dataset.nav);
    if (test) {
      try { alert(await testIntegration(test.dataset.test)); } catch (error) { alert(error.message); }
    }
  });
  $("#testAllIntegrations")?.addEventListener("click", async () => {
    if (!apiConfigured()) return alert("Configure a URL do backend seguro primeiro ou use localhost com modo desenvolvimento.");
    try {
      const payload = await apiFetch("/api/v1/integrations/status?live=1", { method: "POST", body: JSON.stringify({}), timeoutMs: 60000 });
      $("#integrationGrid").innerHTML = renderIntegrationStatusList(payload.integrations || []);
    } catch (error) {
      alert(error.message);
    }
  });
  $("#globalSearch")?.addEventListener("input", (event) => {
    $("#crmSearch").value = event.target.value;
    showView("crm");
  });
  $("#reportThemeSelect")?.addEventListener("change", (event) => {
    settings.theme = event.target.value;
    writeJson(STORAGE.settings, settings);
    applyTheme();
  });
  $("#chatSend")?.addEventListener("click", sendChat);
  $("#sidebarToggle")?.addEventListener("click", () => document.body.classList.toggle("sidebar-collapsed"));
  $("#chatToggle")?.addEventListener("click", () => $("#aiChat")?.classList.remove("collapsed"));
  $("#chatClose")?.addEventListener("click", () => $("#aiChat")?.classList.add("collapsed"));
  $("#chatFullscreen")?.addEventListener("click", () => $("#aiChat")?.classList.toggle("fullscreen"));
  $("#chatClear")?.addEventListener("click", () => {
    if (!confirm("Limpar conversa da IA?")) return;
    chatMessages = [];
    persistAll();
  });
  $("#aiChat")?.addEventListener("click", (event) => {
    const promptButton = event.target.closest("[data-prompt]");
    const copyButton = event.target.closest("[data-copy-chat]");
    const noteButton = event.target.closest("[data-save-chat-note]");
    const taskButton = event.target.closest("[data-save-chat-task]");
    if (promptButton) {
      $("#chatInput").value = promptButton.dataset.prompt;
      sendChat();
    }
    if (copyButton) copyText(chatMessages.slice(-30)[Number(copyButton.dataset.copyChat)]?.content || "");
    if (noteButton) saveChatAsNote(Number(noteButton.dataset.saveChatNote));
    if (taskButton) saveChatAsTask(Number(taskButton.dataset.saveChatTask));
  });
  $("#chatInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  });
  $("#pipelineBoard")?.addEventListener("dragstart", (event) => {
    const card = event.target.closest("[data-drag-lead]");
    if (card) event.dataTransfer.setData("text/plain", card.dataset.dragLead);
  });
  $("#pipelineBoard")?.addEventListener("dragover", (event) => {
    if (event.target.closest("[data-pipeline-status]")) event.preventDefault();
  });
  $("#pipelineBoard")?.addEventListener("drop", (event) => {
    const col = event.target.closest("[data-pipeline-status]");
    const leadId = event.dataTransfer.getData("text/plain");
    const lead = leads.find((item) => item.id === leadId);
    if (col && lead) {
      lead.status = col.dataset.pipelineStatus;
      addTimeline(lead, "Pipeline", `Lead movido para ${lead.status}.`);
      persistAll();
    }
  });
}

function initSelects() {
  $("#crmStatusFilter").innerHTML += statuses.map((status) => `<option>${status}</option>`).join("");
  $("#leadStatusSelect").innerHTML = statuses.map((status) => `<option>${status}</option>`).join("");
  $("#leadTemperatureSelect").innerHTML = temperatures.map((item) => `<option>${item}</option>`).join("");
  $("#crmTemperatureFilter").innerHTML += temperatures.map((item) => `<option>${item}</option>`).join("");
  $("#noteType").innerHTML = noteTypes.map((item) => `<option>${item}</option>`).join("");
  $("#taskChannel").innerHTML = taskChannels.map((item) => `<option>${item}</option>`).join("");
  $("#taskPriority").innerHTML = priorities.map((item) => `<option>${item}</option>`).join("");
  $("#aiActionSelect").innerHTML = Object.entries(aiActions).map(([key, label]) => `<option value="${key}">${label}</option>`).join("");
}

function init() {
  initSelects();
  applyTheme();
  loadSettingsForm();
  if ($("#resultSort")) $("#resultSort").value = settings.defaultSort || "opportunity";
  writeJson(STORAGE.settings, settings);
  writeJson(STORAGE.leads, leads);
  bindEvents();
  const initial = location.hash?.replace("#", "") || "dashboard";
  showView(allowedViews().includes(initial) ? initial : "dashboard");
}

init();
