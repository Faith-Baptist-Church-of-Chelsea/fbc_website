// Backend for the /admin plain-English editor.
// Two actions, both password-gated:
//   propose — AI drafts the file changes and returns them for review
//   apply   — the reviewed changes are validated again and committed to
//             GitHub, which triggers the normal Vercel deploy
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  commitChanges,
  proposeChanges,
  validateProposal,
  type Proposal,
} from "@/lib/site-editor";
import { makeRateLimiter, requestIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // AI drafting can take a couple of minutes

const limited = makeRateLimiter(20, 60 * 60 * 1000);

function passwordOk(supplied: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(supplied).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (limited(requestIp(req.headers))) {
    return NextResponse.json({ error: "Too many requests — wait a bit." }, { status: 429 });
  }
  if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_TOKEN || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "The editor isn't fully configured yet — see /admin/health." },
      { status: 503 }
    );
  }

  let body: {
    action?: string;
    password?: string;
    instruction?: string;
    proposal?: Proposal;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (!passwordOk(String(body.password ?? ""))) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  try {
    if (body.action === "propose") {
      const instruction = String(body.instruction ?? "").trim().slice(0, 4000);
      if (!instruction) {
        return NextResponse.json({ error: "Describe the change first." }, { status: 400 });
      }
      const proposal = await proposeChanges(instruction);
      validateProposal(proposal);
      return NextResponse.json({ proposal });
    }

    if (body.action === "apply") {
      const proposal = body.proposal;
      if (!proposal) {
        return NextResponse.json({ error: "Nothing to apply." }, { status: 400 });
      }
      validateProposal(proposal); // re-validate — never trust the round-trip
      const commits = await commitChanges(
        proposal.changes,
        proposal.deletions,
        proposal.summary.slice(0, 120)
      );
      return NextResponse.json({
        ok: true,
        commits,
        message: "Changes committed. The live site updates in about two minutes.",
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    console.warn("[admin/edit] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
