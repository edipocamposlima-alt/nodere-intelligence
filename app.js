let leads = [
  {
    name: "Odonto Prime Paulista",
    city: "Sao Paulo, SP",
    segment: "Clinica odontologica",
    score: 86,
    cnpj: "42.918.771/0001-20",
    whatsapp: "11 94444-1200",
    whatsappNumber: "5511944441200",
    site: "lento e sem tags",
    google: "3,8 estrelas | 12 avaliacoes",
    flags: ["Sem Ads", "Sem GTM", "SEO local fraco"],
    diagnosis: "Potencial alto para campanhas de ligacao e WhatsApp.",
  },
  {
    name: "Bella Forma Estetica",
    city: "Campinas, SP",
    segment: "Clinica estetica",
    score: 82,
    cnpj: "18.604.512/0001-77",
    whatsapp: "19 95555-3400",
    whatsappNumber: "5519955553400",
    site: "mobile lento",
    google: "4,1 estrelas | 23 avaliacoes",
    flags: ["Sem pixel", "Site lento", "Poucas avaliacoes"],
    diagnosis: "Boa demanda local e baixa maturidade de rastreamento.",
  },
  {
    name: "Auto Center Vila Nova",
    city: "Santos, SP",
    segment: "Oficina mecanica",
    score: 79,
    cnpj: "09.481.330/0001-42",
    whatsapp: "13 96666-7800",
    whatsappNumber: "5513966667800",
    site: "nao encontrado",
    google: "4,4 estrelas | 31 avaliacoes",
    flags: ["Sem site", "Sem WhatsApp", "Perfil incompleto"],
    diagnosis: "Alta oportunidade para presenca local e campanhas Maps.",
  },
  {
    name: "Instituto Vida Plena",
    city: "Belo Horizonte, MG",
    segment: "Saude",
    score: 91,
    cnpj: "31.772.894/0001-16",
    whatsapp: "31 97777-4500",
    whatsappNumber: "5531977774500",
    site: "sem conversoes",
    google: "4,6 estrelas | 44 avaliacoes",
    flags: ["Sem conversao", "Sem remarketing", "Ads ausente"],
    diagnosis: "Cenario ideal para funil de captacao com landing page.",
  },
  {
    name: "Solar Tech Energia",
    city: "Curitiba, PR",
    segment: "Energia solar",
    score: 76,
    cnpj: "27.115.603/0001-02",
    whatsapp: "41 98888-2200",
    whatsappNumber: "5541988882200",
    site: "SEO ruim e GA4 ausente",
    google: "4,0 estrelas | 18 avaliacoes",
    flags: ["SEO ruim", "Baixa velocidade", "GA4 ausente"],
    diagnosis: "Ticket alto, concorrencia ativa e lacunas tecnicas claras.",
  },
];

const risks = [
  ["Sem conversao configurada", 82],
  ["Sem Google Ads ativo", 74],
  ["Perfil Google incompleto", 68],
  ["Sem pixel Meta", 61],
  ["Sem WhatsApp visivel", 48],
  ["Site com baixa velocidade", 44],
];

const auditItems = [
  ["Google Meu Negocio", "Perfil incompleto, poucas fotos e baixa frequencia de posts.", "warn"],
  ["Google Ads", "Nenhum anuncio ativo encontrado para termos comerciais locais.", "bad"],
  ["Tags e pixels", "GTM, GA4, Meta Pixel e conversoes nao detectados.", "bad"],
  ["SEO basico", "Titulo duplicado, schema ausente e baixa autoridade local.", "warn"],
  ["Site", "Mobile lento, CTA fraco e sem botao de WhatsApp persistente.", "warn"],
  ["Redes sociais", "Instagram ativo, mas sem integracao com funil comercial.", "good"],
  ["Potencial comercial", "Alto ticket medio e demanda recorrente por captacao.", "good"],
  ["Palavras-chave", "implante, clareamento, dentista 24h, ortodontia.", "good"],
];

const stages = [
  "Lead novo",
  "Contato iniciado",
  "Diagnostico enviado",
  "Reuniao marcada",
  "Proposta enviada",
  "Fechado",
  "Perdido",
];

const crmStages = [
  ["lead_new", "Lead novo"],
  ["contact_started", "Contato iniciado"],
  ["diagnosis_sent", "Diagnostico enviado"],
  ["meeting_scheduled", "Reuniao marcada"],
  ["proposal_sent", "Proposta enviada"],
  ["won", "Fechado"],
  ["lost", "Perdido"],
];

const integrations = [
  "Google Maps API",
  "Google Places API",
  "Google Ads API",
  "Meta API",
  "WhatsApp API",
  "LinkedIn",
  "Apollo.io",
  "Hunter.io",
  "Clearbit",
  "Receita Federal",
  "Serasa",
  "HubSpot",
];

const teamMembers = [
  { name: "Édipo Lima", role: "Owner", status: "Ativo", access: "Todas as areas" },
  { name: "Ana Comercial", role: "Closer", status: "Ativo", access: "CRM e relatorios" },
  { name: "Rafael Ops", role: "Analista", status: "Ativo", access: "Busca e auditoria" },
  { name: "Marina SDR", role: "SDR", status: "Pendente", access: "Leads e tarefas" },
];

const moduleCatalog = [
  { id: "dashboard", label: "Dashboard", description: "Indicadores, mapa e ranking de oportunidades" },
  { id: "search", label: "Buscador", description: "Busca inteligente e filtros avancados" },
  { id: "scanner", label: "Scanner", description: "Buscas salvas, filas e alertas" },
  { id: "google", label: "Google", description: "Ads, Perfil da Empresa e performance local" },
  { id: "company", label: "Empresa", description: "Diagnostico, auditoria e dados do lead" },
  { id: "crm", label: "CRM", description: "Pipeline, tarefas e follow-up" },
  { id: "automation", label: "Automacao", description: "Mensagens, emails e alertas automaticos" },
  { id: "inbox", label: "Inbox", description: "Conversas, respostas e SLA comercial" },
  { id: "copilot", label: "Copilot IA", description: "Previsao, ROI e proposta automatica" },
  { id: "diagnosis", label: "Diagnóstico", description: "Relatório PDF e proposta para o lead" },
  { id: "reports", label: "Relatorios", description: "Exportacoes e inteligencia executiva" },
  { id: "admin", label: "Admin", description: "Usuarios, permissoes e integracoes" },
  { id: "billing", label: "Planos", description: "Assinatura, créditos, limites e faturas" },
  { id: "performance", label: "Performance", description: "Metas, produtividade e forecast comercial" },
];

const allModuleIds = moduleCatalog.map((module) => module.id);
const storedTeamMembers = JSON.parse(localStorage.getItem("eli:team-members") || "null");
if (storedTeamMembers) {
  teamMembers.splice(0, teamMembers.length, ...storedTeamMembers);
} else {
  teamMembers.forEach((member, index) => {
    member.id = ["owner", "ana", "rafael", "marina"][index] || `user-${index + 1}`;
    member.permissions =
      index === 0
        ? allModuleIds
        : index === 1
          ? ["dashboard", "search", "company", "crm", "automation", "inbox", "copilot", "diagnosis", "reports"]
          : index === 2
            ? ["dashboard", "search", "scanner", "google", "company", "diagnosis", "reports"]
            : ["dashboard", "search", "company", "crm", "automation", "inbox"];
  });
}

teamMembers.forEach((member, index) => {
  member.id = member.id || `user-${index + 1}`;
  member.permissions = Array.isArray(member.permissions) && member.permissions.length ? member.permissions : index === 0 ? allModuleIds : ["dashboard", "search", "company"];
});

const storedSessionUserId = localStorage.getItem("eli:session-user");
let sessionUserId = storedSessionUserId || "owner";
let activeAccessUserId = sessionUserId;
let editingAccessUserId = "owner";

const permissions = [
  ["Owner", true, true, true, true],
  ["Admin", true, true, true, false],
  ["Closer", true, true, false, false],
  ["SDR", true, false, false, false],
];

const apiStatus = [
  ["Google Places API", "Pronto para conectar", "Busca e enriquecimento local", "setup"],
  ["Google Ads API", "Planejado", "Sinais de anuncios e oportunidades", "roadmap"],
  ["Meta API", "Planejado", "Pixel, audiencia e remarketing", "roadmap"],
  ["WhatsApp API", "Pronto para conectar", "Contato rapido e automacoes", "setup"],
  ["Receita Federal", "Planejado", "CNPJ, razao social e porte", "roadmap"],
  ["HubSpot", "Opcional", "Sincronizacao CRM externa", "optional"],
];

const defaultSavedSearches = [
  { id: 1, title: "Clinicas odontologicas em SP", filters: "Sao Paulo · implante dentario · sem Google Ads", leads: 184, cadence: "Diaria" },
  { id: 2, title: "Estetica premium no Sudeste", filters: "Campinas, BH e Curitiba · sem pixel · ticket alto", leads: 96, cadence: "Semanal" },
  { id: 3, title: "Energia solar sem tracking", filters: "Sul · GA4 ausente · SEO fraco", leads: 72, cadence: "A cada 3 dias" },
];

