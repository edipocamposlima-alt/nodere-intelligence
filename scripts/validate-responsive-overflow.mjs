const BASE_URL = process.env.NODERE_RESPONSIVE_BASE_URL || "https://nodere.com.br";
const DEBUG_URL = process.env.CHROME_DEBUG_URL || "http://127.0.0.1:9222";
const TOLERANCE = Number(process.env.NODERE_OVERFLOW_TOLERANCE || 2);

const routes = [
  "/dashboard",
  "/companies",
  "/crm",
  "/discovery",
  "/catalog",
  "/app/proposals",
  "/reports",
  "/settings",
  "/app/dashboard"
];

const viewports = [
  { name: "desktop-1366", width: 1366, height: 768, mobile: false },
  { name: "notebook-1440", width: 1440, height: 900, mobile: false },
  { name: "desktop-1920", width: 1920, height: 1080, mobile: false },
  { name: "mobile-375", width: 375, height: 812, mobile: true }
];

let messageId = 0;

let cdp = async function cdpCommand(method, params = {}, sessionId) {
  const id = ++messageId;
  ws.send(JSON.stringify({ id, method, params, sessionId }));
  return await new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }
    }, 20000);
  });
};

async function waitForLoad() {
  await cdp("Runtime.evaluate", {
    expression: "document.readyState",
    returnByValue: true
  });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const result = await cdp("Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true
    });
    if (result.result?.result?.value === "complete") return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function auditRoute(route, viewport) {
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile
  });
  await cdp("Page.navigate", { url: `${BASE_URL}${route}` });
  await waitForLoad();
  await new Promise((resolve) => setTimeout(resolve, 750));
  const expression = `(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [];
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (style.position === 'fixed' && (el.matches('nav.fixed') || el.closest('[role="dialog"]'))) continue;
      const overRight = rect.right - vw;
      const overLeft = -rect.left;
      if (overRight > ${TOLERANCE} || overLeft > ${TOLERANCE}) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: String(el.className || '').slice(0, 140),
          text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 120),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          overRight: Math.round(overRight),
          overLeft: Math.round(overLeft),
          overflowX: style.overflowX
        });
      }
      if (offenders.length >= 12) break;
    }
    const header = document.querySelector('header.sticky');
    const content = document.querySelector('.nodere-app-content') || document.querySelector('main');
    return {
      route: location.pathname,
      viewport: '${viewport.name}',
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      isLogin: location.pathname.includes('/login') || document.body.innerText.includes('Entrar no NODERE'),
      headerOverlap: Boolean(header && content && header.getBoundingClientRect().bottom > content.getBoundingClientRect().top + 4),
      offenders
    };
  })()`;
  const result = await cdp("Runtime.evaluate", { expression, returnByValue: true });
  return result.result.result.value;
}

const version = await fetch(`${DEBUG_URL}/json/version`).then((response) => {
  if (!response.ok) throw new Error(`Chrome debug endpoint unavailable: ${response.status}`);
  return response.json();
});

const wsUrl = version.webSocketDebuggerUrl;
if (!wsUrl) throw new Error("Chrome debug endpoint did not expose webSocketDebuggerUrl.");

const pending = new Map();
const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

ws.addEventListener("message", (event) => {
  const payload = JSON.parse(String(event.data));
  if (payload.id && pending.has(payload.id)) {
    const item = pending.get(payload.id);
    pending.delete(payload.id);
    if (payload.error) item.reject(new Error(payload.error.message || "CDP error"));
    else item.resolve(payload);
  }
});

await cdp("Target.createTarget", { url: "about:blank" });
const targets = await cdp("Target.getTargets");
const page = targets.result.targetInfos.find((target) => target.type === "page" && target.url === "about:blank") || targets.result.targetInfos.find((target) => target.type === "page");
const attached = await cdp("Target.attachToTarget", { targetId: page.targetId, flatten: true });
const sessionId = attached.result.sessionId;
const baseCdp = cdp;
globalThis.cdp = (method, params = {}) => baseCdp(method, params, sessionId);

await globalThis.cdp("Page.enable");
await globalThis.cdp("Runtime.enable");

const originalCdp = cdp;
cdp = globalThis.cdp;

const results = [];
for (const viewport of viewports) {
  for (const route of routes) {
    results.push(await auditRoute(route, viewport));
  }
}

await originalCdp("Target.closeTarget", { targetId: page.targetId });
ws.close();

const failures = results.filter((item) =>
  item.scrollWidth > item.clientWidth + TOLERANCE ||
  item.bodyScrollWidth > item.bodyClientWidth + TOLERANCE ||
  item.headerOverlap ||
  item.offenders.length > 0 ||
  item.isLogin
);

console.log(JSON.stringify({ ok: failures.length === 0, failures, results }, null, 2));
if (failures.length > 0) process.exit(1);
