import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const publicDir = path.resolve(process.cwd(), "public");
const logoSource = path.join(publicDir, "brand-logo-official.png");
const iconSource = path.join(publicDir, "brand-icon-official.png");
const OFFICIAL_BACKGROUND = "#68716d";

function makeTransparentLogo(pipeline) {
  return pipeline
    .trim({ background: "#5f6764", threshold: 34 })
    .ensureAlpha()
    .removeAlpha()
    .median(1)
    .removeAlpha()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const output = Buffer.alloc(data.length);
      for (let i = 0; i < data.length; i += info.channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const isWhiteMark = r > 224 && g > 224 && b > 224;
        const isGreenMark = saturation > 0.18 && g > 78 && g >= r && g >= b;
        const isDarkOutline = max < 34 && saturation > 0.08;
        const isBackground = !isWhiteMark && !isGreenMark && !isDarkOutline;
        output[i] = r;
        output[i + 1] = g;
        output[i + 2] = b;
        output[i + 3] = isBackground ? 0 : 255;
      }
      const cleaned = Buffer.from(output);
      const pixelIndex = (x, y) => (y * info.width + x) * info.channels;
      for (let y = 1; y < info.height - 1; y += 1) {
        for (let x = 1; x < info.width - 1; x += 1) {
          const index = pixelIndex(x, y);
          if (output[index + 3] === 0) continue;
          let opaqueNeighbors = 0;
          for (let yy = -1; yy <= 1; yy += 1) {
            for (let xx = -1; xx <= 1; xx += 1) {
              if (output[pixelIndex(x + xx, y + yy) + 3] > 0) opaqueNeighbors += 1;
            }
          }
          if (opaqueNeighbors <= 2) cleaned[index + 3] = 0;
        }
      }
      return sharp(cleaned, { raw: { width: info.width, height: info.height, channels: info.channels } });
    });
}

async function writePng(name, pipeline, options = {}) {
  const image = options.transparent ? pipeline : pipeline.flatten({ background: OFFICIAL_BACKGROUND });
  await image
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(publicDir, name));
}

async function writeTransparentLogo(name, pipeline) {
  await writePng(name, await makeTransparentLogo(pipeline), { transparent: true });
}

async function writePngWithBackground(name, pipeline) {
  await pipeline
    .flatten({ background: OFFICIAL_BACKGROUND })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(publicDir, name));
}

async function writeIco(name, pngNames) {
  const images = await Promise.all(
    pngNames.map(async (pngName) => {
      const file = await fs.readFile(path.join(publicDir, pngName));
      const metadata = await sharp(file).metadata();
      return { file, width: metadata.width ?? 0, height: metadata.height ?? 0 };
    })
  );
  const headerSize = 6;
  const dirSize = 16 * images.length;
  let offset = headerSize + dirSize;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const directories = images.map((image) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(image.width >= 256 ? 0 : image.width, 0);
    entry.writeUInt8(image.height >= 256 ? 0 : image.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.file.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.file.length;
    return entry;
  });
  await fs.writeFile(path.join(publicDir, name), Buffer.concat([header, ...directories, ...images.map((image) => image.file)]));
}

async function main() {
  await fs.access(logoSource);
  await fs.access(iconSource);
  const base = sharp(logoSource).rotate();
  const metadata = await base.metadata();
  const width = metadata.width ?? 1536;
  const height = metadata.height ?? 1024;
  const iconBase = sharp(iconSource).rotate();
  const iconMetadata = await iconBase.metadata();
  const iconWidth = iconMetadata.width ?? 1536;
  const iconHeight = iconMetadata.height ?? 1024;

  // Official source is the full NODERE logo. The full crop keeps the wordmark
  // for platform surfaces, while the icon crop extracts the symbol for PWA/favicons.
  const fullCrop = {
    left: Math.round(width * 0.17),
    top: Math.round(height * 0.34),
    width: Math.round(width * 0.64),
    height: Math.round(height * 0.28)
  };
  const iconCrop = {
    left: Math.round(iconWidth * 0.29),
    top: Math.round(iconHeight * 0.2),
    width: Math.round(iconWidth * 0.42),
    height: Math.round(iconWidth * 0.42)
  };

  await writeTransparentLogo("logo-nodere-full.png", sharp(logoSource).rotate().extract(fullCrop).resize({ width: 900, withoutEnlargement: true }));
  await writePngWithBackground("logo-nodere-icon.png", sharp(iconSource).rotate().extract(iconCrop).resize(512, 512, { fit: "cover" }));

  // Legacy filenames remain active only where old documents still resolve them,
  // but every generated asset is derived from the official brand file.
  await writeTransparentLogo("nodere-logo.png", sharp(logoSource).rotate().extract(fullCrop).resize({ width: 900, withoutEnlargement: true }));
  await writeTransparentLogo("nodere-wordmark.png", sharp(logoSource).rotate().extract(fullCrop).resize({ width: 900, withoutEnlargement: true }));

  await writePngWithBackground("favicon-16x16.png", sharp(iconSource).rotate().extract(iconCrop).resize(16, 16));
  await writePngWithBackground("favicon-32x32.png", sharp(iconSource).rotate().extract(iconCrop).resize(32, 32));
  await writePngWithBackground("apple-touch-icon.png", sharp(iconSource).rotate().extract(iconCrop).resize(180, 180));
  await writePngWithBackground("android-chrome-192x192.png", sharp(iconSource).rotate().extract(iconCrop).resize(192, 192));
  await writePngWithBackground("android-chrome-512x512.png", sharp(iconSource).rotate().extract(iconCrop).resize(512, 512));
  await writePngWithBackground("icon-192.png", sharp(iconSource).rotate().extract(iconCrop).resize(192, 192));
  await writePngWithBackground("icon-512.png", sharp(iconSource).rotate().extract(iconCrop).resize(512, 512));
  await writePngWithBackground("nodere-logo-192.png", sharp(iconSource).rotate().extract(iconCrop).resize(192, 192));
  await writePngWithBackground("nodere-logo-512.png", sharp(iconSource).rotate().extract(iconCrop).resize(512, 512));

  await writePng(
    "og-image.png",
    sharp(logoSource)
      .rotate()
      .resize(1200, 630, { fit: "cover", position: "center" })
  );
  await writeIco("favicon.ico", ["favicon-16x16.png", "favicon-32x32.png", "android-chrome-192x192.png"]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
