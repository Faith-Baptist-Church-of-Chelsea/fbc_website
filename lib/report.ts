// The monthly "how the website did" email — sent by /api/monitor on the 1st
// of each month for the month just ended. Everything in it is a real count
// from the metrics log or the YouTube API; nothing is estimated.
import "server-only";
import { Resend } from "resend";
import site from "@/content/site.json";
import { monthKey, pruneOldMonths, summarizeMonth } from "@/lib/metrics";
import { getRecentVideos, getVideoStats } from "@/lib/youtube";
import { getMonthPageViews } from "@/lib/vercel-analytics";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";

function previousMonthKey(now = new Date()): string {
  const [y, m] = monthKey(now).split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 - 1, 1));
  return d.toISOString().slice(0, 7);
}

function monthName(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const n0 = (v: number) => v.toLocaleString("en-US");
const FONT = "font-family:Arial,Helvetica,sans-serif;";

/** One big number with a caption — four of these open the email. */
function tile(value: string, caption: string): string {
  return `<td width="25%" style="padding:6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;"><tr><td align="center" style="padding:16px 8px;${FONT}">
    <div style="font-size:26px;font-weight:bold;color:#0f172a;line-height:1.1;">${esc(value)}</div>
    <div style="margin-top:6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;">${esc(caption)}</div>
  </td></tr></table></td>`;
}

function sectionTitle(text: string): string {
  return `<p style="margin:30px 0 8px;${FONT}font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#006389;font-weight:bold;">${esc(text)}</p>`;
}

/** Label + value rows in a soft card. */
function rows(items: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;"><tr><td style="padding:6px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items
      .map(
        ([k, v], i) =>
          `<tr><td style="padding:9px 0;${FONT}font-size:14px;color:#334155;${i ? "border-top:1px solid #e2e8f0;" : ""}">${esc(k)}</td><td align="right" style="padding:9px 0;${FONT}font-size:14px;font-weight:bold;color:#0f172a;white-space:nowrap;${i ? "border-top:1px solid #e2e8f0;" : ""}">${esc(v)}</td></tr>`
      )
      .join("")}</table>
  </td></tr></table>`;
}

/** Ranked list with a proportional bar — pages or sermons. */
function bars(items: { label: string; value: number; note?: string; href?: string }[], unit: string): string {
  const max = Math.max(1, ...items.map((i) => i.value));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;"><tr><td style="padding:10px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items
      .map((i) => {
        const pct = Math.max(3, Math.round((i.value / max) * 100));
        const label = i.href
          ? `<a href="${i.href}" style="color:#0f172a;text-decoration:none;">${esc(i.label)}</a>`
          : esc(i.label);
        return `<tr><td style="padding:7px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="${FONT}font-size:14px;color:#0f172a;">${label}${i.note ? `<span style="color:#94a3b8;"> · ${esc(i.note)}</span>` : ""}</td>
            <td align="right" style="${FONT}font-size:14px;font-weight:bold;color:#0f172a;white-space:nowrap;padding-left:12px;">${n0(i.value)} ${esc(unit)}</td>
          </tr></table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;"><tr>
            <td width="${pct}%" style="height:6px;background:#0093ce;border-radius:3px;font-size:0;line-height:0;">&nbsp;</td>
            <td style="height:6px;font-size:0;line-height:0;">&nbsp;</td>
          </tr></table>
        </td></tr>`;
      })
      .join("")}</table>
  </td></tr></table>`;
}

