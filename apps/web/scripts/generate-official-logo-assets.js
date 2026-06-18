const path = require("path");
const sharp = require("sharp");

const publicDir = path.join(__dirname, "..", "public");
const source = path.join(publicDir, "nodere-logo-source.png");

const logoCrop = { left: 250, top: 300, width: 1000, height: 340 };
const iconCrop = { left: 260, top: 320, width: 270, height: 300 };

async function main() {
  await sharp(source)
    .extract(logoCrop)
    .resize({ width: 720, withoutEnlargement: true })
    .png()
    .toFile(path.join(publicDir, "nodere-logo-official.png"));

  await sharp(source)
    .extract(iconCrop)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, "nodere-icon-official.png"));

  const faviconTargets = [
    ["favicon-16x16.png", 16],
    ["favicon-32x32.png", 32],
    ["apple-touch-icon.png", 180],
    ["android-chrome-192x192.png", 192],
    ["android-chrome-512x512.png", 512]
  ];

  const icon = await sharp(path.join(publicDir, "nodere-icon-official.png")).png().toBuffer();
  for (const [file, size] of faviconTargets) {
    await sharp(icon).resize(size, size).png().toFile(path.join(publicDir, file));
  }

  await sharp(icon).resize(32, 32).png().toFile(path.join(publicDir, "favicon.ico"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
