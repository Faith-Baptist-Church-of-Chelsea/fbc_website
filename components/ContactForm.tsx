"use client";

import { useState } from "react";

const KIND_OPTIONS = [
  { value: "question", label: "I have a question" },
  { value: "visit", label: "I'm new / planning a visit" },
  { value: "prayer", label: "Prayer request" },
  { value: "music", label: "I want to join the choir or orchestra" },
] as const;

type Status = "idle" | "sending" | "sent" | "error";

// The one form for everything: questions, visits, prayer requests, music
// sign-ups. Includes a honeypot field ("website") that stays invisible to
// people but catches bots.
export default function ContactForm({ initialKind = "question" }: { initialKind?: string }) {
  const [kind, setKind] = useState(initialKind);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, confidential: data.confidential === "on" }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus("sent");
        form.reset();
      } else {
        setStatus("error");
        setError(json.error ?? "Something went wrong — please try again.");
      }
    } catch {
      setStatus("error");
      setError("Couldn't reach the server — check your connection and try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl bg-green-50 p-8 text-center" role="status">
        <p className="text-xl font-bold text-green-900">Got it — thank you.</p>
        <p className="mt-2 text-green-800">
          A real person reads every one of these, usually within a day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="cf-kind" className="block font-semibold text-slate-900">
          What&rsquo;s this about?
        </label>
        <select
          id="cf-kind"
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3"
        >
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="block font-semibold text-slate-900">
            Name
          </label>
          <input
            id="cf-name"
            name="name"
            required
            autoComplete="name"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          />
        </div>
        <div>
          <label htmlFor="cf-email" className="block font-semibold text-slate-900">
            Email
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cf-phone" className="block font-semibold text-slate-900">
          Phone <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input
          id="cf-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="mt-1 w-full rounded-lg border border-slate-300 p-3"
        />
      </div>

      <div>
        <label htmlFor="cf-message" className="block font-semibold text-slate-900">
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          required
          rows={5}
          className="mt-1 w-full rounded-lg border border-slate-300 p-3"
        />
      </div>

      {kind === "prayer" && (
        <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-slate-700">
          <input type="checkbox" name="confidential" className="mt-1 h-5 w-5" />
          <span>
            <span className="font-semibold text-slate-900">Keep this confidential</span>
            {" — "}share only with the pastors, not the prayer list.
          </span>
        </label>
      )}

      {/* Honeypot — hidden from people (and screen readers), filled by bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {status === "error" && (
        <p className="rounded-lg bg-red-50 p-4 text-red-800" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-lg bg-brand-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
