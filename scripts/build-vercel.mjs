import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

const staticFiles = [
  "index.html",
  "app.js",
  "styles.css",
  "logo.svg",
  "manifest.webmanifest",
  "service-worker.js",
  "404.html",
  ".nojekyll",
  "nodere-icon.png",
  "nodere-logo-wordmark.png",
  "nodere-logo-source.png"
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of staticFiles) {
  await copyFile(join(root, file), join(dist, file));
}

console.log(`Vercel static build ready in ${dist}`);
