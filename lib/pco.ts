// Planning Center API client.
//
// HOW IT WORKS, in one paragraph: every function here runs on the server
// only (the "server-only" import makes the build fail if a browser
// component ever tries to use it — that protects the secret). Requests
// authenticate with the Personal Access Token from .env.local / Vercel
// env vars using HTTP Basic auth. Responses are cached by Next.js for 15
// minutes (ISR), so a Sunday-morning traffic spike costs us at most a few
// API calls, not hundreds. Every function FAILS SOFT: if Planning Center
// is down or the token is wrong, pages get an empty list / null — never a
// crash — and the problem is logged and visible at /admin/health.
//
// API shapes verified against the live self-documentation on 2026-07-27:
//   https://api.planningcenteronline.com/registrations/v2/documentation
//   (Registrations version 2025-05-01; signup, signup_time vertices)
import "server-only";

const PCO_BASE = "https://api.planningcenteronline.com";

/** How long Next.js may serve a cached Planning Center response (seconds). */
export const PCO_CACHE_SECONDS = 15 * 60;

function credentials(): string | null {
  const id = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;
  if (!id || !secret) return null;
  return Buffer.from(`${id}:${secret}`).toString("base64");
}

/**
 * Low-level GET against the Planning Center API.
 * Returns parsed JSON, or null on any failure (missing credentials,
 * network error, non-200 status). Failures log one quiet line.
 */
export async function pcoFetch(
  path: string,
  { revalidate = PCO_CACHE_SECONDS }: { revalidate?: number | 0 } = {}
): Promise<unknown | null> {
  const auth = credentials();
  if (!auth) {
    console.warn(`[pco] skipped ${path} — PCO_APP_ID/PCO_SECRET not set`);
    return null;
  }
  try {
    const res = await fetch(`${PCO_BASE}${path}`, {
      headers: { Authorization: `Basic ${auth}` },
      next: { revalidate },
    });
    if (!res.ok) {
      console.warn(`[pco] ${path} returned HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[pco] ${path} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ---------- Registrations: upcoming signups for the Events page ----------

export type UpcomingSignup = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  registrationUrl: string | null;
  startsAt: string | null; // ISO date of the next occurrence, if scheduled
  atCapacity: boolean;
};

// Minimal shapes for the JSON:API response fields we actually read.
type JsonApiResource = {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data: { type: string; id: string } | null }>;
};
type JsonApiList = { data: JsonApiResource[]; included?: JsonApiResource[] };

/**
 * Open, non-archived signups from Registrations, soonest first.
 * Signups without a scheduled time sort last (they're still shown —
 * an open registration with no date is usually "ongoing").
 */
export async function getUpcomingSignups(): Promise<UpcomingSignup[]> {
  const json = (await pcoFetch(
    "/registrations/v2/signups?include=next_signup_time&per_page=100"
  )) as JsonApiList | null;
  if (!json?.data) return [];

  const times = new Map(
    (json.included ?? [])
      .filter((r) => r.type === "SignupTime")
      .map((r) => [r.id, r.attributes.starts_at as string | null])
  );

  const now = Date.now();
  return json.data
    .filter((s) => !s.attributes.archived && !s.attributes.closed)
    .map((s): UpcomingSignup => {
      const timeRef = s.relationships?.next_signup_time?.data;
      const startsAt = timeRef ? (times.get(timeRef.id) ?? null) : null;
      return {
        id: s.id,
        name: (s.attributes.name as string) ?? "Untitled event",
        description: (s.attributes.description as string) || null,
        logoUrl: (s.attributes.logo_url as string) || null,
        registrationUrl: (s.attributes.new_registration_url as string) || null,
        startsAt,
        atCapacity: Boolean(s.attributes.at_maximum_capacity),
      };
    })
    .filter((s) => !s.startsAt || Date.parse(s.startsAt) > now - 24 * 3600 * 1000)
    .sort((a, b) => {
      if (a.startsAt && b.startsAt) return a.startsAt.localeCompare(b.startsAt);
      return a.startsAt ? -1 : b.startsAt ? 1 : 0;
    });
}

// ---------- Health checks for /admin/health ----------

export type HealthCheck = { name: string; ok: boolean; detail: string };

/** One live (uncached) probe per licensed product. */
export async function runPcoHealthChecks(): Promise<HealthCheck[]> {
  if (!credentials()) {
    return [
      {
        name: "Planning Center credentials",
        ok: false,
        detail:
          "PCO_APP_ID / PCO_SECRET are not set. Add them in Vercel → Settings → Environment Variables (and .env.local for local dev).",
      },
    ];
  }
  const probes = [
    { name: "People API", path: "/people/v2/people?per_page=1" },
    { name: "Registrations API", path: "/registrations/v2/signups?per_page=1" },
    { name: "Publishing API", path: "/publishing/v2/episodes?per_page=1" },
    { name: "Check-Ins API", path: "/check-ins/v2/events?per_page=1" },
  ];
  return Promise.all(
    probes.map(async ({ name, path }) => {
      const json = await pcoFetch(path, { revalidate: 0 });
      return json
        ? { name, ok: true, detail: "Reachable and authenticated." }
        : { name, ok: false, detail: "Request failed — check server logs (token revoked? product not licensed?)." };
    })
  );
}
