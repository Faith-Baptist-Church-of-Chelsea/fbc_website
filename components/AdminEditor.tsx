"use client";

import { useState } from "react";

type Proposal = {
  summary: string;
  warnings: string[];
  changes: { path: string; contents: string }[];
  deletions: string[];
};

// Plain-English website editor: describe a change, review what the AI
// proposes (summary + the actual file contents), then apply. Nothing
// touches the site until "Apply" is clicked.
export default function AdminEditor() {
  const [password, setPassword] = useState("");
  const [instruction, setInstruction] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [status, setStatus] = useState<"idle" | "proposing" | "applying" | "done">("idle");
  const [error, setError] = useState("");
  const [doneMessage, setDoneMessage] = useState("");
  const [showFiles, setShowFiles] = useState(false);

  async function call(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
    return json;
  }

  async function propose(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setProposal(null);
    setStatus("proposing");
    try {
      const json = await call({ action: "propose", instruction });
      setProposal(json.proposal);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      setStatus("idle");
    }
  }

  async function apply() {
    if (!proposal) return;
    setError("");
    setStatus("applying");
    try {
      const json = await call({ action: "apply", proposal });
      setDoneMessage(json.message);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      setStatus("idle");
    }
  }

  function reset() {
    setProposal(null);
    setInstruction("");
    setDoneMessage("");
    setStatus("idle");
    setError("");
  }

  if (status === "done") {
    return (
      <div className="rounded-xl bg-green-50 p-8 text-center">
        <p className="text-xl font-bold text-green-900">Done!</p>
        <p className="mt-2 text-green-800">{doneMessage}</p>
        <button onClick={reset} className="mt-5 rounded-lg bg-brand-500 px-5 py-2.5 font-semibold text-white">
          Make another change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={propose} className="space-y-4">
        <div>
          <label htmlFor="ae-pass" className="block font-semibold text-slate-900">
            Admin password
          </label>
          <input
            id="ae-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 p-3"
          />
        </div>
        <div>
          <label htmlFor="ae-instruction" className="block font-semibold text-slate-900">
            What should change on the website?
          </label>
          <p className="text-sm text-slate-500">
            Plain English is fine — e.g. &ldquo;Change the Wednesday service to
            6:30 PM&rdquo;, &ldquo;Add an announcement: church picnic August 15
            at noon, ends August 15&rdquo;, &ldquo;Update Moriah&rsquo;s role
            to Office Administrator&rdquo;.
          </p>
          <textarea
            id="ae-instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            required
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-300 p-3"
          />
        </div>
        <button
          type="submit"
          disabled={status === "proposing"}
          className="rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {status === "proposing" ? "Working — this can take a minute…" : "Preview the change"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 p-4 text-red-800" role="alert">
          {error}
        </p>
      )}

      {proposal && (
        <div className="rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900">Review before it goes live</h2>
          <p className="mt-2 text-slate-700">{proposal.summary}</p>
          {proposal.warnings.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
              {proposal.warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-slate-500">
            Files affected:{" "}
            {[...proposal.changes.map((c) => c.path), ...proposal.deletions.map((d) => `${d} (removed)`)].join(", ")}
          </p>
          <button
            type="button"
            onClick={() => setShowFiles((s) => !s)}
            className="mt-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            {showFiles ? "Hide file contents" : "Show exact file contents"}
          </button>
          {showFiles &&
            proposal.changes.map((c) => (
              <details key={c.path} open className="mt-3">
                <summary className="cursor-pointer font-mono text-sm font-semibold text-slate-700">{c.path}</summary>
                <pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-200">
                  {c.contents}
                </pre>
              </details>
            ))}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={apply}
              disabled={status === "applying"}
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {status === "applying" ? "Applying…" : "Apply — put it on the website"}
            </button>
            <button
              type="button"
              onClick={() => setProposal(null)}
              className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
