#!/usr/bin/env node
// Moves events whose last day is more than ARCHIVE_AFTER_DAYS in the past
// from content/events/ to content/events-archive/. The site already hides
// past events; this just keeps the Events list in Keystatic from growing
// forever. Run by .github/workflows/archive-events.yml monthly.
import { readdir, readFile, rename, mkdir } from "node:fs/promises";
import path from "node:path";

const ARCHIVE_AFTER_DAYS = 60;
const SRC = path.join(process.cwd(), "content/events");
const DEST = path.join(process.cwd(), "content/events-archive");

const cutoff = new Date();
cutoff.setUTCDate(cutoff.getUTCDate() - ARCHIVE_AFTER_DAYS);
const cutoffStr = cutoff.toISOString().slice(0, 10);

await mkdir(DEST, { recursive: true });
let moved = 0;
for (const name of await readdir(SRC)) {
  if (!name.endsWith(".mdx")) continue;
  const text = await readFile(path.join(SRC, name), "utf8");
  const date = text.match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
  const until = text.match(/^showUntil:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
  const lastDay = until && until > (date ?? "") ? until : date;
  if (!lastDay || lastDay >= cutoffStr) continue;
  await rename(path.join(SRC, name), path.join(DEST, name));
  console.log(`archived ${name} (last day ${lastDay})`);
  moved++;
}
console.log(`CHANGED_COUNT=${moved}`);
