const BASE_URL = process.env.NODERE_RESPONSIVE_BASE_URL || "https://nodere.com.br";
const DEBUG_URL = process.env.CHROME_DEBUG_URL || "http://127.0.0.1:9222";
const TOLERANCE = Number(process.env.NODERE_OVERFLOW_TOLERANCE || 2);
const ALLOW_LOGIN = process.env.NODERE_ALLOW_LOGIN === "1";

const defaultRoutes = [
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

const routes = (process.env.NODERE_RESPONSIVE_ROUTES || "")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
if (routes.length === 0) routes.push(...defaultRoutes);

const defaultViewports = [
  { name: "desktop-1366", width: 1366, height: 768, mobile: false },
  { name: "notebook-1440", width: 1440, height: 900, mobile: false },
  { name: "desktop-1920", width: 1920, height: 1080, mobile: false },
  { name: "mobile-375", width: 375, height: 812, mobile: true }
];

const viewports = (process.env.NODERE_RESPONSIVE_VIEWPORTS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => {
    const [name, size] = item.split(":");
    const [width, height] = size.split("x").map(Number);
    return { name, width, height, mobile: width <= 480 };
  });
if (viewports.length === 0) viewports.push(...defaultViewports);

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
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const result = await cdp("Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true
    });
    if (result.result?.result?.value === "complete") return;
    await new Promise((resolve) => setTimeout(resolve, 200));
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
    const hasContainedHorizontalScroller = (el) => {
      let current = el.parentElement;
      while (current && current !== document.body) {
        const currentStyle = getComputedStyle(current);
        const canScrollX = ['auto', 'scroll'].includes(currentStyle.overflowX) && current.scrollWidth > current.clientWidth + ${TOLERANCE};
        if (canScrollX) {
          const currentRect = current.getBoundingClientRect();
          return currentRect.left >= -${TOLERANCE} && currentRect.right <= vw + ${TOLERANCE};
        }
        current = current.parentElement;
      }
      return false;
    };
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (style.position === 'fixed' && (el.matches('nav.fixed') || el.closest('[role="dialog"]'))) continue;
      const overRight = rect.right - vw;
      const overLeft = -rect.left;
      if (overRight > ${TOLERANCE} || overLeft > ${TOLERANCE}) {
        if (hasContainedHorizontalScroller(el)) continue;
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

let target = await fetch(`${DEBUG_URL}/json/new?about:blank`, { method: "PUT" }).then((response) => {
  if (!response.ok) throw new Error(`Chrome debug endpoint unavailable: ${response.status}`);
  return response.json();
});
if (!target.webSocketDebuggerUrl) {
  const targets = await fetch(`${DEBUG_URL}/json/list`).then((response) => response.json());
  target = targets.find((item) => item.type === "page");
}

const wsUrl = target?.webSocketDebuggerUrl;
if (!wsUrl) throw new Error("Chrome debug endpoint did not expose a page webSocketDebuggerUrl.");

const pending = new Map();
const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

ws.addEventListener("message", (event) => {
  let raw = event.data;
  if (raw instanceof ArrayBuffer) raw = Buffer.from(raw).toString("utf8");
  else if (ArrayBuffer.isView(raw)) raw = Buffer.from(raw.buffer).toString("utf8");
  else raw = String(raw);
  const payload = JSON.parse(raw);
  if (payload.id && pending.has(payload.id)) {
    const item = pending.get(payload.id);
    pending.delete(payload.id);
    if (payload.error) item.reject(new Error(payload.error.message || "CDP error"));
    else item.resolve(payload);
  }
});

await cdp("Page.enable");
await cdp("Runtime.enable");

const results = [];
for (const viewport of viewports) {
  for (const route of routes) {
    results.push(await auditRoute(route, viewport));
  }
}

if (target?.id) {
  await fetch(`${DEBUG_URL}/json/close/${target.id}`).catch(() => undefined);
}
ws.close();

const failures = results.filter((item) =>
  item.scrollWidth > item.clientWidth + TOLERANCE ||
  item.bodyScrollWidth > item.bodyClientWidth + TOLERANCE ||
  item.headerOverlap ||
  item.offenders.length > 0 ||
  (!ALLOW_LOGIN && item.isLogin)
);

console.log(JSON.stringify({ ok: failures.length === 0, failures, results }, null, 2));
if (failures.length > 0) process.exit(1);