let savedSearches = JSON.parse(localStorage.getItem("eli:saved-searches") || "null") || defaultSavedSearches;

let scanQueue = [
  { name: "Google Places enrichment", status: "Rodando", progress: 72 },
  { name: "Scanner SEO e velocidade", status: "Aguardando", progress: 38 },
  { name: "Detector de tags e pixels", status: "Rodando", progress: 64 },
  { name: "IA de diagnostico comercial", status: "Pronto", progress: 100 },
];

const commercialAlerts = [
  ["Lead quente sem conversao", "18 empresas com score acima de 85 e rastreamento ausente.", "Alta prioridade"],
  ["Nicho em alta", "Clinicas esteticas aparecem com ticket medio maior nesta semana.", "Insight"],
  ["Follow-up pendente", "7 propostas sem resposta ha mais de 48 horas.", "Acao comercial"],
  ["Falha recorrente", "Sem Meta Pixel aparece em 61% das empresas analisadas.", "Oportunidade"],
  ["Cidade promissora", "Campinas concentra empresas com baixa maturidade e boa nota Google.", "Expansao"],
  ["Oferta recomendada", "Pacote tracking + Google Ads tem melhor aderencia nos leads atuais.", "Receita"],
];

const googleBusinessSignals = [
  ["Ficha reivindicada", "Detecta se a empresa controla o Perfil da Empresa.", "Perfil"],
  ["Completude do perfil", "Nome, categoria, descrição, endereço, telefone, site, horários e atributos.", "Dados"],
  ["Avaliações", "Volume, nota média, frequência, sentimento e respostas pendentes.", "Reputação"],
  ["Posts e ofertas", "Frequência de publicações, eventos, novidades e ofertas locais.", "Conteúdo"],
  ["Perguntas e respostas", "Perguntas abertas e temas recorrentes de objeção comercial.", "Q&A"],
  ["Fotos", "Quantidade, atualização e qualidade do acervo visual.", "Visual"],
  ["Performance local", "Chamadas, rotas, cliques no site e buscas por período.", "Performance"],
  ["Notificações", "Alertas de novas avaliações, atualizações e mudanças no perfil.", "Monitoramento"],
];

const googleAdsSignals = [
  ["Conversões", "Ações de conversão, tag snippet, chamadas, formulários e enhanced conversions.", "Tracking"],
  ["Campanhas ativas", "Busca, Performance Max, chamadas, locais e estrutura por objetivo.", "Mídia"],
  ["Assets", "Sitelinks, chamadas, frases de destaque, lead form, imagens e RSA.", "Criativos"],
  ["Recomendações", "Oportunidades de assets, palavras, lances, orçamento e força do anúncio.", "Otimização"],
  ["Palavras-chave", "Termos locais, intenção comercial, negativas e lacunas por nicho.", "Pesquisa"],
  ["Extensões de local", "Ligação entre presença local e campanhas do anunciante.", "Local"],
  ["Lead forms", "Formulários nativos, qualidade do lead e integração CRM.", "Captação"],
  ["Offline conversions", "Importação de vendas, reuniões e fechamentos para melhorar lances.", "Receita"],
];

const googleModules = [
  ["GBP Health Score", "Pontua ficha, reputação, conteúdo, fotos e engajamento local.", "Business Profile"],
  ["Review Radar", "Monitora novas avaliações e sugere respostas com IA.", "Business Profile"],
  ["Local Performance", "Acompanha chamadas, rotas, cliques e buscas por localização.", "Business Profile"],
  ["Ads Readiness", "Verifica conversões, tags, landing page, assets e estrutura mínima.", "Google Ads"],
  ["Conversion Builder", "Sugere ações de conversão, chamadas e eventos para cada nicho.", "Google Ads"],
  ["Asset Gap Scanner", "Detecta ausência de sitelinks, chamadas, lead forms, imagens e RSA.", "Google Ads"],
  ["Keyword Opportunity", "Gera clusters por cidade, serviço, intenção e concorrência.", "Planejamento"],
  ["Offline Revenue Sync", "Envia vendas fechadas para otimizar campanhas e ROI.", "CRM + Ads"],
];

const googleConnectors = [
  ["Google Business Profile APIs", "Locations, reviews, posts, Q&A, performance e notifications.", "API oficial"],
  ["Business Profile Performance API", "Métricas diárias de chamadas, rotas, cliques e buscas.", "API oficial"],
  ["Google Ads API", "Conversões, assets, recomendações, campanhas e relatórios.", "API oficial"],
  ["Google Maps/Places API", "Descoberta, dados locais, geocoding e enriquecimento.", "API oficial"],
  ["Google Tag / GTM / GA4", "Eventos, tags, públicos, conversões e qualidade do tracking.", "Tracking"],
  ["PageSpeed Insights", "Velocidade, Core Web Vitals e risco de conversão.", "Performance"],
];

const usageMetrics = [
  ["Varreduras Google", 68, "8.740 de 12.840 créditos"],
  ["Enriquecimentos", 54, "2.410 leads enriquecidos"],
  ["Diagnósticos PDF", 31, "148 relatórios gerados"],
  ["WhatsApp aberto", 44, "312 conversas iniciadas"],
  ["Exportações", 22, "34 arquivos CSV/PDF"],
];

const plans = [
  ["Starter", "R$ 297/mês", "1 usuário, 1.000 créditos e busca manual"],
  ["Growth", "R$ 697/mês", "5 usuários, 6.000 créditos, CRM e WhatsApp"],
  ["Enterprise", "Sob consulta", "Usuários ilimitados, APIs Google, IA e permissões avançadas"],
];

const invoices = [
  ["NOD-2026-005", "Nodere Enterprise", "Pago", "R$ 1.497"],
  ["NOD-2026-004", "Créditos extras", "Pago", "R$ 397"],
  ["NOD-2026-003", "Nodere Enterprise", "Pago", "R$ 1.497"],
];

const conversations = [
  {
    id: "odonto",
    leadName: "Odonto Prime Paulista",
    channel: "WhatsApp",
    status: "Lead quente",
    last: "Pode me mandar esse diagnóstico?",
    messages: [
      ["sent", "Oi, tudo bem? Analisei sua presença no Google e encontrei algumas oportunidades de captação local."],
      ["received", "Pode me mandar esse diagnóstico?"],
    ],
  },
  {
    id: "bella",
    leadName: "Bella Forma Estetica",
    channel: "WhatsApp",
    status: "Aguardando resposta",
    last: "Vou olhar e te retorno.",
    messages: [
      ["sent", "Identifiquei ausência de pixel e gargalos no site mobile. Posso te mostrar o impacto disso na captação?"],
      ["received", "Vou olhar e te retorno."],
    ],
  },
  {
    id: "solar",
    leadName: "Solar Tech Energia",
    channel: "E-mail",
    status: "Proposta enviada",
    last: "Proposta enviada com plano de tracking e Ads.",
    messages: [
      ["sent", "Enviei uma proposta com correção de tracking, Google Ads local e mensuração de ROI."],
    ],
  },
];

let activeConversationId = conversations[0].id;

let forecastMetrics = [
  ["Receita prevista", "R$ 84.600", "+18% vs mês anterior"],
  ["Deals em proposta", "37", "R$ 122k em pipeline"],
  ["Taxa de reunião", "24%", "Meta mensal: 28%"],
  ["Tempo médio resposta", "1h 12m", "SLA alvo: 2h"],
];

const operatorStats = [
  ["Ana Comercial", "R$ 38.400", "12 propostas", 88],
  ["Marina SDR", "42 reuniões", "156 contatos", 81],
  ["Rafael Ops", "97 diagnósticos", "2.410 leads", 76],
  ["Édipo Lima", "R$ 62.000", "18 fechamentos", 94],
];

const goalStats = [
  ["Leads qualificados", 74, "3.421 de 4.600"],
  ["Diagnósticos enviados", 58, "842 de 1.450"],
  ["Reuniões marcadas", 63, "316 de 500"],
  ["Receita fechada", 46, "R$ 92k de R$ 200k"],
];

const heatmapStats = [
  ["Seg", 84, "412 ações"],
  ["Ter", 91, "486 ações"],
  ["Qua", 76, "351 ações"],
  ["Qui", 88, "438 ações"],
  ["Sex", 69, "298 ações"],
  ["Sáb", 32, "74 ações"],
  ["Dom", 18, "31 ações"],
];

const diagnosisPackages = {
  tracking_ads: [
    "Configurar GTM, GA4 e eventos de conversão para chamada, WhatsApp e formulário.",
    "Criar campanha Google Ads local com palavras de alta intenção.",
    "Adicionar extensões de chamada, sitelinks e frases de destaque.",
    "Criar rotina de acompanhamento semanal de leads e custo por oportunidade.",
  ],
  profile_ads: [
    "Otimizar Perfil da Empresa com categoria, descrição, fotos, serviços e perguntas frequentes.",
    "Criar rotina de posts, respostas a avaliações e melhoria de reputação local.",
    "Ativar campanhas Google Ads conectadas à presença local.",
    "Mensurar chamadas, rotas, cliques no site e conversões por WhatsApp.",
  ],
  full_growth: [
    "Corrigir rastreamento completo com GTM, GA4, conversões e eventos offline.",
    "Otimizar Perfil da Empresa, avaliações, fotos, posts e Q&A.",
    "Criar campanhas Search e Performance Max locais.",
    "Implantar CRM de follow-up, WhatsApp comercial e relatório de ROI mensal.",
  ],
};

