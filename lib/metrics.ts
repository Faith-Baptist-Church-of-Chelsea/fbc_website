// A tiny append-only event log in the private Blob store, so the monthly
// "how the site did" email has real numbers. Each event is one small JSON
// file at metrics/<YYYY-MM>/<kind>/<timestamp>-<random>.json — a month's
// counts come from a prefix listing alone (no reads), and only kinds that
// carry useful text (unanswered questions) get read back.
//
// recordEvent never throws and never blocks the thing it's measuring: a
// broken metrics store must not break a contact form or the chat bubble.
import "server-only";
import crypto from "node:crypto";
import { del, get, list, put } from "@vercel/blob";

export type EventKind =
  | "form.question"
  | "form.visit"
  | "form.prayer"
  | "form.music"
  | "question.answered"
  | "question.unanswered"
  | "subscribe.weekly"
  | "subscribe.live"
  | "livealert.sent"
  | "digest.review"
  | "digest.broadcast";

const PREFIX = "metrics/";

/** YYYY-MM in Michigan time. */
export function monthKey(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Detroit" }).slice(0, 7);
}

export function recordEvent(kind: EventKind, data: Record<string, unknown> = {}): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const path = `${PREFIX}${monthKey()}/${kind}/${Date.now()}-${crypto.randomBytes(3).toString("hex")}.json`;
  void put(path, JSON.stringify({ kind, at: new Date().toISOString(), ...data }), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  }).catch((err: unknown) => console.warn("[metrics] record failed:", err instanceof Error ? err.message : err));
}

export type MonthSummary = {
  month: string;
  counts: Partial<Record<EventKind, number>>;
  unansweredQuestions: string[];
  liveAlertRecipients: number;
};

export async function summarizeMonth(month: string): Promise<MonthSummary> {
  const counts: Partial<Record<EventKind, number>> = {};
  const unansweredQuestions: string[] = [];
  let liveAlertRecipients = 0;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: `${PREFIX}${month}/`, cursor, limit: 1000 });
    for (const b of page.blobs) {
      const kind = b.pathname.split("/")[2] as EventKind | undefined;
      if (!kind) continue;
      counts[kind] = (counts[kind] ?? 0) + 1;
      if (kind === "question.unanswered" || kind === "livealert.sent") {
        try {
          const res = await get(b.url, { access: "private" });
          if (!res) continue;
          const data = JSON.parse(await new Response(res.stream).text()) as { question?: string; sent?: number };
          if (kind === "question.unanswered" && data.question) unansweredQuestions.push(data.question);
          if (kind === "livealert.sent") liveAlertRecipients += data.sent ?? 0;
        } catch {
          /* skip unreadable */
        }
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return { month, counts, unansweredQuestions, liveAlertRecipients };
}

/** Drop event files older than `keepMonths` months. */
export async function pruneOldMonths(keepMonths = 12): Promise<number> {
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - keepMonths);
  const cutoffKey = cutoff.toISOString().slice(0, 7);
  let removed = 0;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    const old = page.blobs.filter((b) => b.pathname.slice(PREFIX.length, PREFIX.length + 7) < cutoffKey);
    if (old.length) {
      await del(old.map((b) => b.url));
      removed += old.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return removed;
}
