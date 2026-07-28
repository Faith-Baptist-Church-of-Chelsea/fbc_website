// "This Week at Faith" — a weekly digest email composed automatically
// from the events collection, the latest sermon, and any active
// announcements. Sent to the staff list every Monday morning (cron in
// vercel.json) and on demand from /admin, ready to forward on or copy
// into the church's regular email tool.
// Styled to match the visitor welcome email in lib/forms.ts: email-client-
// safe tables, navy logo header, rounded cards, brand-blue button.
import "server-only";
import { Resend } from "resend";
import site from "@/content/site.json";
import { getUpcomingEvents, getActiveAnnouncements, type ChurchEvent } from "@/lib/content";
import { getRecentVideos } from "@/lib/youtube";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Only embed an event graphic if the file really exists, so the email
// never shows broken images.
function imageUrlIfExists(publicPath: string | null): string | null {
  if (!publicPath) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- avoid top-level fs in a file also used by route bundles
    const fs = require("node:fs") as typeof import("node:fs");
    return fs.existsSync(`${process.cwd()}/public${publicPath}`) ? `${SITE_URL}${publicPath}` : null;
  } catch {
    return null;
  }
}

function sectionLabel(text: string): string {
  return `<p style="margin:26px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#006389;font-weight:bold;">${esc(text)}</p>`;
}

// One event as a rounded card: graphic thumbnail (16:9) + title/when/where.
function eventCard(e: ChurchEvent): string {
  const img = imageUrlIfExists(e.image);
  const thumb = img
    ? `<td width="136" valign="top" style="padding:14px 0 14px 14px;"><a href="${SITE_URL}/events/${e.slug}"><img src="${img}" width="120" height="68" alt="" style="border-radius:8px;display:block;object-fit:cover;" /></a></td>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-top:12px;"><tr>${thumb}
    <td valign="middle" style="padding:14px;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0;font-size:17px;font-weight:bold;"><a href="${SITE_URL}/events/${e.slug}" style="color:#0f172a;text-decoration:none;">${esc(e.title)}</a></p>
      <p style="margin:5px 0 0;font-size:14px;line-height:1.5;color:#475569;">${esc(prettyDate(e.date))}${e.time ? ` · ${esc(e.time)}` : ""}${e.location ? `<br/>${esc(e.location)}` : ""}</p>
    </td></tr></table>`;
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
  const latestThumb = latest?.thumbnail ?? null;

  let body = "";

  body += sectionLabel("This week");
  body +=
    thisWeek.length > 0
      ? thisWeek.map(eventCard).join("")
      : `<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#475569;">No special events this week — just the regular services below.</p>`;

  if (later.length > 0) {
    body += sectionLabel("Coming up");
    body += later.map(eventCard).join("");
  }

  if (announcements.length > 0) {
    body += sectionLabel("Announcements");
    body += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-top:12px;"><tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.9;color:#0f172a;">
      ${announcements.map((a) => `<strong>${esc(a.entry.title)}</strong>`).join("<br/>")}
    </td></tr></table>`;
  }

  if (latest) {
    body += sectionLabel("Latest message");
    body += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-top:12px;"><tr>
      ${latestThumb ? `<td width="136" valign="top" style="padding:14px 0 14px 14px;"><a href="https://www.youtube.com/watch?v=${latest.videoId}"><img src="${latestThumb}" width="120" height="68" alt="" style="border-radius:8px;display:block;object-fit:cover;" /></a></td>` : ""}
      <td valign="middle" style="padding:14px;font-family:Arial,Helvetica,sans-serif;">
        <p style="margin:0;font-size:17px;font-weight:bold;"><a href="https://www.youtube.com/watch?v=${latest.videoId}" style="color:#0f172a;text-decoration:none;">${esc(latest.title)}</a></p>
        <p style="margin:5px 0 0;font-size:14px;color:#475569;">Watch or share on YouTube →</p>
      </td></tr></table>`;
  }

  const monday = prettyDate(today);
  return {
    subject: `This Week at Faith — ${monday}`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#e2e8f0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e2e8f0;padding:24px 8px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr><td style="background:#0f172a;padding:28px 24px;" align="center">
    <img src="${SITE_URL}/images/logo-horizontal-light.png" width="280" alt="Faith Baptist Church of Chelsea" style="display:block;max-width:280px;height:auto;" />
  </td></tr>
  <tr><td style="padding:32px 28px 8px;font-family:Arial,Helvetica,sans-serif;">
    <h1 style="margin:0;font-size:24px;color:#0f172a;">This Week at Faith</h1>
    <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#334155;">${esc(monday)} — composed automatically from the website. Forward it on, or copy what you need.</p>
    ${body}
  </td></tr>
  <tr><td style="padding:24px 28px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;"><tr><td style="padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8;color:#334155;">
      <strong style="color:#0f172a;">Service times</strong><br/>
      ${site.services.map((sv) => `${esc(sv.day)} ${esc(sv.time)} — ${esc(sv.name)}`).join("<br/>")}<br/><br/>
      <strong style="color:#0f172a;">Where</strong><br/>
      ${esc(site.address.street)}, ${esc(site.address.city)}, ${esc(site.address.state)} ${esc(site.address.zip)}
    </td></tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:22px auto 0;"><tr><td style="border-radius:10px;background:#0093ce;" align="center">
      <a href="${SITE_URL}/events" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">All events on the website →</a>
    </td></tr></table>
    <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;" align="center">Sent automatically every Monday. Edit events and announcements at ${SITE_URL}/admin to change next week's email.</p>
  </td></tr>
</table></td></tr></table></body></html>`,
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