const recommendedServices = [
  ["Auditoria de tracking", "GTM, GA4, eventos de conversao, chamadas e WhatsApp."],
  ["Campanhas Google Ads local", "Pesquisa, chamada, extensoes de local e palavras de alta intencao."],
  ["Landing page de conversao", "Pagina rapida com prova social, CTA e rastreamento completo."],
  ["Remarketing Meta/Google", "Recaptura de visitantes e fortalecimento de decisao."],
];

const messageVariants = [
  "Oi, tudo bem? Fiz uma leitura rapida da presenca da sua empresa no Google e encontrei alguns pontos que podem estar reduzindo chamadas, formularios e conversoes. Posso te mandar um diagnostico gratuito com as principais oportunidades?",
  "Olá. Percebi que sua empresa tem demanda local, mas alguns sinais digitais importantes parecem incompletos, como rastreamento, remarketing e otimizacao no Google. Posso te mostrar em poucos minutos onde existe potencial de ganho?",
  "Oi. Analisei rapidamente sua presenca online e encontrei oportunidades para captar mais clientes pelo Google com campanhas, conversoes e WhatsApp melhor configurados. Quer que eu envie um diagnostico objetivo?",
];

const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".panel-section");
const opportunityList = document.getElementById("opportunityList");
const leadTable = document.getElementById("leadTable");
const riskBars = document.getElementById("riskBars");
const auditGrid = document.getElementById("auditGrid");
const kanban = document.getElementById("kanban");
const integrationGrid = document.getElementById("integrationGrid");
const themeToggle = document.getElementById("themeToggle");
const messageText = document.getElementById("messageText");
let selectedLead = leads[0];
let whatsappSettings = JSON.parse(localStorage.getItem("eli:whatsapp-settings") || "null") || {
  ownerNumber: "",
  mode: "web",
};
let apiSettings = JSON.parse(localStorage.getItem("nodere:api-settings") || "null") || {
  baseUrl: "http://localhost:3333",
  token: "",
};

function getActiveUser() {
  return teamMembers.find((member) => member.id === activeAccessUserId) || teamMembers[0];
}

function getEditingUser() {
  return teamMembers.find((member) => member.id === editingAccessUserId) || teamMembers[0];
}

function canAccess(sectionId, user = getActiveUser()) {
  return user.role === "Owner" || user.permissions.includes(sectionId);
}

function persistTeamMembers() {
  localStorage.setItem("eli:team-members", JSON.stringify(teamMembers));
}

function renderLoginOptions() {
  const select = document.getElementById("loginUserSelect");
  select.innerHTML = teamMembers
    .map((member) => `<option value="${member.id}">${member.name} · ${member.role}</option>`)
    .join("");
  select.value = sessionUserId;
}

function setSessionUser(userId) {
  sessionUserId = userId;
  activeAccessUserId = userId;
  localStorage.setItem("eli:session-user", userId);
  document.getElementById("currentUserButton").textContent = getActiveUser().name;
  applyAccessVisibility();
}

function login() {
  const code = document.getElementById("loginCode").value.trim();
  if (!code) return;
  setSessionUser(document.getElementById("loginUserSelect").value);
  document.getElementById("loginScreen").classList.add("hidden");
  switchSection(canAccess("dashboard") ? "dashboard" : getActiveUser().permissions[0]);
}

function logout() {
  document.getElementById("loginScreen").classList.remove("hidden");
}

function applyAccessVisibility() {
  const user = getActiveUser();
  navItems.forEach((item) => {
    item.classList.toggle("locked", !canAccess(item.dataset.section, user));
  });
  renderAccessBanner();
}

function renderAccessBanner() {
  document.querySelector(".access-banner")?.remove();
  const user = getActiveUser();
  if (user.id === sessionUserId) return;

  const banner = document.createElement("div");
  banner.className = "access-banner";
  banner.innerHTML = `
    <div>
      <strong>Visualizando como ${user.name}</strong>
      <span>${user.permissions.length} abas liberadas</span>
    </div>
    <button class="ghost-button" id="exitAccessSimulation">Voltar sessão</button>
  `;
  document.body.appendChild(banner);
  document.getElementById("exitAccessSimulation").addEventListener("click", () => {
    activeAccessUserId = sessionUserId;
    applyAccessVisibility();
    switchSection(canAccess("admin") ? "admin" : "dashboard");
  });
}

function switchSection(sectionId) {
  if (!canAccess(sectionId)) {
    const fallback = getActiveUser().permissions.find((id) => canAccess(id)) || "dashboard";
    sectionId = fallback;
  }
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.section === sectionId));
  sections.forEach((section) => section.classList.toggle("active", section.id === sectionId));
}

function renderOpportunities() {
  opportunityList.innerHTML = leads
    .slice()
    .sort((a, b) => b.score - a.score)
    .map(
      (lead) => `
        <article class="opportunity-item">
          <header>
            <strong>${lead.name}</strong>
            <span class="score-badge">${lead.score}</span>
          </header>
          <small>${lead.segment} · ${lead.city}</small>
          <span>${lead.diagnosis}</span>
        </article>
      `,
    )
    .join("");
}

function renderLeadTable(items = leads) {
  leadTable.innerHTML = items
    .map(
      (lead, index) => `
        <article class="lead-row ${lead.name === selectedLead.name ? "active" : ""}" data-lead="${lead.name}">
          <div>
            <strong>${lead.name}</strong>
            <p>${lead.segment} · ${lead.city}</p>
          </div>
          <div class="lead-flags">
            <span class="score-badge">${lead.score}</span>
            ${lead.flags.map((flag) => `<span>${flag}</span>`).join("")}
          </div>
        </article>
      `,
    )
    .join("");

  leadTable.querySelectorAll(".lead-row").forEach((row) => {
    row.addEventListener("click", () => {
      const lead = leads.find((item) => item.name === row.dataset.lead);
      if (!lead) return;
      selectLead(lead);
      switchSection("company");
    });
  });
}

function setInlineStatus(id, message, mode = "info") {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.dataset.mode = mode;
}

function getApiBaseUrl() {
  return (apiSettings.baseUrl || "").replace(/\/$/, "");
}

