// Use your good-quality frames as the site's film, whatever they are named.
//
//   node scripts/use-frames.mjs "path/to/good-images-folder"
//
// Tip: type  node scripts/use-frames.mjs  then drag the folder from Finder into the terminal.
//
// What it does:
//   1. sorts the images in natural order (1, 2, 10 - not 1, 10, 2)
//   2. renames them frame-001.webp ... frame-151.webp
//   3. .webp files are copied untouched (no quality loss); jpg/png are converted at high quality
//   4. your old public/assets/film folder is kept as public/assets/film-old

import sharp from "sharp";
import { copyFile, mkdir, readdir, rename, stat } from "node:fs/promises";
import path from "node:path";

const SRC = process.argv[2];
const OUT = path.join(process.cwd(), "public/assets/film");
const BACKUP = path.join(process.cwd(), "public/assets/film-old");
const MAX_WIDTH = 1920;
const QUALITY = 88;

if (!SRC) {
  console.error('Usage: node scripts/use-frames.mjs "path/to/good-images-folder"');
  process.exit(1);
}
const srcDir = path.resolve(SRC.replace(/^~(?=$|\/)/, process.env.HOME ?? "~"));

const exts = new Set([".webp", ".jpg", ".jpeg", ".png"]);
const files = (await readdir(srcDir))
  .filter((f) => !f.startsWith(".") && exts.has(path.extname(f).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

if (files.length === 0) {
  console.error(`No images found in ${srcDir}`);
  process.exit(1);
}
console.log(`Found ${files.length} images. First: ${files[0]}   Last: ${files[files.length - 1]}`);
if (files.length !== 151) {
  console.warn(`WARNING: the site expects 151 frames but found ${files.length}.`);
}

// keep the old frames as a backup (only the first time)
const hasOut = await stat(OUT).then(() => true, () => false);
const hasBackup = await stat(BACKUP).then(() => true, () => false);
if (hasOut && !hasBackup) await rename(OUT, BACKUP);
await mkdir(OUT, { recursive: true });

let bytes = 0;
for (const [i, f] of files.entries()) {
  const from = path.join(srcDir, f);
  const to = path.join(OUT, `frame-${String(i + 1).padStart(3, "0")}.webp`);
  if (path.extname(f).toLowerCase() === ".webp") {
    await copyFile(from, to);
  } else {
    await sharp(from)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true, kernel: "lanczos3" })
      .webp({ quality: QUALITY, effort: 5, smartSubsample: true })
      .toFile(to);
  }
  bytes += (await stat(to)).size;
}

console.log(
  `Done: ${files.length} frames in public/assets/film, ${(bytes / 1048576).toFixed(1)} MB total (~${Math.round(bytes / files.length / 1024)} KB each).`,
);
