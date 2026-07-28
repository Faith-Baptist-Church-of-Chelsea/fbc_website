// Assembles everything the chat assistant is allowed to know about the
// church, from the same content files that drive the website. The assistant
// is instructed to answer ONLY from this text — see app/api/ask/route.ts.
import "server-only";
import fs from "node:fs";
import path from "node:path";
import site from "@/content/site.json";
import sof from "@/content/statement-of-faith.json";
import { getActiveAnnouncements, getStaff, reader } from "@/lib/content";

export async function buildChurchKnowledge(): Promise<string> {
  const services = site.services
    .map((s) => `- ${s.day} ${s.time} — ${s.name}`)
    .join("\n");
  const hours = site.officeHours
    .map((h) => `- ${h.days}: ${h.hours}`)
    .join("\n");

  const staff = await getStaff();
  const staffText = (
    await Promise.all(
      staff.map(async ({ slug, entry }) => {
        const full = await reader.collections.staff.read(slug);
        const bio = full ? (await full.bio()).replace(/\{\/\*[\s\S]*?\*\/\}/g, "").trim() : "";
        return `### ${entry.name} — ${entry.role}\n${bio}`;
      })
    )
  ).join("\n\n");

  const announcements = await getActiveAnnouncements();
  const announcementText =
    announcements.length > 0
      ? announcements
          .map((a) => `- ${a.entry.title}${a.entry.expires ? ` (through ${a.entry.expires})` : ""}`)
          .join("\n")
      : "- No special announcements right now.";

  const sofText = sof.sections
    .map((s) => `### ${s.title}\n${s.body.join("\n")}`)
    .join("\n\n");

  let facts = "";
  try {
    facts = fs.readFileSync(path.join(process.cwd(), "content", "chat-facts.md"), "utf8");
  } catch {
    console.warn("[ask] content/chat-facts.md missing");
  }

  return `# Faith Baptist Church of Chelsea — reference information

Address: ${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip} (${site.address.directionsNote})
Phone: ${site.phone}
Office email: ${site.emails.office}
Website addresses: Church Center ${site.links.churchCenter} · Giving ${site.links.giving} · YouTube ${site.social.youtube}

## Service times
${services}

## Office hours
${hours}

## Leadership & staff
${staffText}

## Current announcements
${announcementText}

## Additional facts
${facts}

## Full Statement of Faith
${sofText}`;
}
