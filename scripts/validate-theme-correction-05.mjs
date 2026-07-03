import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const layout = read("apps/web/app/layout.tsx");
const loginLayout = read("apps/web/app/login/layout.tsx");
const theme = read("apps/web/lib/theme.ts");
const globals = read("apps/web/app/globals.css");
const header = read("apps/web/components/Header.tsx");

assert(!/<html[^>]+className=["']dark["']/.test(layout), "layout raiz ainda fixa className=\"dark\" no html");
assert(/r\.classList\.toggle\('light',isLight\)/.test(layout), "script inicial nao aplica classe light no html");
assert(/r\.classList\.toggle\('dark',!isLight\)/.test(layout), "script inicial nao remove classe dark no tema claro");
assert(/bg-\[var\(--bg-main\)\]/.test(loginLayout), "layout de login ainda nao usa token de fundo do tema");
assert(/document\.body\.dataset\.theme = resolvedMode/.test(theme), "ThemeProvider nao sincroniza data-theme no body");
assert(/document\.body\.classList\.toggle\("light", resolvedMode === "light"\)/.test(theme), "ThemeProvider nao aplica classe light no body");
assert(/document\.body\.classList\.toggle\("dark", resolvedMode === "dark"\)/.test(theme), "ThemeProvider nao remove classe dark no body quando modo claro");
assert(!/:root,\s*\n:root\[data-theme="dark"\],\s*\n\.dark \{/.test(globals), "CSS ainda declara tokens escuros para :root incondicional");
assert(/:root:not\(\[data-theme="light"\]\),\s*\n:root\[data-theme="dark"\],\s*\n\.dark:not\(\.light\) \{/.test(globals), "CSS nao protege tokens escuros contra tema claro");
assert(/bg-gray-950/.test(globals) && /bg-slate-950/.test(globals), "camada final de tema claro nao cobre classes legadas bg-gray-950/bg-slate-950");
assert(/value="light">Claro/.test(header), "Preferencias rapidas nao mantem enum interno light com label Claro");
assert(/value="dark">Escuro/.test(header), "Preferencias rapidas nao mantem enum interno dark com label Escuro");

if (errors.length) {
  console.error("Validacao Correção 05 reprovada:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Validacao Correção 05 aprovada: tema claro nao fica preso em tokens/classes escuras.");
