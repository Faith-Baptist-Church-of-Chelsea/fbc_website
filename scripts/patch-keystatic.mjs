// Patches @keystatic/core's editor so a save from an out-of-date tab never
// offers "Create a new branch" (entries saved that way land on a side branch
// and never reach the live site).
//
// Background: the site's files move under an open editor tab all the time
// (the photo-compressor bot commits ~30 s after any photo save). Keystatic
// then gets STALE_DATA from GitHub. Upstream retries only when the entry's
// folders are byte-identical to what the tab loaded, and for a NEW entry it
// compares against `undefined`, so creating an entry in a stale tab always
// hit the branch dialog (still true in 0.6.9).
//
// With this patch, on STALE_DATA:
//   1. If none of the files this save writes or deletes changed on GitHub
//      since the tab loaded, the save is retried on the latest version and
//      simply succeeds. (Covers new entries, and edits after the bot
//      compressed a photo.)
//   2. Otherwise the editor shows a plain error telling the editor to reload,
//      instead of the branch dialog.
//
// Runs on every `npm install` (postinstall), locally and on Vercel. It is
// idempotent, and it FAILS the install if the code it expects is not there,
// so a Keystatic upgrade can't silently drop the fix. @keystatic/core is
// pinned to an exact version for the same reason.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(new URL("../node_modules/@keystatic/core/dist/keystatic-core-ui.js", import.meta.url));
const MARK = "[fbc-patch]";
const MESSAGE =
  "This page is out of date, so your changes were NOT saved. Copy anything you just typed, then reload this page and save again.";

let src;
try {
  src = readFileSync(file, "utf8");
} catch {
  console.error(`patch-keystatic: ${file} not found`);
  process.exit(1);
}
if (src.includes(MARK)) {
  console.log("patch-keystatic: already applied");
  process.exit(0);
}

const edits = [
  // Keep the unscoped remote tree so individual files can be compared.
  [
    "const tree = scopeEntriesWithPathPrefix(await fetchGitHubTreeData(refData.data.repository.ref.target.oid, args.config), args.config);",
    "const __fbcRemote = await fetchGitHubTreeData(refData.data.repository.ref.target.oid, args.config);\n" +
      "            const tree = scopeEntriesWithPathPrefix(__fbcRemote, args.config);",
  ],
  // Retry when every file this save touches is unchanged on GitHub.
  [
    "if (treeKey === args.currentLocalTreeKey) {",
    "const __fbcSha = (t, p) => { const n = getTreeNodeAtPath(t, p); return n ? n.entry.sha : undefined; };\n" +
      "            const __fbcUntouched = [...additions.map(a => a.path), ...deletions.map(d => d.path)].every(p => __fbcSha(__fbcRemote.tree, p) === __fbcSha(unscopedTree, p));\n" +
      `            if (treeKey !== args.currentLocalTreeKey && __fbcUntouched) console.info("${MARK} site changed since this tab loaded; none of this entry's files did, saving on the latest version");\n` +
      "            if (treeKey === args.currentLocalTreeKey || __fbcUntouched) {",
  ],
  // A real conflict: say so plainly instead of offering a new branch.
  [
    "setState({\n                kind: 'needs-new-branch',\n                reason: 'This entry has been updated since it was opened. Create a new branch to save changes.'\n              });",
    `setState({\n                kind: 'error',\n                error: new Error(${JSON.stringify(MESSAGE)})\n              });`,
  ],
];

for (const [from, to] of edits) {
  const count = src.split(from).length - 1;
  if (count !== 1) {
    console.error(`patch-keystatic: expected exactly one match, found ${count}, for:\n  ${from.slice(0, 90)}...`);
    console.error("@keystatic/core changed. Update scripts/patch-keystatic.mjs before deploying.");
    process.exit(1);
  }
  src = src.replace(from, () => to);
}
writeFileSync(file, src);
console.log("patch-keystatic: applied to @keystatic/core editor");