async function apiFetch(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    const error = new Error("Configure a URL da API no Admin.");
    error.status = 400;
    throw error;
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (apiSettings.token) {
    headers.Authorization = `Bearer ${apiSettings.token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const data = await response.json();
      message = data.error || message;
    } catch (_error) {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (options.raw) return response;
  return response.json();
}

function mapApiLeadToUiLead(item) {
  const cityState = [item.city, item.state].filter(Boolean).join(", ") || "Cidade nao informada";
  const reviews = item.googleReviews ?? item.google_reviews ?? 0;
  const rating = item.googleRating ?? item.google_rating ?? null;
  const website = item.website || "nao encontrado";
  const diagnosisRecord = Array.isArray(item.mvp_diagnoses) ? item.mvp_diagnoses[0] : null;
  const scanRecord = Array.isArray(item.mvp_site_scans) ? item.mvp_site_scans[0] : null;
  const diagnosis = diagnosisRecord?.diagnosis || {};
  const scan = scanRecord?.scan_result || {};
  const events = Array.isArray(item.mvp_crm_events) ? item.mvp_crm_events : [];
  const flags = [];

  if (!website || website === "nao encontrado") flags.push("Sem site");
  if (!item.whatsapp && !item.phone) flags.push("Sem WhatsApp");
  if (!reviews) flags.push("Sem avaliacoes");
  if (scan.findings?.length) flags.push(...scan.findings.slice(0, 3));
  if (!scan.findings?.length) flags.push("Auditoria pendente");

  return {
    id: item.id || item.googlePlaceId || item.google_place_id || item.companyName || item.company_name,
    backendId: item.id || item.backendId,
    googlePlaceId: item.googlePlaceId || item.google_place_id,
    name: item.companyName || item.company_name,
    city: cityState,
    segment: item.segment || "Segmento nao informado",
    score: Math.round(item.opportunityScore || item.opportunity_score || diagnosisRecord?.opportunity_score || scan.score || 72),
    cnpj: item.cnpj || "A enriquecer",
    whatsapp: item.whatsapp || item.phone || "Nao encontrado",
    whatsappNumber: onlyDigits(item.whatsapp || item.phone || ""),
    site: website,
    website: item.website || "",
    google: rating ? `${String(rating).replace(".", ",")} estrelas | ${reviews} avaliacoes` : `${reviews} avaliacoes`,
    flags,
    diagnosis: diagnosis.diagnosis || diagnosis.summary || "Lead encontrado via Google Places. Salve, rode o scanner e gere o diagnostico com IA.",
    aiWhatsappMessage: diagnosis.whatsappMessage || "",
    crmStatus: item.status || "lead_new",
    history: events.map((event) => ({
      type: event.event_type,
      body: event.body,
      createdAt: event.created_at,
    })),
    raw: item,
  };
}

function mergeLeads(newLeads) {
  const existingKeys = new Set(leads.map((lead) => lead.googlePlaceId || lead.name));
  const unique = newLeads.filter((lead) => !existingKeys.has(lead.googlePlaceId || lead.name));
  leads = [...unique, ...leads];
  if (unique[0]) selectedLead = unique[0];
  return unique.length;
}

function renderRiskBars() {
  riskBars.innerHTML = risks
    .map(
      ([label, value]) => `
        <div class="bar-row">
          <strong>${label}</strong>
          <div class="bar-track"><div class="bar-fill" style="--value:${value}%"></div></div>
          <span>${value}%</span>
        </div>
      `,
    )
    .join("");
}

function renderAudit() {
  auditGrid.innerHTML = auditItems
    .map(
      ([title, text, level]) => `
        <article class="audit-card">
          <strong>${title}</strong>
          <span>${text}</span>
          <div class="insight-list"><span class="${level}">${level === "good" ? "positivo" : level === "warn" ? "atencao" : "critico"}</span></div>
        </article>
      `,
    )
    .join("");
}

function renderKanban() {
  kanban.innerHTML = stages
    .map((stage, index) => {
      const stageKey = crmStages[index]?.[0] || "lead_new";
      const stageLeads = leads.filter((lead, leadIndex) => (lead.crmStatus || "lead_new") === stageKey || (!lead.crmStatus && index === leadIndex % stages.length));
      return `
        <section class="kanban-column">
          <h3>${stage}</h3>
          ${stageLeads.length ? stageLeads
            .map(
              (lead) => `
                <article class="kanban-card" data-lead="${lead.name}">
                  <header>
                    <strong>${lead.name}</strong>
                    <span class="score-badge">${lead.score}</span>
                  </header>
                  <p>${lead.diagnosis}</p>
                  <small>Proxima acao: follow-up consultivo</small>
                </article>
              `,
            )
            .join("") : `<small>Nenhum lead nesta etapa.</small>`}
        </section>
      `;
    })
    .join("");

  kanban.querySelectorAll(".kanban-card").forEach((card) => {
    card.addEventListener("click", () => {
      const lead = leads.find((item) => item.name === card.dataset.lead);
      if (!lead) return;
      selectLead(lead);
      switchSection("company");
    });
  });
}

function renderIntegrations() {
  integrationGrid.innerHTML = integrations.map((name) => `<div class="integration">${name}</div>`).join("");
}

function renderCompanyIntelligence(lead = selectedLead) {
  const playbooks = [
    ["WhatsApp consultivo", `Abrir conversa citando ${lead.flags[0].toLowerCase()} e oferecer diagnostico gratuito.`],
    ["Oferta inicial", "Auditoria de tracking + campanha Google Ads local com extensoes de chamada."],
    ["Prova de valor", "Mostrar perda estimada de contatos por falta de conversao e remarketing."],
    ["Proximo passo", "Agendar reuniao de 20 minutos com print da analise digital."],
  ];

  document.getElementById("playbookList").innerHTML = playbooks
    .map(([title, text]) => `<div class="playbook-item"><strong>${title}</strong><span>${text}</span></div>`)
    .join("");

  const timeline = [
    ["Agora", `IA atualizou score para ${lead.score} com base em ${lead.flags.length} falhas.`],
    ["Ha 8 min", "Scanner de tags finalizou GTM, GA4, Meta Pixel e eventos."],
    ["Ha 14 min", "Perfil Google analisado por nota, avaliacoes e campos incompletos."],
    ["Ha 22 min", "Empresa encontrada por busca local segmentada."],
  ];

  const history = (lead.history || [])
    .slice(0, 6)
    .map((event) => [
      event.createdAt ? new Date(event.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Agora",
      event.body,
    ]);

  document.getElementById("companyTimeline").innerHTML = [...history, ...timeline]
    .map(([time, text]) => `<div class="timeline-item"><strong>${time}</strong><span>${text}</span></div>`)
    .join("");
}

function renderAdmin() {
  document.getElementById("teamTable").innerHTML = teamMembers
    .map(
      (member) => `
        <div class="team-row">
          <strong>${member.name}</strong>
          <span>${member.role}</span>
          <span>${member.role === "Owner" ? "Todas as abas" : `${member.permissions.length} abas liberadas`}</span>
          <span class="status-pill ${member.status === "Pendente" ? "danger" : ""}">${member.status}</span>
          <button class="ghost-button" data-config-user="${member.id}">Configurar</button>
        </div>
      `,
    )
    .join("");

  document.querySelectorAll("[data-config-user]").forEach((button) => {
    button.addEventListener("click", () => {
      editingAccessUserId = button.dataset.configUser;
      renderAccessEditor();
    });
  });

  document.getElementById("permissionGrid").innerHTML = permissions
    .map(
      ([role, leadsAccess, crmAccess, adminAccess, billingAccess]) => `
        <div class="permission-row">
          <strong>${role}</strong>
          <span title="Leads" class="access-dot ${leadsAccess ? "on" : ""}"></span>
          <span title="CRM" class="access-dot ${crmAccess ? "on" : ""}"></span>
          <span title="Admin" class="access-dot ${adminAccess ? "on" : ""}"></span>
          <span title="Financeiro" class="access-dot ${billingAccess ? "on" : ""}"></span>
        </div>
      `,
    )
    .join("");

  document.getElementById("apiConsole").innerHTML = apiStatus
    .map(
      ([name, status, description, type]) => `
        <div class="api-item">
          <strong>${name}</strong>
          <span>${description}</span>
          <span>${status}</span>
          <span class="status-pill ${type === "roadmap" ? "danger" : ""}">${type}</span>
        </div>
      `,
    )
    .join("");

  document.getElementById("ownerWhatsapp").value = whatsappSettings.ownerNumber;
  document.getElementById("whatsappMode").value = whatsappSettings.mode;
  document.getElementById("apiBaseUrl").value = apiSettings.baseUrl;
  document.getElementById("apiOwnerToken").value = apiSettings.token;
  renderAccessEditor();
  renderWhatsappStatus();
  renderApiSettingsStatus();
}

function renderAccessEditor() {
  const user = getEditingUser();
  const select = document.getElementById("accessUserSelect");
  select.innerHTML = teamMembers.map((member) => `<option value="${member.id}">${member.name} · ${member.role}</option>`).join("");
  select.value = user.id;

  document.getElementById("accessModuleGrid").innerHTML = moduleCatalog
    .map((module) => {
      const isOwner = user.role === "Owner";
      const checked = isOwner || user.permissions.includes(module.id);
      return `
        <div class="access-module">
          <div>
            <strong>${module.label}</strong>
            <span>${module.description}</span>
          </div>
          <label class="switch" title="${isOwner ? "Owner tem acesso total" : "Liberar ou bloquear aba"}">
            <input type="checkbox" data-module-access="${module.id}" ${checked ? "checked" : ""} ${isOwner ? "disabled" : ""} />
            <i></i>
          </label>
        </div>
      `;
    })
    .join("");

  document.getElementById("accessStatus").textContent =
    user.role === "Owner"
      ? "Owner sempre mantem acesso total ao sistema."
      : `${user.name} pode acessar ${user.permissions.length} de ${moduleCatalog.length} abas.`;
}

function saveUserAccess() {
  const user = getEditingUser();
  if (user.role === "Owner") return;
  user.permissions = Array.from(document.querySelectorAll("[data-module-access]:checked")).map((input) => input.dataset.moduleAccess);
  if (!user.permissions.length) user.permissions = ["dashboard"];
  persistTeamMembers();
  renderAdmin();
  applyAccessVisibility();
}

function simulateUserAccess() {
  activeAccessUserId = editingAccessUserId;
  applyAccessVisibility();
  const user = getActiveUser();
  const destination = canAccess("dashboard", user) ? "dashboard" : user.permissions[0];
  switchSection(destination);
}

function persistSavedSearches() {
  localStorage.setItem("eli:saved-searches", JSON.stringify(savedSearches));
}

function renderScanner() {
  document.getElementById("savedSearches").innerHTML = savedSearches
    .map(
      (search) => `
        <article class="saved-search-card">
          <header>
            <strong>${search.title}</strong>
            <span class="status-pill">${search.cadence}</span>
          </header>
          <span>${search.filters}</span>
          <small>${search.leads} leads potenciais monitorados</small>
        </article>
      `,
    )
    .join("");

  document.getElementById("scanQueue").innerHTML = scanQueue
    .map(
      (item) => `
        <article class="queue-item">
          <header>
            <strong>${item.name}</strong>
            <span>${item.status}</span>
          </header>
          <div class="queue-bar"><div style="--progress:${item.progress}%"></div></div>
          <small>${item.progress}% concluido</small>
        </article>
      `,
    )
    .join("");

  document.getElementById("alertGrid").innerHTML = commercialAlerts
    .map(
      ([title, text, tag]) => `
        <article class="alert-card">
          <span class="status-pill ${tag === "Alta prioridade" ? "danger" : ""}">${tag}</span>
          <strong>${title}</strong>
          <span>${text}</span>
        </article>
      `,
    )
    .join("");
}

function renderGoogleIntelligence(lead = selectedLead) {
  const googleScore = Math.min(96, Math.round(lead.score + (lead.flags.includes("Sem conversao") ? 6 : 2)));
  document.getElementById("googleLeadName").textContent = lead.name;
  document.getElementById("googleOpportunityScore").textContent = googleScore;
  document.getElementById("googleLeadSummary").textContent =
    `${lead.segment} em ${lead.city}. A análise combina Perfil da Empresa, avaliações, performance local, readiness de Google Ads, conversões e lacunas de assets para montar uma oferta de correção priorizada.`;

  document.getElementById("gbpSignals").innerHTML = googleBusinessSignals
    .map(
      ([title, text, tag], index) => `
        <article class="google-signal">
          <header>
            <strong>${title}</strong>
            <span class="status-pill ${index % 3 === 0 ? "danger" : ""}">${tag}</span>
          </header>
          <span>${text}</span>
        </article>
      `,
    )
    .join("");

  document.getElementById("adsSignals").innerHTML = googleAdsSignals
    .map(
      ([title, text, tag], index) => `
        <article class="google-signal">
          <header>
            <strong>${title}</strong>
            <span class="status-pill ${index < 2 ? "danger" : ""}">${tag}</span>
          </header>
          <span>${text}</span>
        </article>
      `,
    )
    .join("");

  document.getElementById("googleModuleGrid").innerHTML = googleModules
    .map(
      ([title, text, tag]) => `
        <article class="google-module">
          <span class="section-kicker">${tag}</span>
          <strong>${title}</strong>
          <span>${text}</span>
        </article>
      `,
    )
    .join("");

  const actions = [
    `Criar plano de correção para ${lead.flags[0].toLowerCase()}.`,
    "Configurar ou auditar conversões de chamada, WhatsApp e formulário.",
    "Montar pacote de assets: sitelinks, chamadas, frases de destaque e lead form.",
    "Criar rotina de reputação: respostas a avaliações, posts e Q&A.",
    "Importar fechamentos offline para melhorar otimização de campanhas.",
  ];

  document.getElementById("googleActionList").innerHTML = actions
    .map((action, index) => `<article class="google-action"><strong>Prioridade ${index + 1}</strong><span>${action}</span></article>`)
    .join("");

  document.getElementById("googleConnectorList").innerHTML = googleConnectors
    .map(
      ([title, text, tag], index) => `
        <article class="connector-item">
          <header>
            <strong>${title}</strong>
            <span class="status-pill ${index < 3 ? "" : "danger"}">${index < 3 ? "Prioritario" : tag}</span>
          </header>
          <span>${text}</span>
        </article>
      `,
    )
    .join("");
}

function renderBilling() {
  document.getElementById("usageList").innerHTML = usageMetrics
    .map(
      ([label, value, detail]) => `
        <article class="usage-item">
          <header>
            <strong>${label}</strong>
            <span>${value}%</span>
          </header>
          <div class="usage-track"><div style="--usage:${value}%"></div></div>
          <span>${detail}</span>
        </article>
      `,
    )
    .join("");

  document.getElementById("planList").innerHTML = plans
    .map(
      ([name, price, detail]) => `
        <article class="plan-card">
          <header>
            <strong>${name}</strong>
            <span class="status-pill ${name === "Enterprise" ? "" : "danger"}">${price}</span>
          </header>
          <span>${detail}</span>
        </article>
      `,
    )
    .join("");

  document.getElementById("invoiceTable").innerHTML = invoices
    .map(
      ([code, description, status, amount]) => `
        <div class="invoice-row">
          <strong>${code}</strong>
          <span>${description}</span>
          <span class="status-pill">${status}</span>
          <strong>${amount}</strong>
        </div>
      `,
    )
    .join("");
}

function getActiveConversation() {
  return conversations.find((conversation) => conversation.id === activeConversationId) || conversations[0];
}

function renderInbox() {
  const active = getActiveConversation();
  document.getElementById("conversationList").innerHTML = conversations
    .map(
      (conversation) => `
        <article class="conversation-item ${conversation.id === active.id ? "active" : ""}" data-conversation="${conversation.id}">
          <header>
            <strong>${conversation.leadName}</strong>
            <span class="status-pill ${conversation.status.includes("quente") ? "" : "danger"}">${conversation.channel}</span>
          </header>
          <span>${conversation.last}</span>
          <small>${conversation.status}</small>
        </article>
      `,
    )
    .join("");

  document.querySelectorAll("[data-conversation]").forEach((item) => {
    item.addEventListener("click", () => {
      activeConversationId = item.dataset.conversation;
      const lead = leads.find((leadItem) => leadItem.name === getActiveConversation().leadName);
      if (lead) selectLead(lead);
      renderInbox();
    });
  });

  document.getElementById("threadChannel").textContent = active.channel;
  document.getElementById("threadCompany").textContent = active.leadName;
  document.getElementById("threadStatus").textContent = active.status;
  document.getElementById("threadMessages").innerHTML = active.messages
    .map(([type, text]) => `<div class="message-bubble ${type}"><strong>${type === "sent" ? "Você" : active.leadName}</strong><span>${text}</span></div>`)
    .join("");

  const replies = [
    "Enviar diagnóstico",
    "Agendar reunião",
    "Explicar ROI",
  ];
  document.getElementById("quickReplies").innerHTML = replies
    .map((reply) => `<button class="quick-reply" data-reply="${reply}">${reply}</button>`)
    .join("");
  document.querySelectorAll("[data-reply]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("replyText").value = buildInboxReply(button.dataset.reply);
    });
  });

  document.getElementById("slaList").innerHTML = [
    ["Responder agora", "Lead quente aguardando diagnóstico."],
    ["Follow-up 48h", "Propostas sem resposta devem receber nova abordagem."],
    ["Reunião", "Priorizar leads com score acima de 80."],
  ]
    .map(([title, text]) => `<article class="sla-item"><header><strong>${title}</strong><span class="status-pill">SLA</span></header><span>${text}</span></article>`)
    .join("");
}

function buildInboxReply(intent = "Enviar diagnóstico") {
  const lead = selectedLead;
  const templates = {
    "Enviar diagnóstico": `Perfeito. Vou te mandar um diagnóstico objetivo com os pontos que encontrei na presença digital da ${lead.name}, principalmente ${lead.flags.join(", ").toLowerCase()}.`,
    "Agendar reunião": `Posso te mostrar isso em uma reunião rápida de 20 minutos. A ideia é explicar onde estão as perdas e quais correções podem gerar mais contatos pelo Google.`,
    "Explicar ROI": `O ponto principal é rastrear chamadas, WhatsApp e formulários para saber quanto cada campanha gera de oportunidade real. Hoje esses sinais parecem incompletos.`,
  };
  return templates[intent] || templates["Enviar diagnóstico"];
}

function renderPerformance() {
  document.getElementById("forecastStrip").innerHTML = forecastMetrics
    .map(
      ([title, value, detail]) => `
        <article class="forecast-item">
          <span>${title}</span>
          <strong>${value}</strong>
          <small>${detail}</small>
        </article>
      `,
    )
    .join("");

  document.getElementById("operatorRanking").innerHTML = operatorStats
    .map(
      ([name, primary, secondary, score]) => `
        <article class="operator-card">
          <header>
            <strong>${name}</strong>
            <span class="score-badge">${score}</span>
          </header>
          <span>${primary}</span>
          <small>${secondary}</small>
        </article>
      `,
    )
    .join("");

  document.getElementById("goalList").innerHTML = goalStats
    .map(
      ([title, value, detail]) => `
        <article class="goal-item">
          <header>
            <strong>${title}</strong>
            <span>${value}%</span>
          </header>
          <div class="goal-track"><div style="--goal:${value}%"></div></div>
          <span>${detail}</span>
        </article>
      `,
    )
    .join("");

  document.getElementById("activityHeatmap").innerHTML = heatmapStats
    .map(
      ([day, value, detail]) => `
        <article class="heat-cell" style="background: rgba(34, 197, 94, ${Math.max(0.06, value / 180)})">
          <span>${day}</span>
          <strong>${value}%</strong>
          <span>${detail}</span>
        </article>
      `,
    )
    .join("");
}

function recalculateForecast() {
  const revenue = 78000 + Math.floor(Math.random() * 24000);
  const proposals = 32 + Math.floor(Math.random() * 14);
  forecastMetrics = [
    ["Receita prevista", revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }), "Forecast recalculado agora"],
    ["Deals em proposta", String(proposals), "Pipeline atualizado"],
    ["Taxa de reunião", `${22 + Math.floor(Math.random() * 8)}%`, "Com base nos últimos contatos"],
    ["Tempo médio resposta", `${50 + Math.floor(Math.random() * 45)}min`, "SLA em melhoria"],
  ];
  renderPerformance();
}

function saveCurrentSearch() {
  const city = document.querySelector(".filters-panel input")?.value || "Cidade";
  const segment = document.querySelectorAll(".filters-panel input")[1]?.value || "Segmento";
  const keyword = document.querySelectorAll(".filters-panel input")[2]?.value || "palavra-chave";
  const newSearch = {
    id: Date.now(),
    title: `${segment} em ${city}`,
    filters: `${city} · ${keyword} · baixa maturidade digital`,
    leads: Math.floor(48 + Math.random() * 180),
    cadence: "Diaria",
  };
  savedSearches = [newSearch, ...savedSearches].slice(0, 6);
  persistSavedSearches();
  renderScanner();
  switchSection("scanner");
}

function runSavedScans() {
  scanQueue = scanQueue.map((item) => ({
    ...item,
    status: "Rodando",
    progress: Math.min(100, Math.floor(item.progress + 12 + Math.random() * 24)),
  }));
  renderScanner();
  setTimeout(() => {
    scanQueue = scanQueue.map((item) => ({
      ...item,
      status: item.progress >= 100 ? "Pronto" : "Rodando",
      progress: Math.min(100, item.progress + 8),
    }));
    renderScanner();
  }, 700);
}

function selectLead(lead) {
  selectedLead = lead;
  selectedLead.crmStatus = selectedLead.crmStatus || "lead_new";
  document.getElementById("companyName").textContent = lead.name;
  document.getElementById("companyMeta").textContent = `${lead.segment} | ${lead.city}`;
  document.getElementById("companyCnpj").textContent = lead.cnpj;
  document.getElementById("companyWhatsapp").textContent = lead.whatsapp;
  document.getElementById("companySite").textContent = lead.site;
  document.getElementById("companyGoogle").textContent = lead.google;
  document.getElementById("companyDiagnosis").textContent =
    `${lead.name} apresenta ${lead.flags.join(", ").toLowerCase()}. ${lead.diagnosis} A recomendacao inicial e ofertar auditoria de tracking, campanha local e plano de conversao por WhatsApp.`;
  document.getElementById("companyScore").textContent = lead.score;
  document.getElementById("companyScoreRing").style.setProperty("--score", lead.score);
  document.getElementById("companyStatus").textContent = lead.score >= 85 ? "Alta oportunidade" : "Oportunidade qualificada";
  document.getElementById("companyCrmStatus").value = selectedLead.crmStatus;
  setInlineStatus("crmStatusInfo", `Etapa atual: ${crmStages.find(([key]) => key === selectedLead.crmStatus)?.[1] || "Lead novo"}.`);
  renderCompanyIntelligence(lead);
  renderCopilot(lead);
  renderGoogleIntelligence(lead);
  renderDiagnosisDocument(lead);
  renderLeadTable();
  renderKanban();
}

function renderCopilot(lead = selectedLead) {
  const forecast = Math.min(92, Math.max(42, Math.round(lead.score * 0.72 + lead.flags.length * 4)));
  document.getElementById("copilotLeadName").textContent = lead.name;
  document.getElementById("copilotSummary").textContent =
    `${lead.segment} em ${lead.city} com sinais de ${lead.flags.join(", ").toLowerCase()}. A IA recomenda uma abordagem consultiva focada em perda de conversoes, rastreamento e crescimento local.`;
  document.getElementById("closeForecast").textContent = `${forecast}%`;

  document.getElementById("serviceStack").innerHTML = recommendedServices
    .map(([title, text], index) => {
      const priority = index === 0 || lead.score >= 85 ? "Prioridade alta" : "Complementar";
      return `<div class="service-card"><strong>${title}</strong><span>${text}</span><small>${priority}</small></div>`;
    })
    .join("");

  updateRoi();
}

function updateRoi() {
  const budget = Number(document.getElementById("adBudget")?.value || 6000);
  const ticket = Number(document.getElementById("ticketValue")?.value || 1800);
  const conversionRate = Number(document.getElementById("conversionRate")?.value || 7);
  const estimatedClicks = Math.round(budget / 8.5);
  const estimatedLeads = Math.max(1, Math.round(estimatedClicks * (conversionRate / 100)));
  const estimatedRevenue = estimatedLeads * ticket;
  const roi = Math.round(((estimatedRevenue - budget) / budget) * 100);

  const formatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  document.getElementById("roiOutput").innerHTML = `
    <div><strong>${formatter.format(budget)}</strong><span>Investimento mensal simulado</span></div>
    <div><strong>${estimatedLeads}</strong><span>Leads estimados por mes</span></div>
    <div><strong>${formatter.format(estimatedRevenue)}</strong><span>Receita potencial estimada</span></div>
    <div><strong>${roi}%</strong><span>ROI bruto projetado</span></div>
  `;
}

function generateProposal() {
  const lead = selectedLead;
  document.getElementById("proposalBox").textContent =
    `Proposta recomendada para ${lead.name}\n\n` +
    `Diagnostico: foram identificados sinais de ${lead.flags.join(", ").toLowerCase()}, indicando baixa maturidade de captacao e rastreamento.\n\n` +
    `Plano sugerido: iniciar com auditoria de tracking, configuracao de conversoes, campanha Google Ads local e estrutura de WhatsApp rastreavel.\n\n` +
    `Argumento comercial: a empresa ja possui demanda no nicho de ${lead.segment.toLowerCase()}, mas perde previsibilidade por nao medir corretamente os contatos gerados. O objetivo e transformar buscas locais em reunioes, chamadas e oportunidades qualificadas.`;
}

function renderDiagnosisDocument(lead = selectedLead) {
  const tone = document.getElementById("diagnosisTone")?.value || "consultivo";
  const packageKey = document.getElementById("diagnosisPackage")?.value || "tracking_ads";
  const maturity = lead.score >= 88 ? "Média" : lead.score >= 78 ? "Baixa" : "Crítica";
  const potential = lead.score >= 85 ? "Muito alto" : "Alto";
  const adsReadiness = lead.flags.some((flag) => flag.toLowerCase().includes("conversao") || flag.toLowerCase().includes("ads")) ? "Crítico" : "Atenção";

  const toneOpeners = {
    consultivo: `A análise indica que ${lead.name} tem demanda local relevante, mas apresenta gargalos digitais que reduzem previsibilidade comercial.`,
    direto: `${lead.name} está perdendo oportunidades por falhas digitais objetivas que podem ser corrigidas com rastreamento, presença local e Google Ads.`,
    premium: `${lead.name} possui potencial para uma operação de aquisição local mais sofisticada, conectando reputação, intenção de busca, mídia paga e CRM.`,
  };

  document.getElementById("docCompanyName").textContent = lead.name;
  document.getElementById("docScore").textContent = `${lead.score}/100`;
  document.getElementById("docMaturity").textContent = maturity;
  document.getElementById("docPotential").textContent = potential;
  document.getElementById("docAdsReadiness").textContent = adsReadiness;
  document.getElementById("docExecutiveSummary").textContent =
    `${toneOpeners[tone]} Foram encontrados sinais como ${lead.flags.join(", ").toLowerCase()}. O cenário sugere oportunidade para melhorar captação, mensuração de conversões e abordagem comercial por WhatsApp.`;

  document.getElementById("docFindings").innerHTML = lead.flags
    .map((flag) => `<div><strong>${flag}</strong><span>Impacta a capacidade de transformar buscas no Google em contatos rastreáveis e oportunidades comerciais.</span></div>`)
    .join("");

  document.getElementById("docPlan").innerHTML = diagnosisPackages[packageKey]
    .map((step, index) => `<div><strong>Etapa ${index + 1}</strong><span>${step}</span></div>`)
    .join("");

  document.getElementById("docPitch").textContent =
    `Minha recomendação é iniciar com um diagnóstico técnico-comercial de rápida implementação, priorizando os pontos que mais afetam geração de contatos. A proposta é transformar presença local e intenção de busca em reuniões, chamadas e mensagens qualificadas, com acompanhamento por score e ROI.`;
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function renderWhatsappStatus() {
  const status = document.getElementById("whatsappSettingsStatus");
  if (!status) return;
  if (whatsappSettings.ownerNumber) {
    status.textContent = `Integrado como +${whatsappSettings.ownerNumber}. O envio abre ${whatsappSettings.mode === "web" ? "WhatsApp Web" : "o aplicativo WhatsApp"}.`;
    return;
  }
  status.textContent = "Use DDI + DDD + numero. Exemplo: 5511999999999.";
}

function renderApiSettingsStatus(message = "") {
  const status = document.getElementById("apiSettingsStatus");
  if (!status) return;
  status.textContent = message || `API configurada em ${apiSettings.baseUrl || "nao configurada"}.`;
}

function saveWhatsappSettings() {
  whatsappSettings = {
    ownerNumber: onlyDigits(document.getElementById("ownerWhatsapp").value),
    mode: document.getElementById("whatsappMode").value,
  };
  localStorage.setItem("eli:whatsapp-settings", JSON.stringify(whatsappSettings));
  renderWhatsappStatus();
}

function saveApiSettings() {
  apiSettings = {
    baseUrl: document.getElementById("apiBaseUrl").value.trim() || "http://localhost:3333",
    token: document.getElementById("apiOwnerToken").value.trim(),
  };
  localStorage.setItem("nodere:api-settings", JSON.stringify(apiSettings));
  renderApiSettingsStatus("API MVP salva. Use Testar conexao para validar.");
}

async function testApiConnection() {
  const button = document.getElementById("testApiConnection");
  button.textContent = "Testando...";
  try {
    const data = await apiFetch("/health");
    renderApiSettingsStatus(data.ok ? "Conexao ativa com a API MVP." : "API respondeu, mas sem status ok.");
  } catch (error) {
    renderApiSettingsStatus(`Falha na conexao: ${error.message}`);
  } finally {
    button.textContent = "Testar conexao";
  }
}

function buildWhatsappMessage(lead = selectedLead, customText = "") {
  const baseText = customText || lead.aiWhatsappMessage || messageText?.value || "";
  return `${baseText}\n\nDiagnostico rapido: ${lead.name} aparece com ${lead.flags.join(", ").toLowerCase()}. Potencial comercial estimado: ${lead.score}/100.`;
}

function openWhatsapp(lead = selectedLead, customText = "") {
  const phone = onlyDigits(lead.whatsappNumber);
  if (!phone) {
    alert("Este lead ainda nao tem WhatsApp validado.");
    return;
  }
  const text = encodeURIComponent(buildWhatsappMessage(lead, customText));
  const url =
    whatsappSettings.mode === "app"
      ? `https://wa.me/${phone}?text=${text}`
      : `https://web.whatsapp.com/send?phone=${phone}&text=${text}`;
  window.open(url, "_blank", "noopener,noreferrer");
  recordLeadEvent("WhatsApp aberto com mensagem consultiva preparada.", "whatsapp_opened");
}

function animateCounters() {
  document.querySelectorAll("[data-count]").forEach((counter) => {
    const target = Number(counter.dataset.count);
    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.floor(target * (1 - Math.pow(1 - progress, 3)));
      counter.textContent = value.toLocaleString("pt-BR");
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

async function runLiveGoogleSearch() {
  const button = document.getElementById("liveGoogleSearch");
  button.textContent = "Buscando...";
  setInlineStatus("apiSearchStatus", "Consultando Google Places pela API MVP...");

  try {
    const data = await apiFetch("/api/v1/search/google-places", {
      method: "POST",
      body: JSON.stringify({
        city: document.getElementById("searchCity").value,
        segment: document.getElementById("searchSegment").value,
        keyword: document.getElementById("searchKeyword").value,
        limit: 10,
      }),
    });

    const newLeads = (data.results || []).map(mapApiLeadToUiLead);
    const added = mergeLeads(newLeads);
    renderLeadTable(newLeads.length ? newLeads : leads);
    selectLead(newLeads[0] || selectedLead);
    animateScanProgress();
    setInlineStatus("apiSearchStatus", `${newLeads.length} empresas retornadas, ${added} novas adicionadas ao funil.`);
  } catch (error) {
    setInlineStatus("apiSearchStatus", `Busca real indisponivel: ${error.message}`);
  } finally {
    button.textContent = "Buscar via Google Places";
  }
}

async function loadSavedLeadsFromApi() {
  const button = document.getElementById("loadApiLeads");
  button.textContent = "Carregando...";
  setInlineStatus("apiSearchStatus", "Buscando leads salvos no Supabase...");

  try {
    const data = await apiFetch("/api/v1/leads");
    const apiLeads = (data.leads || []).map(mapApiLeadToUiLead);
    leads = apiLeads.length ? apiLeads : leads;
    selectedLead = leads[0] || selectedLead;
    renderLeadTable(leads);
    renderOpportunities();
    renderKanban();
    selectLead(selectedLead);
    setInlineStatus("apiSearchStatus", `${apiLeads.length} leads carregados da base MVP.`);
  } catch (error) {
    setInlineStatus("apiSearchStatus", `Nao foi possivel carregar leads: ${error.message}`);
  } finally {
    button.textContent = "Carregar leads salvos";
  }
}

async function saveSelectedLeadToApi() {
  const button = document.getElementById("saveLeadApi");
  button.textContent = "Salvando...";

  try {
    const payload = {
      companyName: selectedLead.name,
      googlePlaceId: selectedLead.googlePlaceId,
      phone: selectedLead.raw?.phone || selectedLead.whatsapp,
      whatsapp: selectedLead.whatsapp,
      website: selectedLead.website || (/^https?:\/\//i.test(selectedLead.site) ? selectedLead.site : ""),
      address: selectedLead.raw?.address,
      city: selectedLead.raw?.city || selectedLead.city,
      state: selectedLead.raw?.state,
      segment: selectedLead.segment,
      googleRating: selectedLead.raw?.googleRating,
      googleReviews: selectedLead.raw?.googleReviews,
      source: selectedLead.raw?.source || "manual_frontend",
    };

    const data = await apiFetch("/api/v1/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    selectedLead.backendId = data.lead.id;
    selectedLead.id = selectedLead.id || data.lead.id;
    selectedLead.crmStatus = data.lead.status || selectedLead.crmStatus || "lead_new";
    document.getElementById("companyCrmStatus").value = selectedLead.crmStatus;
    addLocalLeadEvent("Lead salvo na base MVP.", "lead_saved");
    alert("Lead salvo na base MVP.");
  } catch (error) {
    alert(`Nao foi possivel salvar: ${error.message}`);
  } finally {
    button.textContent = "Salvar lead";
  }
}

async function updateSelectedLeadCrmStatus() {
  const button = document.getElementById("saveCrmStatusApi");
  const nextStatus = document.getElementById("companyCrmStatus").value;
  selectedLead.crmStatus = nextStatus;
  renderKanban();
  addLocalLeadEvent(`Status comercial atualizado para ${crmStages.find(([key]) => key === nextStatus)?.[1] || nextStatus}.`, "status_changed");
  setInlineStatus("crmStatusInfo", "Status atualizado localmente.");

  if (!selectedLead.backendId) {
    setInlineStatus("crmStatusInfo", "Status atualizado localmente. Salve o lead para sincronizar com Supabase.");
    return;
  }

  button.textContent = "Salvando...";
  try {
    const data = await apiFetch(`/api/v1/leads/${selectedLead.backendId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    selectedLead.crmStatus = data.lead.status;
    setInlineStatus("crmStatusInfo", "Status sincronizado com Supabase.");
  } catch (error) {
    setInlineStatus("crmStatusInfo", `Status local salvo, mas API falhou: ${error.message}`);
  } finally {
    button.textContent = "Atualizar CRM";
  }
}

function addLocalLeadEvent(body, eventType = "note") {
  selectedLead.history = [
    {
      type: eventType,
      body,
      createdAt: new Date().toISOString(),
    },
    ...(selectedLead.history || []),
  ];
  renderCompanyIntelligence(selectedLead);
}

async function recordLeadEvent(body, eventType = "note") {
  addLocalLeadEvent(body, eventType);

  if (!selectedLead.backendId) {
    setInlineStatus("leadNoteStatus", "Nota salva localmente. Salve o lead para sincronizar com Supabase.");
    return;
  }

  try {
    await apiFetch(`/api/v1/leads/${selectedLead.backendId}/events`, {
      method: "POST",
      body: JSON.stringify({ eventType, body }),
    });
    setInlineStatus("leadNoteStatus", "Interacao sincronizada com Supabase.");
  } catch (error) {
    setInlineStatus("leadNoteStatus", `Interacao local salva, mas API falhou: ${error.message}`);
  }
}

async function saveLeadNote() {
  const textarea = document.getElementById("leadNoteText");
  const body = textarea.value.trim();
  if (!body) {
    setInlineStatus("leadNoteStatus", "Digite uma nota antes de salvar.");
    return;
  }
  textarea.value = "";
  await recordLeadEvent(body, "note");
}

async function ensureSelectedLeadSaved() {
  if (selectedLead.backendId) return selectedLead.backendId;
  await saveSelectedLeadToApi();
  return selectedLead.backendId;
}

async function scanSelectedLeadWithApi() {
  const button = document.getElementById("scanLeadApi");
  button.textContent = "Scaneando...";

  try {
    const leadId = await ensureSelectedLeadSaved();
    if (!leadId) throw new Error("Lead ainda nao foi salvo.");

    const data = await apiFetch(`/api/v1/leads/${leadId}/scan-site`, {
      method: "POST",
      body: JSON.stringify({ website: selectedLead.website }),
    });

    const scan = data.scan.scan_result;
    selectedLead.score = scan.score || selectedLead.score;
    selectedLead.flags = scan.findings?.length ? scan.findings.slice(0, 4) : ["Scanner sem falhas criticas"];
    selectedLead.diagnosis = scan.findings?.join(" ") || "Scanner real concluido sem achados relevantes.";
    selectLead(selectedLead);
    renderLeadTable(leads);
    alert("Scanner real concluido.");
  } catch (error) {
    alert(`Scanner indisponivel: ${error.message}`);
  } finally {
    button.textContent = "Scanner real";
  }
}

async function generateSelectedLeadDiagnosisWithApi() {
  const button = document.getElementById("diagnosisLeadApi");
  button.textContent = "Gerando...";

  try {
    const leadId = await ensureSelectedLeadSaved();
    if (!leadId) throw new Error("Lead ainda nao foi salvo.");

    const data = await apiFetch(`/api/v1/leads/${leadId}/diagnosis`, {
      method: "POST",
    });

    const diagnosis = data.diagnosis.diagnosis;
    selectedLead.score = Math.round(diagnosis.opportunityScore || selectedLead.score);
    selectedLead.diagnosis = diagnosis.diagnosis || diagnosis.summary || selectedLead.diagnosis;
    selectedLead.aiWhatsappMessage = diagnosis.whatsappMessage;
    selectedLead.flags = diagnosis.recommendedServices?.slice(0, 4) || selectedLead.flags;
    addLocalLeadEvent("Diagnostico com IA gerado para abordagem comercial.", "diagnosis_generated");
    selectLead(selectedLead);
    renderDiagnosisDocument(selectedLead);
    switchSection("diagnosis");
  } catch (error) {
    alert(`IA indisponivel: ${error.message}`);
  } finally {
    button.textContent = "IA real";
  }
}

function simulateScan() {
  const button = document.getElementById("runScan");
  button.textContent = "Escaneando...";
  document.querySelector(".status-pill")?.classList.add("pulse");
  setTimeout(() => {
    button.textContent = "Nova varredura";
    renderLeadTable([...leads].sort(() => Math.random() - 0.5));
    switchSection("search");
  }, 850);
}

function simulateSearch() {
  const shuffled = [...leads].sort(() => Math.random() - 0.5);
  renderLeadTable(shuffled);
  animateScanProgress();
}

function filterGlobalSearch(event) {
  const query = event.target.value.trim().toLowerCase();
  const filtered = leads.filter((lead) =>
    [lead.name, lead.city, lead.segment, ...lead.flags].some((value) => value.toLowerCase().includes(query)),
  );
  renderLeadTable(query ? filtered : leads);
  if (query) switchSection("search");
}

function animateScanProgress() {
  const values = [100, Math.floor(72 + Math.random() * 22), Math.floor(68 + Math.random() * 26)];
  document.querySelectorAll("#scanProgress strong").forEach((item, index) => {
    item.textContent = `${values[index]}%`;
  });
}

async function exportCsv() {
  if (getApiBaseUrl()) {
    try {
      const response = await apiFetch("/api/v1/leads/export.csv", {
        raw: true,
        headers: {},
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "nodere-leads.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return;
    } catch (_error) {
      // Fall back to local CSV when the MVP API is not running.
    }
  }

  const header = ["Empresa", "Cidade", "Segmento", "Score", "Falhas", "Diagnostico"];
  const rows = leads.map((lead) => [
    lead.name,
    lead.city,
    lead.segment,
    lead.score,
    lead.flags.join(" | "),
    lead.diagnosis,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "nodere-leads.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

navItems.forEach((item) => {
  item.addEventListener("click", () => switchSection(item.dataset.section));
});

themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("light");
  themeToggle.textContent = document.documentElement.classList.contains("light") ? "Dark" : "Light";
});

document.getElementById("runScan").addEventListener("click", simulateScan);
document.getElementById("runGoogleAudit").addEventListener("click", () => {
  renderGoogleIntelligence(selectedLead);
  document.getElementById("runGoogleAudit").textContent = "Auditoria atualizada";
  setTimeout(() => {
    document.getElementById("runGoogleAudit").textContent = "Auditar Google";
  }, 1200);
});
document.getElementById("upgradePlan").addEventListener("click", () => {
  document.getElementById("availableCredits").textContent = "25.000";
  document.getElementById("upgradePlan").textContent = "Upgrade simulado";
  setTimeout(() => {
    document.getElementById("upgradePlan").textContent = "Fazer upgrade";
  }, 1200);
});
document.getElementById("aiReply").addEventListener("click", () => {
  document.getElementById("replyText").value = buildInboxReply("Enviar diagnóstico");
});
document.getElementById("sendReply").addEventListener("click", () => {
  const text = document.getElementById("replyText").value.trim();
  if (!text) return;
  const conversation = getActiveConversation();
  conversation.messages.push(["sent", text]);
  conversation.last = text;
  document.getElementById("replyText").value = "";
  renderInbox();
});
document.getElementById("recalculateForecast").addEventListener("click", recalculateForecast);
document.getElementById("simulateSearch").addEventListener("click", simulateSearch);
document.getElementById("saveSearch").addEventListener("click", saveCurrentSearch);
document.getElementById("runSavedScans").addEventListener("click", runSavedScans);
document.getElementById("globalSearch").addEventListener("input", filterGlobalSearch);
document.getElementById("startOnboarding").addEventListener("click", () => {
  document.getElementById("onboardingModal").classList.add("hidden");
  localStorage.setItem("eli:onboarding-dismissed", "true");
});
document.getElementById("generateMessage").addEventListener("click", () => {
  const current = messageVariants.indexOf(messageText.value);
  messageText.value = messageVariants[(current + 1 + messageVariants.length) % messageVariants.length];
});

document.getElementById("inviteUser").addEventListener("click", () => {
  teamMembers.push({
    id: `user-${Date.now()}`,
    name: `Novo usuario ${teamMembers.length + 1}`,
    role: "SDR",
    status: "Pendente",
    permissions: ["dashboard", "search", "company"],
  });
  persistTeamMembers();
  renderAdmin();
  renderLoginOptions();
  const inviteLink = `${location.origin}${location.pathname}#convite-${teamMembers[teamMembers.length - 1].id}`;
  document.getElementById("inviteLinkText").textContent = inviteLink;
  document.getElementById("inviteBox").classList.remove("hidden");
});

document.getElementById("generateProposal").addEventListener("click", generateProposal);
document.getElementById("generateDiagnosis").addEventListener("click", () => renderDiagnosisDocument(selectedLead));
document.getElementById("printDiagnosis").addEventListener("click", () => {
  switchSection("diagnosis");
  setTimeout(() => window.print(), 80);
});
document.getElementById("loginButton").addEventListener("click", login);
document.getElementById("currentUserButton").addEventListener("click", logout);
document.getElementById("copyInviteLink").addEventListener("click", async () => {
  const text = document.getElementById("inviteLinkText").textContent;
  try {
    await navigator.clipboard.writeText(text);
    document.getElementById("copyInviteLink").textContent = "Copiado";
  } catch {
    document.getElementById("copyInviteLink").textContent = "Selecionar link";
  }
});
document.getElementById("accessUserSelect").addEventListener("change", (event) => {
  editingAccessUserId = event.target.value;
  renderAccessEditor();
});
document.getElementById("saveUserAccess").addEventListener("click", saveUserAccess);
document.getElementById("simulateUserAccess").addEventListener("click", simulateUserAccess);
document.getElementById("saveWhatsappSettings").addEventListener("click", saveWhatsappSettings);
document.getElementById("saveApiSettings").addEventListener("click", saveApiSettings);
document.getElementById("testApiConnection").addEventListener("click", testApiConnection);
document.getElementById("sendWhatsappMessage").addEventListener("click", () => openWhatsapp(selectedLead));
document.getElementById("companyWhatsappButton").addEventListener("click", () => {
  const text = `Oi, tudo bem? Sou Édipo Lima. Fiz uma análise rápida da presença digital da ${selectedLead.name} e encontrei oportunidades para melhorar captação, rastreamento e conversões pelo Google. Posso te enviar um diagnóstico gratuito?`;
  openWhatsapp(selectedLead, text);
});
document.getElementById("liveGoogleSearch").addEventListener("click", runLiveGoogleSearch);
document.getElementById("loadApiLeads").addEventListener("click", loadSavedLeadsFromApi);
document.getElementById("saveLeadApi").addEventListener("click", saveSelectedLeadToApi);
document.getElementById("scanLeadApi").addEventListener("click", scanSelectedLeadWithApi);
document.getElementById("diagnosisLeadApi").addEventListener("click", generateSelectedLeadDiagnosisWithApi);
document.getElementById("saveCrmStatusApi").addEventListener("click", updateSelectedLeadCrmStatus);
document.getElementById("saveLeadNote").addEventListener("click", saveLeadNote);
["adBudget", "ticketValue", "conversionRate"].forEach((id) => {
  document.getElementById(id).addEventListener("input", updateRoi);
});

document.querySelectorAll("[data-export]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.export === "csv") {
      exportCsv();
      return;
    }
    button.textContent = "Gerando...";
    setTimeout(() => {
      button.textContent = button.dataset.export.toUpperCase();
    }, 900);
  });
});

window.addEventListener("load", () => {
  renderLoginOptions();
  document.getElementById("currentUserButton").textContent = getActiveUser().name;
  if (!storedSessionUserId) {
    document.getElementById("loginScreen").classList.remove("hidden");
  }
  if (localStorage.getItem("eli:onboarding-dismissed") === "true") {
    document.getElementById("onboardingModal").classList.add("hidden");
  }
  renderOpportunities();
  renderLeadTable();
  renderRiskBars();
  renderAudit();
  renderKanban();
  renderIntegrations();
  renderAdmin();
  renderScanner();
  renderBilling();
  renderInbox();
  renderPerformance();
  selectLead(selectedLead);
  applyAccessVisibility();
  animateCounters();
  setTimeout(() => document.getElementById("loadingScreen").classList.add("hidden"), 650);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
