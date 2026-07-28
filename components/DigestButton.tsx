"use client";

import { useState } from "react";

// One-click "send this week's digest email now" for the /admin page.
// The weekly Monday send happens automatically (vercel.json cron); this
// is for previewing or re-sending after editing events.
export default function DigestButton() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json()) as { detail?: string; error?: string };
      setMessage(
        res.ok
          ? { ok: true, text: json.detail ?? "Sent!" }
          : { ok: false, text: json.error ?? json.detail ?? "Something went wrong." }
      );
    } catch {
      setMessage({ ok: false, text: "Network error — try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="font-semibold text-slate-900">This Week at Faith — email digest</h2>
      <p className="mt-1 text-sm text-slate-600">
        Every Monday morning the website emails the staff a ready-to-forward
        summary of this week&rsquo;s events, announcements, and the latest
        message. Want it right now (for example, after adding an event)?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={send}
          disabled={busy || !password}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? "Sending…" : "Email me this week's digest"}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
