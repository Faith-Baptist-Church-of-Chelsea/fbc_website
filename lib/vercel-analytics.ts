// Page views from Vercel Web Analytics, for the monthly report.
//
// Vercel exposes its Web Analytics numbers through a REST API on the Pro
// plan (the same numbers as the dashboard's Analytics tab). It needs a
// Vercel access token — VERCEL_ANALYTICS_TOKEN — created at
// vercel.com/account/settings/tokens and scoped to the church's team.
// Without the token every function here returns null and the report
// simply leaves the section out; nothing else on the site depends on it.
import "server-only";

const API = "https://api.vercel.com/v1/query/web-analytics";
const PROJECT = process.env.VERCEL_ANALYTICS_PROJECT ?? "fbc-website";
const TEAM = process.env.VERCEL_ANALYTICS_TEAM ?? "team_KVk7H2XI68L4AYwRboquicit";

export type PageViewSummary = {
  visitors: number;
  pageviews: number;
  topPages: { path: string; visitors: number; pageviews: number }[];
  countries: { country: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
};

async function query<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!token) return null;
  const qs = new URLSearchParams({ projectId: PROJECT, teamId: TEAM, ...params });
  try {
    const res = await fetch(`${API}/${path}?${qs}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[vercel-analytics] ${path} HTTP ${res.status}`);
      return null;
    }
    return ((await res.json()) as { data: T }).data;
  } catch (err) {
    console.warn("[vercel-analytics] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Visitors / page views for a calendar month ("YYYY-MM"), with top pages. */
export async function getMonthPageViews(month: string): Promise<PageViewSummary | null> {
  const [y, m] = month.split("-").map(Number);
  const since = new Date(Date.UTC(y, m - 1, 1)).toISOString();
  const until = new Date(Date.UTC(y, m, 1)).toISOString(); // exclusive upper bound

  const totals = await query<{ visitors: number; pageviews: number }>("visits/count", { since, until });
  if (!totals) return null;

  type Row = { visitors: number; pageviews: number } & Record<string, string | number>;
  const [pages, countries, devices] = await Promise.all([
    query<Row[]>("visits/aggregate", { since, until, by: "requestPath", limit: "10" }),
    query<Row[]>("visits/aggregate", { since, until, by: "country", limit: "5" }),
    query<Row[]>("visits/aggregate", { since, until, by: "deviceType", limit: "3" }),
  ]);
  const notOthers = (r: Row, key: string) => r[key] !== "Others";
  return {
    visitors: totals.visitors,
    pageviews: totals.pageviews,
    topPages: (pages ?? [])
      .filter((r) => notOthers(r, "requestPath"))
      .map((r) => ({ path: String(r.requestPath), visitors: r.visitors, pageviews: r.pageviews })),
    countries: (countries ?? [])
      .filter((r) => notOthers(r, "country"))
      .map((r) => ({ country: String(r.country), visitors: r.visitors })),
    devices: (devices ?? [])
      .filter((r) => notOthers(r, "deviceType"))
      .map((r) => ({ device: String(r.deviceType), visitors: r.visitors })),
  };
}
