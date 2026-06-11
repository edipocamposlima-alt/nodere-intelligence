import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";

const deploymentId = process.argv[2] ?? "dpl_FNSh4CdUHvL3AdNsnW7QFhYfkNWZ";
const repoRoot = process.cwd();
const outputRoot = join(repoRoot, "recovered-production", deploymentId);
const rawTreePath = join(outputRoot, "deployment-files-tree.json");
const recoveredRoot = join(outputRoot, "artifacts");
const vercelCli =
  process.env.VERCEL_CLI ??
  (process.platform === "win32"
    ? "C:\\Users\\edipo\\AppData\\Roaming\\npm\\vercel.cmd"
    : "vercel");

const includePath = (pathParts) => {
  const path = pathParts.join("/");

  if (!path.startsWith("src/")) return false;
  if (path.includes("/node_modules/")) return false;

  if (path === "src/package.json") return true;
  if (path === "src/.env.example") return true;

  if (path.startsWith("src/.next/")) return true;

  if (path === "src/.vercel/output/config.json") return true;
  if (path.startsWith("src/.vercel/output/functions/")) return true;

  return false;
};

const runVercelApi = (endpoint) =>
  execFileSync(vercelCli, ["api", endpoint, "--raw"], {
    cwd: join(repoRoot, "apps", "web"),
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    shell: process.platform === "win32",
  });

const walk = (entries, parents = []) => {
  const files = [];

  for (const entry of entries) {
    const pathParts = [...parents, entry.name];

    if (entry.type === "directory") {
      files.push(...walk(entry.children ?? [], pathParts));
      continue;
    }

    if (entry.type === "file" && includePath(pathParts)) {
      files.push({
        path: pathParts.join("/"),
        uid: entry.uid,
        mode: entry.mode,
      });
    }
  }

  return files;
};

const decodeFileResponse = (raw) => {
  const parsed = JSON.parse(raw);
  if (!parsed.data) {
    throw new Error("Vercel file response did not include a data field.");
  }

  return Buffer.from(parsed.data, parsed.encoding === "utf8" ? "utf8" : "base64");
};

mkdirSync(outputRoot, { recursive: true });

console.log(`Reading deployment file tree for ${deploymentId}...`);
const rawTree = runVercelApi(`/v6/deployments/${deploymentId}/files`);
writeFileSync(rawTreePath, `${JSON.stringify(JSON.parse(rawTree), null, 2)}\n`);

const tree = JSON.parse(rawTree);
const files = walk(tree);
const manifest = {
  deploymentId,
  recoveredAt: new Date().toISOString(),
  note:
    "These files were downloaded from Vercel deployment artifacts. Original TS/TSX source files were not present in the deployment file tree.",
  fileCount: files.length,
  files,
};

writeFileSync(join(outputRoot, "recovery-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

let downloaded = 0;
let skipped = 0;
const contentCache = new Map();

for (const file of files) {
  const target = normalize(join(recoveredRoot, file.path));
  const rel = relative(recoveredRoot, target);
  if (rel.startsWith("..")) {
    throw new Error(`Refusing to write outside recovery folder: ${file.path}`);
  }

  if (existsSync(target)) {
    skipped += 1;
    continue;
  }

  let content = contentCache.get(file.uid);
  if (!content) {
    const rawFile = runVercelApi(`/v8/deployments/${deploymentId}/files/${file.uid}`);
    content = decodeFileResponse(rawFile);
    contentCache.set(file.uid, content);
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
  downloaded += 1;

  if ((downloaded + skipped) % 25 === 0 || downloaded + skipped === files.length) {
    console.log(`Processed ${downloaded + skipped}/${files.length} files (${downloaded} downloaded, ${skipped} skipped)...`);
  }
}

const readme = `# Production Recovery ${deploymentId}

Deployment: ${deploymentId}

URL: https://web-7drg7tyb3-edipo-lima-s-projects.vercel.app/

This folder preserves the recoverable Vercel deployment artifacts for the functional production version restored on 2026-06-11.

Important: Vercel did not expose the original TypeScript/TSX source files in the deployment file tree. The recovered files are compiled Next.js artifacts, manifests, static chunks, and Vercel output files. They are enough to audit the deployed behavior and route inventory, but they are not a clean source tree for future development.
`;

writeFileSync(join(outputRoot, "README.md"), readme);

console.log(`Recovery complete: ${downloaded} downloaded, ${skipped} skipped. Output: ${outputRoot}`);
