import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(process.cwd());
const repositoryRoot = path.resolve(webRoot, "../..");
const read = (relative) => fs.readFileSync(path.join(repositoryRoot, relative), "utf8");
const manual = read("apps/web/app/manual/page.tsx");
const manualClient = read("apps/web/app/manual/ManualClient.tsx");
const sidebar = read("apps/web/components/Sidebar.tsx");
const voice = read("apps/web/components/VoiceInputAssistant.tsx");
const legacyFicha = read("apps/web/app/companies/[id]/page.tsx");
const proposalPdf = read("apps/api/src/routes/proposals.ts");
const searchableProduct = [
  "apps/api/src",
  "apps/web/app",
  "apps/web/components",
  "apps/web/lib",
  "apps/web/public/index.html"
].flatMap((relative) => {
  const absolute = path.join(repositoryRoot, relative);
  if (fs.statSync(absolute).isFile()) return [[relative, fs.readFileSync(absolute, "utf8")]];
  return walk(absolute).map((file) => [path.relative(repositoryRoot, file), fs.readFileSync(file, "utf8")]);
});

const failures = [];
const requireText = (source, text, label) => { if (!source.includes(text)) failures.push(`${label}: texto obrigatório ausente: ${text}`); };

for (const section of ["Ficha 360", "Pesquisa pública com fontes", "Ditado PT-BR", "Eventos e ciclo de vida", "Propostas, contratos e PDFs", "Comunicações", "Agentes, modelos, créditos e aprovações"]) {
  requireText(manual, section, "manual vivo");
}
for (const route of ["/ai", "/searches", "/crm", "/companies", "/crm/communications", "/calendario", "/crm/briefings", "/app/proposals", "/catalog", "/reports", "/manual"]) {
  requireText(sidebar, route, "navegação documentada");
}
requireText(manualClient, "Fluxo ilustrado de operação", "manual ilustrado");
requireText(voice, 'recognition.lang = "pt-BR"', "ditado PT-BR");
requireText(voice, "SENSITIVE_PATTERN", "proteção de campos sensíveis");
requireText(legacyFicha, "/app/crm/clientes/", "Ficha 360 canônica");
for (const marker of ["1. Partes e objeto", "Resumo executivo", "Confidencialidade e dados", "Próximo passo", "Página ${index + 1}"]) requireText(proposalPdf, marker, "PDFs distintos");

const forbidden = /\b(?:apollo(?:\.io)?|econodata)\b/i;
for (const [file, content] of searchableProduct) {
  if (/[\\/]tests[\\/]/.test(file)) continue;
  if (forbidden.test(content)) failures.push(`provedor removido ainda citado em ${file}`);
}

if (failures.length) {
  process.stderr.write(`Gate documental V7 reprovado:\n- ${failures.join("\n- ")}\n`);
  process.exit(1);
}
process.stdout.write("Gate documental V7 aprovado: manual vivo, ilustrações, rotas e contratos de UX sincronizados.\n");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", ".next"].includes(entry.name)) return [];
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : entry.isFile() && /\.(?:ts|tsx|js|mjs|html)$/.test(entry.name) ? [absolute] : [];
  });
}
