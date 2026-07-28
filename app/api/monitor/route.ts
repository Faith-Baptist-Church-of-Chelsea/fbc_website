// The site's night watchman. Vercel runs this once a day (see
// vercel.json); it probes every integration and emails the staff list
// ONLY when something is broken. Silence means all is well.
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import site from "@/content/site.json";
import { runPcoHealthChecks, type HealthCheck } from "@/lib/pco";
import { getRecentVideos } from "@/lib/youtube";
import { getUpcomingCalendarEvents } from "@/lib/calendar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // When CRON_SECRET is set in Vercel, only Vercel's cron may trigger this.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
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

  // Google Calendar feed
  const cal = await getUpcomingCalendarEvents(1);
  checks.push({
    name: "Google Calendar",
    ok: cal.length > 0,
    detail: cal.length > 0 ? "OK" : "Calendar feed empty or unreachable",
  });

  // GitHub token (powers the /admin editor)
  if (process.env.GITHUB_TOKEN) {
    try {
      const gh = await fetch("https://api.github.com/repos/stevenabi6912-prog/fbc_website", {
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
        from: "Faith Baptist Website <onboarding@resend.dev>", // TODO: switch after domain verification
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

  return NextResponse.json({
    ok: failures.length === 0,
    failures: failures.map((f) => f.name),
    checked: checks.length,
  });
}
