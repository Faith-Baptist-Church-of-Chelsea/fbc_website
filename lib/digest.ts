// "This Week at Faith" — a weekly digest email composed automatically
// from the events collection, the latest sermon, and any active
// announcements. Sent to the staff list every Monday morning (cron in
// vercel.json) and on demand from /admin, ready to forward on or copy
// into the church's regular email tool.
import "server-only";
import { Resend } from "resend";
import site from "@/content/site.json";
import { getUpcomingEvents, getActiveAnnouncements } from "@/lib/content";
import { getRecentVideos } from "@/lib/youtube";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function composeDigest(): Promise<{ subject: string; html: string }> {
  const [events, announcements, videos] = await Promise.all([
    getUpcomingEvents(),
    getActiveAnnouncements(),
    getRecentVideos(1).catch(() => []),
  ]);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Detroit" });
  const weekOut = new Date(Date.now() + 8 * 86400_000).toLocaleDateString("en-CA", {
    timeZone: "America/Detroit",
  });
  const thisWeek = events.filter((e) => e.date <= weekOut);
  const later = events.filter((e) => e.date > weekOut).slice(0, 3);
  const latest = videos[0];

  const section = (title: string, body: string) =>
    `<h2 style="margin:28px 0 10px;font-size:16px;text-transform:uppercase;letter-spacing:.05em;color:#061031;">${title}</h2>${body}`;

  const eventRow = (e: (typeof events)[number]) =>
    `<p style="margin:0 0 12px;">
      <a href="${SITE_URL}/events/${e.slug}" style="font-weight:700;color:#006d9a;text-decoration:none;">${e.title}</a><br/>
      <span style="color:#475569;">${prettyDate(e.date)}${e.time ? ` · ${e.time}` : ""}${e.location ? ` · ${e.location}` : ""}</span>
    </p>`;

  let body = "";
  body += section(
    "This week",
    thisWeek.length > 0
      ? thisWeek.map(eventRow).join("")
      : `<p style="margin:0;color:#475569;">No special events this week — just the regular services below.</p>`
  );
  if (later.length > 0) body += section("Coming up", later.map(eventRow).join(""));
  if (announcements.length > 0) {
    body += section(
      "Announcements",
      announcements
        .map((a) => `<p style="margin:0 0 8px;font-weight:600;color:#0f172a;">${a.entry.title}</p>`)
        .join("")
    );
  }
  if (latest) {
    body += section(
      "Latest message",
      `<p style="margin:0;"><a href="https://www.youtube.com/watch?v=${latest.videoId}" style="font-weight:700;color:#006d9a;text-decoration:none;">${latest.title}</a></p>`
    );
  }
  body += section(
    "Services",
    site.services
      .map(
        (s) =>
          `<p style="margin:0 0 4px;color:#475569;"><strong style="color:#0f172a;">${s.name}</strong> — ${s.day} ${s.time}</p>`
      )
      .join("")
  );

  const monday = prettyDate(today);
  return {
    subject: `This Week at Faith — ${monday}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
        <h1 style="margin:0;font-size:24px;color:#061031;">This Week at Faith</h1>
        <p style="margin:6px 0 0;color:#475569;">Auto-composed from the website — forward it on, or copy what you need.</p>
        ${body}
        <p style="margin:32px 0 0;font-size:12px;color:#94a3b8;">
          Sent automatically every Monday by ${SITE_URL}. Edit events and announcements at ${SITE_URL}/admin to change next week's email.
        </p>
      </div>`,
  };
}

export async function sendDigest(): Promise<{ sent: boolean; detail: string }> {
  if (!process.env.RESEND_API_KEY) return { sent: false, detail: "RESEND_API_KEY not set" };
  const { subject, html } = await composeDigest();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Faith Baptist Website <onboarding@resend.dev>", // TODO: switch after domain verification
    to: [...site.formRecipients],
    subject,
    html,
  });
  if (error) return { sent: false, detail: error.message };
  return { sent: true, detail: `Sent to ${site.formRecipients.join(", ")}` };
}
