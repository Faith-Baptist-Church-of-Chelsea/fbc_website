"use client";

import { useEffect, useRef, useState } from "react";
import { ES, type Locale } from "@/lib/i18n";

type Turn = { role: "user" | "assistant"; content: string };

// The floating "ask a question" bubble, bottom-right on every page.
// Talks to /api/ask, which answers only from the church's own content.
export default function AskBubble({ locale = "en" }: { locale?: Locale }) {
  const es = locale === "es";
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [turns, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    setInput("");
    const nextTurns: Turn[] = [...turns, { role: "user", content: question }];
    setTurns(nextTurns);
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history: turns.slice(-6) }),
      });
      const json = await res.json();
      setTurns([...nextTurns, { role: "assistant", content: json.answer ?? "Sorry — something went wrong." }]);
    } catch {
      setTurns([...nextTurns, { role: "assistant", content: "Sorry — I couldn't reach the server. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="bg-slate-900 px-4 py-3 text-white">
            <p className="font-bold">{es ? ES.ask.title : "Questions about our church?"}</p>
            <p className="text-xs text-slate-300">
              {es
                ? "Un asistente automático que solo conoce Faith Baptist — para asuntos personales, contacte a nuestros pastores. Puede escribir en español."
                : "An automated assistant that only knows about Faith Baptist — for anything personal, please contact our pastors."}
            </p>
          </div>
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {turns.length === 0 && (
              <p className="text-sm text-slate-500">
                {es ? (
                  <>Pruebe: &ldquo;¿Cómo debo vestirme?&rdquo; · &ldquo;¿Qué tienen para un niño de 4 años?&rdquo; · &ldquo;¿Hay traducción al español?&rdquo;</>
                ) : (
                  <>Try: &ldquo;What should I wear?&rdquo; · &ldquo;What do you have for a 4-year-old?&rdquo; · &ldquo;Are you KJV?&rdquo;</>
                )}
              </p>
            )}
            {turns.map((t, i) => (
              <p
                key={i}
                className={
                  t.role === "user"
                    ? "ml-8 rounded-xl rounded-br-sm bg-brand-500 px-3 py-2 text-sm text-white"
                    : "mr-8 whitespace-pre-wrap rounded-xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-800"
                }
              >
                {t.content}
              </p>
            ))}
            {busy && (
              <p className="mr-8 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
                {es ? "Pensando…" : "Thinking…"}
              </p>
            )}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
            <label htmlFor="ask-input" className="sr-only">
              {es ? "Su pregunta" : "Your question"}
            </label>
            <input
              id="ask-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={600}
              placeholder={es ? ES.ask.placeholder : "Ask a question…"}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {es ? ES.ask.send : "Send"}
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? (es ? ES.ask.close : "Close church questions chat") : es ? ES.ask.open : "Ask a question about our church"}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition-colors hover:bg-brand-600"
      >
        {open ? (
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a8 8 0 0 1-8 8H4l1.6-3.2A8 8 0 1 1 21 12z" />
            <path d="M9 11h.01M12 11h.01M15 11h.01" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
