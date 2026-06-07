const sharp = require("sharp");
const path = require("path");

async function generate() {
  const src = path.join(process.cwd(), "public", "nodere-logo.png");
  await sharp(src).resize(192, 192).png().toFile(path.join(process.cwd(), "public", "nodere-logo-192.png"));
  await sharp(src).resize(512, 512).png().toFile(path.join(process.cwd(), "public", "nodere-logo-512.png"));
  console.log("PWA icons generated.");
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
