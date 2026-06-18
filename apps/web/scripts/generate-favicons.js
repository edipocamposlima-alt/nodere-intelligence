const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const publicDir = path.join(__dirname, "..", "public");
const iconPng = path.join(publicDir, "nodere-icon-official.png");

const targets = [
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["apple-touch-icon.png", 180],
  ["android-chrome-192x192.png", 192],
  ["android-chrome-512x512.png", 512]
];

async function generate() {
  const icon = fs.readFileSync(iconPng);

  for (const [file, size] of targets) {
    await sharp(icon).resize(size, size).png().toFile(path.join(publicDir, file));
  }

  fs.copyFileSync(path.join(publicDir, "favicon-32x32.png"), path.join(publicDir, "favicon.ico"));
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
