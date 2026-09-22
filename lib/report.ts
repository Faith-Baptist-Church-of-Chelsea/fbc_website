// The monthly "how the website did" email — sent by /api/monitor on the 1st
// of each month for the month just ended. Everything in it is a real count
// from the metrics log or the YouTube API; nothing is estimated.
import "server-only";
import { Resend } from "resend";
import site from "@/content/site.json";
import { monthKey, pruneOldMonths, summarizeMonth } from "@/lib/metrics";
import { getRecentVideos, getVideoStats } from "@/lib/youtube";

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

export async function composeMonthlyReport(month = previousMonthKey()): Promise<{ subject: string; text: string }> {
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

  const lines = [
    `How the website did in ${monthName(month)}`,
    ``,
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
    `Page-view numbers live in the Vercel dashboard (Analytics tab) — they aren't available to the site itself.`,
    `Details any time: ${SITE_URL}/admin/health`,
  ];
  return { subject: `[Website] ${monthName(month)} in review`, text: lines.join("\n") };
}

export async function sendMonthlyReport(month?: string): Promise<{ sent: boolean; detail: string }> {
  if (!process.env.RESEND_API_KEY) return { sent: false, detail: "RESEND_API_KEY not set" };
  if (site.digestReviewRecipients.length === 0) return { sent: false, detail: "no reviewer recipients" };
  const { subject, text } = await composeMonthlyReport(month);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Faith Baptist Website <alerts@fbcchelsea.org>",
    to: [...site.digestReviewRecipients],
    subject,
    text,
  });
  if (error) return { sent: false, detail: error.message };
  const pruned = await pruneOldMonths(12).catch(() => 0);
  return { sent: true, detail: `report sent to ${site.digestReviewRecipients.join(", ")}${pruned ? `; pruned ${pruned} old events` : ""}` };
}
