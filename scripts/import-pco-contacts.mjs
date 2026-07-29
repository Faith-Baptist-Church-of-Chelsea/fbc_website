// One-off import: Planning Center People → the "This Week at Faith"
// Resend audience. Run locally from the project root:
//
//   node scripts/import-pco-contacts.mjs           # dry run (counts only)
//   node scripts/import-pco-contacts.mjs --import  # actually import
//
// Pulls every ACTIVE ADULT with an email address (children and inactive
// people are skipped). Safe to re-run: Resend treats an existing email in
// the audience as already-subscribed, and anyone who unsubscribed stays
// unsubscribed. Needs PCO_APP_ID, PCO_SECRET, RESEND_FULL_API_KEY in
// .env.local.
import fs from "node:fs";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const AUDIENCE_NAME = "This Week at Faith";
const doImport = process.argv.includes("--import");
const pcoAuth = "Basic " + Buffer.from(`${env.PCO_APP_ID}:${env.PCO_SECRET}`).toString("base64");

// 1. Pull active adults with emails from Planning Center
const people = new Map();
let url =
  "https://api.planningcenteronline.com/people/v2/people?where[status]=active&where[child]=false&include=emails&per_page=100";
while (url) {
  const d = await (await fetch(url, { headers: { Authorization: pcoAuth } })).json();
  for (const p of d.data) {
    people.set(p.id, { first: p.attributes.first_name ?? "", last: p.attributes.last_name ?? "", email: null });
  }
  for (const inc of d.included ?? []) {
    if (inc.type !== "Email") continue;
    const person = people.get(inc.relationships.person.data.id);
    // Prefer the primary email; otherwise first one wins
    if (person && (!person.email || inc.attributes.primary)) person.email = inc.attributes.address;
  }
  url = d.links.next ?? null;
}
const seen = new Set();
const contacts = [...people.values()].filter((p) => {
  if (!p.email) return false;
  const key = p.email.toLowerCase().trim();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
console.log(`Planning Center: ${people.size} active adults, ${contacts.length} unique emails`);
if (!doImport) {
  console.log("Dry run only. Re-run with --import to add them to Resend.");
  process.exit(0);
}

// 2. Find-or-create the audience
if (!env.RESEND_FULL_API_KEY) {
  console.error("RESEND_FULL_API_KEY missing from .env.local — create a full-access key first.");
  process.exit(1);
}
const rHeaders = { Authorization: `Bearer ${env.RESEND_FULL_API_KEY}`, "Content-Type": "application/json" };
const audiences = await (await fetch("https://api.resend.com/audiences", { headers: rHeaders })).json();
let audienceId = audiences.data?.find((a) => a.name === AUDIENCE_NAME)?.id;
if (!audienceId) {
  const created = await (
    await fetch("https://api.resend.com/audiences", {
      method: "POST",
      headers: rHeaders,
      body: JSON.stringify({ name: AUDIENCE_NAME }),
    })
  ).json();
  audienceId = created.id;
  console.log(`Created audience "${AUDIENCE_NAME}" (${audienceId})`);
}

// 3. Import, politely (Resend allows ~2 requests/second)
let ok = 0,
  failed = 0;
for (const [i, c] of contacts.entries()) {
  const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: "POST",
    headers: rHeaders,
    body: JSON.stringify({ email: c.email, first_name: c.first, last_name: c.last, unsubscribed: false }),
  });
  if (res.ok) ok++;
  else {
    failed++;
    if (failed <= 5) console.warn(`  ✗ ${c.email}: HTTP ${res.status}`);
  }
  if ((i + 1) % 50 === 0) console.log(`  …${i + 1}/${contacts.length}`);
  await new Promise((r) => setTimeout(r, 600));
}
console.log(`Done: ${ok} imported, ${failed} failed.`);
