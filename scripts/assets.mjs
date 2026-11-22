// Builds the site's images from your source frames.
//
//   node scripts/optimize-assets.mjs            -> only builds what is missing or out of date
//   FORCE=1 node scripts/optimize-assets.mjs    -> rebuilds everything (use after changing settings)
//
// Optional settings (env):  FILM_WIDTH=1920  FILM_QUALITY=86  SRC_DIR="path/to/frames"

import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const srcDir = process.env.SRC_DIR
  ? path.resolve(process.env.SRC_DIR)
  : path.join(root, "Self-WindingTreatRollerv21-ezgif-split final");
const filmDir = path.join(root, "public/assets/film");
const plateDir = path.join(root, "public/assets/plates");
const brandDir = path.join(root, "public/assets/brand");
const appDir = path.join(root, "app");

const FORCE = process.env.FORCE === "1";
const FILM_WIDTH = Number(process.env.FILM_WIDTH || 1920); // was 1280
const FILM_QUALITY = Number(process.env.FILM_QUALITY || 86); // was 76
const PLATE_QUALITY = 90; // was 86

await mkdir(filmDir, { recursive: true });
await mkdir(plateDir, { recursive: true });
await mkdir(brandDir, { recursive: true });
await mkdir(appDir, { recursive: true });

const exists = (p) =>
  stat(p).then(
    () => true,
    () => false,
  );

// true when the output is missing (or older than its source) or FORCE=1
async function needsBuild(out, src) {
  if (FORCE) return true;
  const o = await stat(out).catch(() => null);
  if (!o) return true;
  if (!src) return false; // hand-made file already there: leave it alone
  const s = await stat(src).catch(() => null);
  return s ? s.mtimeMs > o.mtimeMs : false;
}

const files = (await readdir(srcDir))
  .filter((f) => f.endsWith(".jpg"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (files.length !== 151) {
  console.warn(`Expected 151 frames, found ${files.length}`);
}

// quality note: frames are never upscaled past their real size (that only adds blur)
const first = await sharp(path.join(srcDir, files[0])).metadata();
console.log(`Source frames are ${first.width}x${first.height}; film output width ${Math.min(FILM_WIDTH, first.width ?? FILM_WIDTH)}`);

let written = 0;
let skipped = 0;
for (let i = 0; i < files.length; i++) {
  const src = path.join(srcDir, files[i]);
  const out = path.join(filmDir, `frame-${String(i + 1).padStart(3, "0")}.webp`);
  if (!(await needsBuild(out, src))) {
    skipped++;
    continue;
  }
  await sharp(src)
    .resize({ width: FILM_WIDTH, withoutEnlargement: true, kernel: "lanczos3" })
    .sharpen({ sigma: 0.5 })
    .webp({ quality: FILM_QUALITY, effort: 6, smartSubsample: true })
    .toFile(out);
  written++;
}

const frame = (n) =>
  path.join(srcDir, `ezgif-frame-${String(n).padStart(3, "0")}.jpg`);

const plates = [
  { name: "plate-01.webp", input: frame(30), width: 1400 },
  { name: "plate-02.webp", input: frame(30), crop: { left: 70, top: 64, width: 640, height: 640 }, width: 760 },
  { name: "plate-03.webp", input: frame(30), crop: { left: 370, top: 70, width: 720, height: 600 }, width: 760 },
  { name: "plate-04.webp", input: frame(120), width: 1400 },
];

// plates, posters, logo and icon are skipped when the file already exists,
// so images you enhanced by hand are not overwritten. FORCE=1 rebuilds them.
let plateCount = 0;
for (const plate of plates) {
  const out = path.join(plateDir, plate.name);
  if (!(await needsBuild(out, null))) continue;
  let img = sharp(plate.input);
  if (plate.crop) img = img.extract(plate.crop);
  await img
    .resize({ width: plate.width, withoutEnlargement: false, kernel: "lanczos3" })
    .sharpen({ sigma: 0.5 })
    .webp({ quality: PLATE_QUALITY, effort: 6, smartSubsample: true })
    .toFile(out);
  plateCount++;
}

async function build(out, make) {
  if (await needsBuild(out, null)) await make(out);
}

await build(path.join(plateDir, "hero-poster.webp"), (o) =>
  sharp(frame(30)).webp({ quality: 88, smartSubsample: true }).toFile(o));
await build(path.join(plateDir, "poster.webp"), (o) =>
  sharp(frame(151)).webp({ quality: 88, smartSubsample: true }).toFile(o));
await build(path.join(plateDir, "poster-large.webp"), (o) =>
  sharp(frame(151)).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 88, smartSubsample: true }).toFile(o));

const logo = path.join(root, "Playful Cadence Puppy Treat Logo.png");
if (await exists(logo)) {
  await build(path.join(brandDir, "logo.webp"), (o) =>
    sharp(logo).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 92 }).toFile(o));
  await build(path.join(brandDir, "logo-small.webp"), (o) =>
    sharp(logo).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 90 }).toFile(o));
  await build(path.join(appDir, "icon.png"), (o) =>
    sharp(logo)
      .resize({ width: 512, height: 512, fit: "contain", background: "#f7f1e6" })
      .png()
      .toFile(o));
} else {
  console.warn("Logo PNG not found, skipping logo and icon.");
}

console.log(`Film frames: ${written} written, ${skipped} up to date. Plates written: ${plateCount}.`);
