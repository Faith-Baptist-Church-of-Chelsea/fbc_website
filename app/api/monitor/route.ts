// The site's night watchman. Vercel runs this once a day (see
// vercel.json); it probes every integration and emails the staff list
// when something is broken. On Mondays it also sends a short "all clear"
// to the digest reviewer — proof the watchman itself is still on duty,
// since silence alone can't distinguish "fine" from "the check stopped".
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import site from "@/content/site.json";
import { runPcoHealthChecks, type HealthCheck } from "@/lib/pco";
import { getRecentVideos } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Only Vercel's cron may trigger this (CRON_SECRET when set, otherwise
  // the cron user-agent). Random crawlers must not be able to run the
  // checks — during an outage each hit would email the staff.
  const secret = process.env.CRON_SECRET;
  const isCron = secret
    ? req.headers.get("authorization") === `Bearer ${secret}`
    : (req.headers.get("user-agent") ?? "").startsWith("vercel-cron");
  if (!isCron) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const checks: HealthCheck[] = [...(await runPcoHealthChecks())];

  // YouTube: can we list videos?
  if (process.env.YOUTUBE_API_KEY) {
    const videos = await getRecentVideos(1);
    checks.push({
      name: "YouTube",
      ok: videos.length > 0,
      detail: videos.length > 0 ? "OK" : "Video list request failed (quota? key?)",
    });
  }

  // (Google Calendar check removed 2026-07 along with the calendar list
  // on /events — a broken feed no longer affects anything visitors see.)

  // GitHub token (powers the /admin editor)
  if (process.env.GITHUB_TOKEN) {
    try {
      const gh = await fetch("https://api.github.com/repos/Faith-Baptist-Church-of-Chelsea/fbc_website", {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
        cache: "no-store",
      });
      checks.push({
        name: "GitHub token (/admin editor)",
        ok: gh.ok,
        detail: gh.ok ? "OK" : `HTTP ${gh.status} — token expired or revoked?`,
      });
    } catch {
      checks.push({ name: "GitHub token (/admin editor)", ok: false, detail: "Request failed" });
    }
  }

  // Outside links visitors depend on. The giving embed once silently
  // started returning 403 (a domain allow-list on ChurchTrac's side) and
  // nobody knew until a visitor noticed — exactly the failure that never
  // shows up in build logs or key checks.
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";
  const UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
  const linkChecks: { name: string; url: string; referer?: string }[] = [
    { name: "Giving page (ChurchTrac)", url: site.links.giving },
    { name: "Giving embed (ChurchTrac)", url: site.links.givingEmbed, referer: `${SITE_URL}/give` },
    { name: "Church Center", url: site.links.churchCenter },
    { name: "Missionaries list (Church Center)", url: site.links.missionaries },
    ...(site.social.sermonAudio ? [{ name: "SermonAudio page", url: site.social.sermonAudio }] : []),
    ...["/", "/events", "/sermons", "/live", "/give", "/plan-your-visit"].map((p) => ({
      name: `Site page ${p}`,
      url: `${SITE_URL}${p}`,
    })),
  ];
  await Promise.all(
    linkChecks.map(async ({ name, url, referer }) => {
      try {
        const res = await fetch(url, {
          // ChurchTrac's load balancer answers 403 to anything without
          // browser-style Accept headers — a UA alone isn't enough.
          headers: {
            "user-agent": UA,
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "accept-language": "en-US,en;q=0.9",
            ...(referer ? { referer } : {}),
          },
          redirect: "follow",
          cache: "no-store",
          signal: AbortSignal.timeout(15_000),
        });
        checks.push({ name, ok: res.ok, detail: res.ok ? "OK" : `HTTP ${res.status}` });
      } catch (err) {
        checks.push({ name, ok: false, detail: err instanceof Error ? err.message : "Request failed" });
      }
    })
  );

  // Key presence
  for (const [name, envVar] of [
    ["AI (chat bubble + admin editor)", "ANTHROPIC_API_KEY"],
    ["Email sending (Resend)", "RESEND_API_KEY"],
  ] as const) {
    checks.push({
      name,
      ok: Boolean(process.env[envVar]),
      detail: process.env[envVar] ? "OK" : `${envVar} is not set`,
    });
  }

  const failures = checks.filter((c) => !c.ok);

  if (failures.length > 0 && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Faith Baptist Website <alerts@fbcchelsea.org>",
        to: [...site.formRecipients],
        subject: `[Website] ⚠ ${failures.length} integration${failures.length > 1 ? "s" : ""} failing`,
        text:
          `The website's daily self-check found problems:\n\n` +
          failures.map((f) => `✗ ${f.name}: ${f.detail}`).join("\n") +
          `\n\nEverything else is fine. Details: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app"}/admin/health\n` +
          `(You only get this email when something is wrong.)`,
      });
    } catch (err) {
      console.warn("[monitor] alert email failed:", err instanceof Error ? err.message : err);
    }
  }

  // Monday "all clear" — only when nothing failed (failures already got
  // their own email above), and only to the digest reviewer, not all staff.
  const isMonday =
    new Date().toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Detroit" }) === "Mon";
  if (isMonday && failures.length === 0 && process.env.RESEND_API_KEY && site.digestReviewRecipients.length > 0) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Faith Baptist Website <alerts@fbcchelsea.org>",
        to: [...site.digestReviewRecipients],
        subject: `[Website] ✓ Weekly check: all ${checks.length} integrations OK`,
        text:
          `Everything the website depends on responded normally this morning:\n\n` +
          checks.map((c) => `✓ ${c.name}`).join("\n") +
          `\n\nThis runs every day and only emails the whole staff when something breaks; ` +
          `this Monday note is just confirmation the check itself is still running.\n` +
          `Details any time: ${SITE_URL}/admin/health`,
      });
    } catch (err) {
      console.warn("[monitor] weekly summary email failed:", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({
    ok: failures.length === 0,
    failures: failures.map((f) => f.name),
    checked: checks.length,
  });
}
