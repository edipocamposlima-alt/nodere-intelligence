const sharp = require("sharp");
const path = require("path");

async function generate() {
  const publicDir = path.join(process.cwd(), "public");
  const src = path.join(publicDir, "logo-noderi-icon.png");
  const icon = sharp(src)
    .resize(640, 640, { fit: "cover", position: "center" })
    .png();

  await icon.clone().resize(16, 16).toFile(path.join(publicDir, "favicon-16x16.png"));
  await icon.clone().resize(32, 32).toFile(path.join(publicDir, "favicon-32x32.png"));
  await icon.clone().resize(180, 180).toFile(path.join(publicDir, "apple-touch-icon.png"));
  await icon.clone().resize(192, 192).toFile(path.join(publicDir, "android-chrome-192x192.png"));
  await icon.clone().resize(512, 512).toFile(path.join(publicDir, "android-chrome-512x512.png"));
  await icon.clone().resize(192, 192).toFile(path.join(publicDir, "icon-192.png"));
  await icon.clone().resize(512, 512).toFile(path.join(publicDir, "icon-512.png"));
  await icon.clone().resize(192, 192).toFile(path.join(publicDir, "nodere-logo-192.png"));
  await icon.clone().resize(512, 512).toFile(path.join(publicDir, "nodere-logo-512.png"));
  console.log("NODERI PWA icons generated.");
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
