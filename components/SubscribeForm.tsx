"use client";

import { useState } from "react";

// Email signup for the "This Week at Faith" weekly digest. Used in the
// footer (dark) and on the Events page (light) — the `dark` prop flips
// the palette.
export default function SubscribeForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const json = (await res.json()) as { detail?: string; error?: string };
      setMessage(
        res.ok
          ? { ok: true, text: json.detail ?? "You're on the list!" }
          : { ok: false, text: json.error ?? "Something went wrong — try again." }
      );
      if (res.ok) setEmail("");
    } catch {
      setMessage({ ok: false, text: "Network error — try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      <div className="flex gap-2">
        <label htmlFor={dark ? "subscribe-dark" : "subscribe-light"} className="sr-only">
          Email address
        </label>
        <input
          id={dark ? "subscribe-dark" : "subscribe-light"}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`w-full rounded-lg border px-3 py-2 text-sm ${
            dark
              ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-500"
              : "border-slate-300 bg-white text-slate-900"
          }`}
        />
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? "…" : "Sign up"}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-sm ${message.ok ? "text-green-500" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