export async function composeMonthlyReport(
  month = previousMonthKey()
): Promise<{ subject: string; text: string; html: string }> {
  const s = await summarizeMonth(month);
  const c = s.counts;
  const n = (k: keyof typeof c) => c[k] ?? 0;
  const forms = n("form.question") + n("form.visit") + n("form.prayer") + n("form.music");
  const questions = n("question.answered") + n("question.unanswered");

  // Sermons published that month, with YouTube view counts.
  const videos = (await getRecentVideos(48)).filter((v) => v.publishedAt.startsWith(month));
  const stats = await getVideoStats(videos.map((v) => v.videoId));
  const sermonLines = videos
    .map((v) => `  • ${v.title} — ${stats.get(v.videoId)?.toLocaleString() ?? "?"} views`)
    .join("\n");

  // Visitors and page views from Vercel Web Analytics (Pro plan API).
  const views = await getMonthPageViews(month);
  const viewLines = views
    ? [
        `VISITORS`,
        `  ${views.visitors.toLocaleString()} visitors, ${views.pageviews.toLocaleString()} page views`,
        ...(views.devices.length ? [`  Devices: ${views.devices.map((d) => `${d.device || "other"} ${d.visitors}`).join(", ")}`] : []),
        ...(views.countries.length ? [`  Countries: ${views.countries.map((cc) => `${cc.country} ${cc.visitors}`).join(", ")}`] : []),
        `  Most-visited pages:`,
        ...views.topPages.slice(0, 10).map((p) => `    ${p.path} — ${p.visitors} visitors, ${p.pageviews} views`),
        ``,
      ]
    : [];

  const title = `How the website did in ${monthName(month)}`;
  const lines = [
    title,
    ``,
    ...viewLines,
    `PEOPLE REACHING OUT`,
    `  Forms submitted: ${forms}` +
      (forms ? ` (visit ${n("form.visit")}, question ${n("form.question")}, prayer ${n("form.prayer")}, music ${n("form.music")})` : ""),
    `  Chat-bubble questions: ${questions}` + (questions ? ` — ${n("question.unanswered")} the assistant couldn't answer` : ""),
    ...(s.unansweredQuestions.length
      ? [`  Questions it couldn't answer (worth adding to the site or chat facts):`, ...s.unansweredQuestions.slice(0, 20).map((q) => `    – ${q}`)]
      : []),
    ``,
    `EMAIL`,
    `  New weekly-email subscribers: ${n("subscribe.weekly")}`,
    `  New live-alert subscribers: ${n("subscribe.live")}`,
    `  Live-stream alerts sent: ${n("livealert.sent")} (${s.liveAlertRecipients} emails)`,
    `  Weekly digests: ${n("digest.review")} review copies, ${n("digest.broadcast")} sent to the congregation`,
    ``,
    `SERMONS PUBLISHED (${videos.length})`,
    sermonLines || `  (none found for this month)`,
    ``,
    ...(views ? [] : [`Page-view numbers: see the Vercel dashboard (Analytics tab) — VERCEL_ANALYTICS_TOKEN isn't set, so they're not in this email.`]),
    `Details any time: ${SITE_URL}/admin/health`,
  ];

  // ---- HTML version: same facts, laid out to be read at a glance ----
  const pageName = (path: string) => (path === "/" ? "Homepage" : path.replace(/^\//, "").replace(/-/g, " ").replace(/\//g, " › "));
  const sermonRows = videos
    .map((v) => ({ label: v.title, value: stats.get(v.videoId) ?? 0, href: `https://www.youtube.com/watch?v=${v.videoId}` }))
    .sort((a, b) => b.value - a.value);
  const totalSermonViews = sermonRows.reduce((a, b) => a + b.value, 0);

  let body = "";
  body += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;"><tr>
    ${views ? tile(n0(views.visitors), "visitors") : tile("—", "visitors")}
    ${views ? tile(n0(views.pageviews), "page views") : tile("—", "page views")}
    ${tile(n0(forms), "forms sent")}
    ${tile(n0(totalSermonViews), "sermon views")}
  </tr></table>`;

  if (views) {
    body += sectionTitle("Most-visited pages");
    body += bars(
      views.topPages.slice(0, 10).map((p) => ({ label: pageName(p.path), value: p.visitors, note: `${n0(p.pageviews)} views`, href: `${SITE_URL}${p.path}` })),
      "visitors"
    );
    const extra: [string, string][] = [];
    if (views.devices.length) extra.push(["Devices", views.devices.map((d) => `${d.device || "other"} ${n0(d.visitors)}`).join(" · ")]);
    if (views.countries.length) extra.push(["Countries", views.countries.map((cc) => `${cc.country} ${n0(cc.visitors)}`).join(" · ")]);
    if (extra.length) body += `<div style="height:10px;"></div>` + rows(extra);
  }

  body += sectionTitle("People reaching out");
  body += rows([
    ["Forms submitted", forms ? `${forms} (visit ${n("form.visit")}, question ${n("form.question")}, prayer ${n("form.prayer")}, music ${n("form.music")})` : "0"],
    ["Chat-bubble questions", questions ? `${questions}${n("question.unanswered") ? ` · ${n("question.unanswered")} unanswered` : ""}` : "0"],
  ]);
  if (s.unansweredQuestions.length) {
    body += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-top:10px;"><tr><td style="padding:14px 16px;${FONT}font-size:14px;line-height:1.7;color:#78350f;">
      <strong>Questions the assistant couldn't answer</strong> — worth adding to the site or the chat facts:<br/>
      ${s.unansweredQuestions.slice(0, 20).map((q) => `– ${esc(q)}`).join("<br/>")}
    </td></tr></table>`;
  }

  body += sectionTitle("Email");
  body += rows([
    ["New weekly-email subscribers", n0(n("subscribe.weekly"))],
    ["New live-alert subscribers", n0(n("subscribe.live"))],
    ["Live-stream alerts sent", `${n0(n("livealert.sent"))} (${n0(s.liveAlertRecipients)} emails)`],
    ["Weekly digests", `${n0(n("digest.review"))} review copies · ${n0(n("digest.broadcast"))} sent to the congregation`],
  ]);

  body += sectionTitle(`Sermons published (${videos.length})`);
  body += sermonRows.length
    ? bars(sermonRows, "views")
    : `<p style="margin:0;${FONT}font-size:14px;color:#64748b;">None found for this month.</p>`;
  if (sermonRows.length) {
    body += `<p style="margin:8px 0 0;${FONT}font-size:12px;color:#94a3b8;">Most-watched first. View counts are YouTube's, as of the day this was sent.</p>`;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#e2e8f0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e2e8f0;padding:24px 8px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr><td style="background:#0f172a;padding:28px 24px;" align="center">
    <img src="${SITE_URL}/images/logo-horizontal-light.png" width="280" alt="Faith Baptist Church of Chelsea" style="display:block;max-width:280px;height:auto;" />
  </td></tr>
  <tr><td style="padding:32px 28px 8px;${FONT}">
    <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#006389;font-weight:bold;">Website report</p>
    <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;color:#0f172a;">${esc(monthName(month))}</h1>
    <p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:#475569;">How fbcchelsea.org did last month. Every number is a real count — nothing here is estimated.</p>
    ${body}
  </td></tr>
  <tr><td style="padding:24px 28px 28px;${FONT}">
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:6px auto 0;"><tr><td style="border-radius:10px;background:#0093ce;" align="center">
      <a href="${SITE_URL}/admin/health" style="display:inline-block;padding:13px 30px;${FONT}font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Site health, any time →</a>
    </td></tr></table>
    <p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#94a3b8;" align="center">Sent automatically on the 1st of each month by the Faith Baptist Church website.</p>
  </td></tr>
</table></td></tr></table></body></html>`;

  return { subject: `[Website] ${monthName(month)} in review`, text: lines.join("\n"), html };
}

export async function sendMonthlyReport(month?: string): Promise<{ sent: boolean; detail: string }> {
  if (!process.env.RESEND_API_KEY) return { sent: false, detail: "RESEND_API_KEY not set" };
  if (site.digestReviewRecipients.length === 0) return { sent: false, detail: "no reviewer recipients" };
  const { subject, text, html } = await composeMonthlyReport(month);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Faith Baptist Website <alerts@fbcchelsea.org>",
    to: [...site.digestReviewRecipients],
    subject,
    text,
    html,
  });
  if (error) return { sent: false, detail: error.message };
  const pruned = await pruneOldMonths(12).catch(() => 0);
  return { sent: true, detail: `report sent to ${site.digestReviewRecipients.join(", ")}${pruned ? `; pruned ${pruned} old events` : ""}` };
}
