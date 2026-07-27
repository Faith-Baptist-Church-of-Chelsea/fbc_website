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

## Changing a service time

Edit the `services` array in `content/site.json`, commit, push. Vercel redeploys
automatically. (Once Keystatic is set up in phase 3, this will also be editable in a
browser at `/keystatic`.)

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
