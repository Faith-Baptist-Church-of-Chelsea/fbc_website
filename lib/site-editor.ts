// The engine behind /admin's "describe the change in plain English" box.
//
// Flow: read the CURRENT content files from GitHub (main branch — the same
// files Keystatic edits) → ask Claude to produce the edited files → validate
// hard (path allowlist, JSON must parse, site.json must keep its required
// keys) → commit to main via the GitHub API → Vercel auto-deploys.
//
// Claude can ONLY touch files under content/ — never code. The validation
// here is the safety net, not the model's goodwill.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const REPO = "Great-Lakes-Seedline/fbc_website";
const BRANCH = "main";

// Only these may be created or modified. Anything else is rejected.
const EDITABLE = /^content\/(site\.json|statement-of-faith\.json|chat-facts\.md|(staff|announcements|testimonials|events)\/[a-z0-9-]+\.mdx)$/;

export type ProposedChange = { path: string; contents: string };
export type Proposal = {
  summary: string;
  warnings: string[];
  changes: ProposedChange[];
  deletions: string[];
};

// ---------- GitHub helpers ----------

function ghHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function gh(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { ...ghHeaders(), ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  return res;
}

/** All editable content files with their current text, straight from main. */
export async function readContentFromGitHub(): Promise<Map<string, string>> {
  const treeRes = await gh(`/repos/${REPO}/git/trees/${BRANCH}?recursive=1`);
  if (!treeRes.ok) throw new Error(`GitHub tree read failed: HTTP ${treeRes.status}`);
  const tree = (await treeRes.json()) as { tree: { path: string; type: string }[] };
  const paths = tree.tree
    .filter((e) => e.type === "blob" && EDITABLE.test(e.path))
    .map((e) => e.path);

  const files = new Map<string, string>();
  await Promise.all(
    paths.map(async (p) => {
      const res = await gh(`/repos/${REPO}/contents/${encodeURIComponent(p)}?ref=${BRANCH}`);
      if (!res.ok) return;
      const json = (await res.json()) as { content: string };
      files.set(p, Buffer.from(json.content, "base64").toString("utf8"));
    })
  );
  return files;
}

/** Commits the validated changes to main as one commit per file (simple, small volume). */
export async function commitChanges(
  changes: ProposedChange[],
  deletions: string[],
  summary: string
): Promise<string[]> {
  const commitUrls: string[] = [];
  for (const change of changes) {
    // Need the current sha when updating an existing file.
    const existing = await gh(`/repos/${REPO}/contents/${encodeURIComponent(change.path)}?ref=${BRANCH}`);
    const sha = existing.ok ? ((await existing.json()) as { sha: string }).sha : undefined;
    const res = await gh(`/repos/${REPO}/contents/${encodeURIComponent(change.path)}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `Admin panel: ${summary}\n\nEdited via /admin (AI-assisted content change).`,
        content: Buffer.from(change.contents, "utf8").toString("base64"),
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!res.ok) throw new Error(`GitHub write failed for ${change.path}: HTTP ${res.status}`);
    const json = (await res.json()) as { commit: { html_url: string } };
    commitUrls.push(json.commit.html_url);
  }
  for (const path of deletions) {
    const existing = await gh(`/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`);
    if (!existing.ok) continue; // already gone
    const sha = ((await existing.json()) as { sha: string }).sha;
    const res = await gh(`/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
      method: "DELETE",
      body: JSON.stringify({
        message: `Admin panel: ${summary} (remove ${path})`,
        sha,
        branch: BRANCH,
      }),
    });
    if (!res.ok) throw new Error(`GitHub delete failed for ${path}: HTTP ${res.status}`);
  }
  return commitUrls;
}

// ---------- Validation ----------

const SITE_JSON_REQUIRED = [
  "name", "address", "phone", "emails", "formRecipients", "officeHours",
  "services", "social", "links",
];

