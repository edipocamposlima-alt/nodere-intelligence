import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function check(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

const manifest = JSON.parse(read("public/manifest.webmanifest"));
const legacyManifest = JSON.parse(read("public/manifest.json"));
const sw = read("public/sw.js");
const middleware = read("middleware.ts");
const css = read("app/globals.css");
const mobileNav = read("components/MobileNav.tsx");
const apiBase = read("lib/apiBase.ts");
const adminAuth = read("lib/adminAuth.ts");

check("manifest principal existe", exists("public/manifest.webmanifest"));
check("manifest legado existe", exists("public/manifest.json"));
check("manifest inicia no dashboard", manifest.start_url === "/dashboard?source=pwa");
check("manifest legado inicia no dashboard", legacyManifest.start_url === "/dashboard?source=pwa");
check("manifest usa display standalone", manifest.display === "standalone");
check("manifest tem icone 192", manifest.icons?.some((icon) => icon.sizes === "192x192"));
check("manifest tem icone 512 maskable", manifest.icons?.some((icon) => icon.sizes === "512x512" && String(icon.purpose || "").includes("maskable")));
check("offline fallback existe", exists("public/offline.html"));
check("offline fallback é público no middleware", middleware.includes('"/offline.html"'));
check("service worker cacheia offline", sw.includes("/offline.html"));
check("service worker ignora APIs", sw.includes('url.pathname.startsWith("/api/")'));
check("service worker trata navegacao", sw.includes('request.mode === "navigate"'));
check("service worker não cacheia páginas autenticadas", sw.includes("authenticated navigations are network-only"));
check("service worker não pré-cacheia dashboard", !sw.includes('"/dashboard?source=pwa"'));
check("manifest permite qualquer orientação", manifest.orientation === "any");
check("menu mobile tem instalar app", mobileNav.includes("Instalar app"));
check("menu mobile tem sair", mobileNav.includes("Sair") && mobileNav.includes("logout"));
check("CSS tem breakpoint 1024", css.includes("@media (max-width: 1024px)"));
check("CSS tem breakpoint mobile 760", css.includes("@media (max-width: 760px)"));
check("CSS tem safe-area mobile", css.includes("env(safe-area-inset-bottom)"));
check("CSS ajusta calendario mobile", css.includes(".rbc-toolbar") && css.includes(".rbc-calendar"));
check("chamadas privadas usam proxy same-origin", apiBase.includes('return typeof window === "undefined" ? getDirectApiBaseUrl() : "/api/backend"'));
check("token de acesso não é persistido no localStorage", !adminAuth.includes("localStorage.setItem(TOKEN_KEY"));

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "OK" : "FALHOU"} - ${item.name}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} validacao(oes) mobile/PWA falharam.`);
  process.exit(1);
}

console.log("\nValidacao mobile/PWA concluida.");
