# Faith Baptist Church of Chelsea — Website

The new fbcchelsea.org, built with Next.js (App Router), TypeScript, and Tailwind CSS.
Deployed on Vercel. The old WordPress site stays live and untouched until we cut over.

This README is the manual. If something here is out of date or confusing, that's a bug —
fix it or ask Claude Code to.

## Running it locally

You need Node.js 20+ (you have it via nvm). Then:

```bash
npm install    # once, or after pulling changes that touch package.json
npm run dev    # starts the site at http://localhost:3000
```

Stop it with Ctrl+C. `npm run build` checks that the site compiles for production —
run it before pushing if you've edited code by hand.

## Where things live

| What | Where |
|---|---|
| Church facts (times, address, phone, links) | `content/site.json` — edit this, not the components |
| Page copy, bios, ministries | `content/` (Markdown/JSON — coming in phase 3) |
| Pages (one folder per page) | `app/` |
| Images | `public/images/` (logo is `public/images/logo.svg`) |
| Secrets (Planning Center token, etc.) | `.env.local` — never committed, listed in `.gitignore` |

## Editing content — two paths, same files

**Path 1 (browser):** run `npm run dev`, open http://localhost:3000/keystatic.
Edit Church Info (service times, address, links), Staff & Leaders, or
Announcements. Saving writes to the files under `content/` — then commit and push.

**Path 2 (files):** edit `content/site.json` or the `.mdx` files in
`content/staff/` and `content/announcements/` directly, commit, push.

Both paths touch the same files, so they can never disagree. Every push to
`main` redeploys the live site automatically.

### Adding a staff member

/keystatic → Staff & Leaders → "+" → fill in name, role, display order, photo,
bio → Save. Or copy an existing file in `content/staff/` and edit it.

### Adding an announcement

/keystatic → Announcements → "+". Set "Show until" — the announcement drops off
the homepage automatically after that date, so you never have to remember to
take it down.

### Letting volunteers edit content (not set up yet)

Right now `/keystatic` only works on a computer running the dev server, because
Keystatic is in "local" storage mode. To let volunteers edit through the live
website we switch `keystatic.config.ts` to GitHub storage mode, which requires a
one-time setup: Keystatic walks you through creating a GitHub App on the repo,
and volunteers then log in at `fbcchelsea… /keystatic` with GitHub accounts that
have access to the repo. Their edits become git commits, same as everything
else. Ask Claude Code to do this when you're ready to onboard a volunteer.

## Deploying and rolling back

Every push to `main` on GitHub deploys automatically via Vercel.

**To roll back a bad deploy:** go to the Vercel dashboard → the project → Deployments,
find the last good deployment, and click "… → Promote to Production". That's instant and
doesn't touch git. Then fix the code at your leisure.

## Environment variables

| Variable | What it does | Where to set it |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | The site's public URL (e.g. `https://fbc-website.vercel.app`). Used to build absolute links for Facebook/social previews. Optional — falls back to the Vercel deploy URL. | Vercel → project → Settings → Environment Variables |

## Known notes

- `npm audit` reports a `brace-expansion` advisory inside ESLint's dependencies. That's
  a development-only tool — it never ships to the live site. Don't run
  `npm audit fix --force`; it would break the linter. `sharp` (the image processor that
  *does* ship) is pinned to a patched version via the `overrides` field in `package.json`.

## Future ideas

- Sermon audio podcast (details to be written in phase 8)
