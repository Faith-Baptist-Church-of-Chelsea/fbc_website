"use client";

import { useState } from "react";

// The "This Week at Faith" panel on /admin.
// Two actions, both password-gated at the API:
//  - review copy: email the staff list the current digest with the
//    approval banner (also happens automatically every Monday 8 AM)
//  - approve & send: recompose fresh and broadcast to the whole mailing
//    list — guarded by a second "really?" click so nobody fat-fingers an
//    email to a few hundred people.
export default function DigestButton() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "review" | "approve">(null);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function call(action: "review" | "approve") {
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, ...(action === "approve" ? { action: "approve" } : {}) }),
      });
      const json = (await res.json()) as { detail?: string; error?: string };
      setMessage(
        res.ok
          ? {
              ok: true,
              text:
                action === "approve"
                  ? `Sent to the congregation! (${json.detail ?? "done"})`
                  : json.detail ?? "Sent!",
            }
          : { ok: false, text: json.error ?? json.detail ?? "Something went wrong." }
      );
    } catch {
      setMessage({ ok: false, text: "Network error — try again." });
    } finally {
      setBusy(null);
      setConfirming(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="font-semibold text-slate-900">This Week at Faith — email digest</h2>
      <p className="mt-1 text-sm text-slate-600">
        Every Monday morning the staff get a <strong>review copy</strong> of
        this week&rsquo;s digest. Nothing goes to the congregation until
        someone checks the dates and approves it here. Fixed an event since
        the review copy? No problem — approving always rebuilds the email
        from the website&rsquo;s current info.{" "}
        <a
          href="/api/digest?preview=1"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          See exactly what will go out →
        </a>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={() => call("review")}
          disabled={busy !== null || !password}
          className="rounded-lg border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-500/10 disabled:opacity-50"
        >
          {busy === "review" ? "Sending…" : "Email me a review copy"}
        </button>
        {confirming ? (
          <button
            onClick={() => call("approve")}
            disabled={busy !== null}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {busy === "approve" ? "Sending to everyone…" : "Yes — send to the whole mailing list"}
          </button>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            disabled={busy !== null || !password}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            Approve &amp; send to the congregation
          </button>
        )}
        {confirming && (
          <button
            onClick={() => setConfirming(false)}
            disabled={busy !== null}
            className="text-sm text-slate-500 underline-offset-4 hover:underline"
          >
            Cancel
          </button>
        )}
      </div>
      {message && (
        <p className={`mt-2 text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
