#!/usr/bin/env node
// Shrinks oversized photos under public/images/** in place (same path, same
// extension — nothing that references these files by path needs updating).
//
// Runs in CI (.github/workflows/optimize-images.yml) on every push that
// touches public/images/**, so a full-resolution phone photo uploaded
// through Keystatic gets caught and fixed automatically within a couple of
// minutes, instead of staying multi-megabyte until someone notices.
//
// By default only processes files listed in CHANGED_FILES (newline-
// separated repo-relative paths, set by the workflow from `git diff`) —
// NOT a full-tree rescan. Some photos (busy graphics, mostly) can't get
// under SIZE_LIMIT in one pass without visibly degrading; a full rescan on
// every unrelated future push would keep re-compressing those same files
// forever, losing quality each time for no size benefit. Pass --all (used
// for the one-off backfill via workflow_dispatch) to scan everything once.
//
// This does NOT handle HEIC/HEIC photos (unsupported browser format, not a
// size problem) — that's still covered by the upload warning in
// keystatic.config.ts.
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public/images");
const MAX_WIDTH = 2000;
const SIZE_LIMIT = 600 * 1024; // 600KB — above this, always try to shrink
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function candidateFiles() {
  if (process.argv.includes("--all")) {
    const files = [];
    for await (const f of walk(ROOT)) files.push(f);
    return files;
  }
  const list = (process.env.CHANGED_FILES ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => path.join(process.cwd(), l));
  return list;
}

async function optimize(file) {
  const ext = path.extname(file).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) return null;

  const original = await readFile(file);
  const before = original.length;
  const image = sharp(original);
  const meta = await image.metadata();
  const tooWide = (meta.width ?? 0) > MAX_WIDTH;
  if (before <= SIZE_LIMIT && !tooWide) return null;

  let pipeline = image.rotate(); // apply EXIF orientation, then drop it
  if (tooWide) pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });

  let out;
  if (ext === ".png") {
    out = await pipeline.png({ quality: 80, compressionLevel: 9, palette: true }).toBuffer();
  } else if (ext === ".webp") {
    out = await pipeline.webp({ quality: 82 }).toBuffer();
  } else {
    out = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  }

  // Only overwrite if it's actually an improvement.
  if (out.length >= before) return null;
  await writeFile(file, out);
  return { file, before, after: out.length };
}

const files = await candidateFiles();
const changed = [];
for (const file of files) {
  const result = await optimize(file).catch((err) => {
    console.warn(`skip ${file}: ${err.message}`);
    return null;
  });
  if (result) changed.push(result);
}

for (const c of changed) {
  const rel = path.relative(process.cwd(), c.file);
  const kb = (n) => `${(n / 1024).toFixed(0)}KB`;
  console.log(`compressed ${rel}: ${kb(c.before)} -> ${kb(c.after)}`);
}

// Consumed by the workflow to decide whether there's anything to commit.
console.log(`CHANGED_COUNT=${changed.length}`);