/** Throws with a plain-English reason if the proposal isn't safe to apply. */
export function validateProposal(p: Proposal): void {
  if (p.changes.length === 0 && p.deletions.length === 0) {
    throw new Error("The proposal contains no changes.");
  }
  for (const c of p.changes) {
    if (!EDITABLE.test(c.path)) {
      throw new Error(`Refusing to touch "${c.path}" — only content files may be edited from here.`);
    }
    if (c.contents.length > 200_000) {
      throw new Error(`"${c.path}" is implausibly large.`);
    }
    if (c.path.endsWith(".json")) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(c.contents);
      } catch {
        throw new Error(`"${c.path}" would no longer be valid JSON.`);
      }
      if (c.path === "content/site.json") {
        const obj = parsed as Record<string, unknown>;
        for (const key of SITE_JSON_REQUIRED) {
          if (!(key in obj)) throw new Error(`site.json would lose its required "${key}" section.`);
        }
        if (!Array.isArray(obj.services) || obj.services.length === 0) {
          throw new Error("site.json must keep at least one service time.");
        }
      }
      if (c.path === "content/statement-of-faith.json") {
        const obj = parsed as { sections?: unknown };
        if (!Array.isArray(obj.sections) || obj.sections.length < 20) {
          throw new Error("The statement of faith would lose sections — refusing.");
        }
      }
    }
  }
  for (const d of p.deletions) {
    // Never allow deleting the two core files.
    if (!/^content\/(staff|announcements|testimonials|events)\/[a-z0-9-]+\.mdx$/.test(d)) {
      throw new Error(`Refusing to delete "${d}" — only staff, announcement, testimonial, or event entries may be removed.`);
    }
  }
}

// ---------- Claude proposal ----------

const PROPOSAL_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: {
      type: "string" as const,
      description: "One or two plain-English sentences describing what will change on the website.",
    },
    warnings: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Anything the editor should double-check before applying (ambiguities, assumptions made, things that couldn't be done).",
    },
    changes: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          path: { type: "string" as const, description: "Repo-relative path of the file, e.g. content/site.json" },
          contents: { type: "string" as const, description: "The COMPLETE new contents of the file." },
        },
        required: ["path", "contents"],
        additionalProperties: false,
      },
    },
    deletions: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Repo-relative paths of staff/announcement files to delete entirely (e.g. an expired announcement).",
    },
  },
  required: ["summary", "warnings", "changes", "deletions"],
  additionalProperties: false,
};

export async function proposeChanges(instruction: string): Promise<Proposal> {
  const files = await readContentFromGitHub();
  const fileDump = [...files.entries()]
    .map(([p, text]) => `=== ${p} ===\n${text}`)
    .join("\n\n");

  const client = new Anthropic();
  const response = await client.beta.messages.create({
    model: "claude-opus-5",
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      format: { type: "json_schema", schema: PROPOSAL_SCHEMA },
    },
    system: `You edit the content files of the Faith Baptist Church of Chelsea website on behalf of church staff who describe changes in plain English.

The website reads everything from these files:
- content/site.json — service times, address, phone, emails, office hours, links, form recipients
- content/statement-of-faith.json — doctrine (edit ONLY when explicitly asked; never reword doctrine on your own)
- content/staff/*.mdx — one file per staff member (YAML frontmatter: name, role, order; body = bio)
- content/announcements/*.mdx — homepage/events announcements (frontmatter: title, expires (YYYY-MM-DD), link; body = details)
- content/testimonials/*.mdx — homepage testimonials (frontmatter: name, detail; body = the quote)
- content/events/*.mdx — upcoming events (frontmatter: title, date (YYYY-MM-DD), time (display text like "6:30 PM"), showUntil (optional YYYY-MM-DD for multi-day), location, image (path, do not change), signupLink; body = description). Events disappear automatically after their date/showUntil. Graphics are uploaded in /keystatic, not here.
- content/chat-facts.md — facts the website's chat assistant may use

Rules:
- Return the COMPLETE new contents for every file you change — not a diff.
- Only change what the instruction asks for. Keep formatting, keys, and untouched entries exactly as they are.
- New staff/announcement files: kebab-case filenames matching the pattern shown by existing files.
- If the instruction is ambiguous, make the most reasonable interpretation and record the assumption in warnings.
- If the instruction asks for something these files cannot express (new page, design change, photos), make no change for that part and explain in warnings that it needs the developer.
- Church voice: warm, plain, honest. Never invent facts — if the instruction lacks a needed fact (a date, a name), note it in warnings instead of guessing.`,
    messages: [
      {
        role: "user",
        content: `Current content files:\n\n${fileDump}\n\nRequested change: ${instruction}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The AI declined this request. Try rephrasing, or make the edit in /keystatic.");
  }
  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const proposal = JSON.parse(text) as Proposal;
  proposal.warnings ??= [];
  proposal.changes ??= [];
  proposal.deletions ??= [];
  return proposal;
}
