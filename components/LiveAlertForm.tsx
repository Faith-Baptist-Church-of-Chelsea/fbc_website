"use client";

import { useState } from "react";

// Opt-in for "email me the moment we go live". Lives on the Watch Live page
// (dark background).
export default function LiveAlertForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/live-alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const json = (await res.json()) as { detail?: string; error?: string };
      setMessage(res.ok ? { ok: true, text: json.detail ?? "You're set!" } : { ok: false, text: json.error ?? "Something went wrong — try again." });
      if (res.ok) setEmail("");
    } catch {
      setMessage({ ok: false, text: "Network error — try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-brand-400">Never miss it</p>
      <p className="mt-1 font-bold text-white">Get an email the moment we go live</p>
      <p className="mt-1 text-sm text-slate-400">Only when a service starts — a few times a week, with a one-click link to stop.</p>
      <form onSubmit={submit} className="mt-4">
        <div className="flex gap-2">
          <label htmlFor="live-alert-email" className="sr-only">Email address</label>
          <input
            id="live-alert-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
          <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {busy ? "…" : "Notify me"}
          </button>
        </div>
        {message && <p className={`mt-2 text-sm ${message.ok ? "text-green-400" : "text-red-400"}`}>{message.text}</p>}
      </form>
    </div>
  );
}
