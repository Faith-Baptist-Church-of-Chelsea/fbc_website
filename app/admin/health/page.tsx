import type { Metadata } from "next";
import { runPcoHealthChecks, type HealthCheck } from "@/lib/pco";
import { youtubeKeyConfigured, getRecentVideos } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "Integration Health",
  robots: { index: false, follow: false },
};

// Live status of every integration, so problems can be diagnosed at a
// glance instead of by reading logs. Always rendered fresh (no cache).
// This page shows only pass/fail — never credentials — so it's safe for
// it to be reachable; it's simply not linked anywhere public.
export const dynamic = "force-dynamic";

function statusRow(c: HealthCheck) {
  return (
    <li key={c.name} className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
      <span aria-hidden="true" className={`mt-1 inline-block h-3 w-3 shrink-0 rounded-full ${c.ok ? "bg-green-500" : "bg-red-500"}`} />
      <div>
        <p className="font-semibold text-slate-900">
          {c.name} — {c.ok ? "OK" : "FAILING"}
        </p>
        <p className="text-sm text-slate-600">{c.detail}</p>
      </div>
    </li>
  );
}

export default async function HealthPage() {
  const pco = await runPcoHealthChecks();

  let youtube: HealthCheck;
  if (!youtubeKeyConfigured()) {
    youtube = {
      name: "YouTube",
      ok: true,
      detail:
        "Keyless mode: playlist embeds work, live banner runs on schedule alone (unverified wording). Add YOUTUBE_API_KEY to upgrade.",
    };
  } else {
    const videos = await getRecentVideos(1);
    youtube = videos.length
      ? { name: "YouTube", ok: true, detail: "API key active — video list and live verification working." }
      : { name: "YouTube", ok: false, detail: "API key is set but the video list request failed — check quota or key restrictions." };
  }

  const ai: HealthCheck = process.env.ANTHROPIC_API_KEY
    ? { name: "AI (question bubble + admin editor)", ok: true, detail: "Anthropic API key present." }
    : { name: "AI (question bubble + admin editor)", ok: false, detail: "ANTHROPIC_API_KEY not set — the chat bubble is hidden and the /admin editor is disabled." };

  const adminEditor: HealthCheck =
    process.env.ADMIN_PASSWORD && process.env.GITHUB_TOKEN
      ? { name: "Admin editor (/admin)", ok: true, detail: "Password and GitHub token configured." }
      : {
          name: "Admin editor (/admin)",
          ok: false,
          detail: `Missing: ${[
            !process.env.ADMIN_PASSWORD && "ADMIN_PASSWORD (pick any strong password)",
            !process.env.GITHUB_TOKEN && "GITHUB_TOKEN (fine-grained PAT with Contents read/write on the repo)",
          ]
            .filter(Boolean)
            .join(", ")}.`,
        };

  const staticChecks: HealthCheck[] = [
    youtube,
    ai,
    adminEditor,
    process.env.RESEND_API_KEY
      ? {
          name: "Contact forms / email (Resend)",
          ok: true,
          detail: "API key present. Recipients are edited in /keystatic → Church Info → Form recipients.",
        }
      : {
          name: "Contact forms / email (Resend)",
          ok: false,
          detail:
            "RESEND_API_KEY is not set — form submissions still go into Planning Center People, but staff get NO email. Create a free resend.com account and add the key.",
        },
  ];

  return (
    <main className="mx-auto max-w-2xl flex-1 px-4 py-14">
      <h1 className="text-3xl font-bold text-slate-900">Integration health</h1>
      <p className="mt-2 text-slate-600">
        Rendered live on every page load — reload to re-test. Green means the
        site can reach and authenticate with the service right now.
      </p>
      <h2 className="mt-8 text-lg font-bold text-slate-900">Planning Center</h2>
      <ul className="mt-3 space-y-3">{pco.map(statusRow)}</ul>
      <h2 className="mt-8 text-lg font-bold text-slate-900">Everything else</h2>
      <ul className="mt-3 space-y-3">{staticChecks.map(statusRow)}</ul>
      <p className="mt-8 text-sm text-slate-500">
        Checked at {new Date().toLocaleString("en-US", { timeZone: "America/Detroit" })} (Michigan time).
      </p>
    </main>
  );
}
