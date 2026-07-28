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

## Photos the site is waiting for

Drop files into `public/images/` with exactly these names and the placeholders
become photos on the next deploy — no code changes. Get written permission for
any recognizable child.

Sizes: the "ideal size" below is 2× what the layout displays, so photos stay
sharp on phone screens. Bigger is always fine — the site resizes automatically
— and if the shape isn't exact it gets cropped toward the center, so keep the
subject centered. Don't go below about two-thirds of the ideal size.

| File | What it should show | Shape | Ideal size (px) |
|---|---|---|---|
| `building-exterior.jpg` | Building from the road, bright day | 4:3 landscape | 1600 × 1200 |
| `main-entrance.jpg` | The door visitors should actually use | 4:3 landscape | 1600 × 1200 |
| `parking-lot.jpg` | Lot, showing parking relative to that door | 4:3 landscape | 1600 × 1200 |
| `family-school-wide.jpg` | All ages together in one room (wide) | 3:2 landscape | 2400 × 1600 |
| `kids-class.jpg` | Kids class in session | 16:10 landscape | 1600 × 1000 |
| `checkin-station.jpg` | Check-in station in use | 3:2 landscape | 2400 × 1600 |
| `youth-group.jpg` | Youth group on a Wednesday night | 3:2 landscape | 2400 × 1600 |
| `young-adults-activity.jpg` | Young adults at an activity | 3:2 landscape | 2400 × 1600 |
| `choir.jpg` | Choir mid-song | wide 12:7 | 2400 × 1400 |
| `orchestra.jpg` | Orchestra mid-song | wide 12:7 | 2400 × 1400 |
| `missions-map.jpg` | Missionary map/display | 3:2 landscape | 2400 × 1600 |
| `church-center-screenshots.png` | Church Center app screenshots | 16:9 landscape | 1600 × 900 |
| `staff/adam-summers.jpg` (etc.) | Staff headshots — consistent lighting; one per person, named after the file in `content/staff/` | square | 800 × 800 |
| `teachers/nursery.jpg` | Nursery worker holding a child | square | 600 × 600 |
| `teachers/ben-amanda-bolen.jpg` | The Bolens | square | 600 × 600 |
| `teachers/haley-sackmann.jpg` | Haley Sackmann | square | 600 × 600 |
| `teachers/abi-wireman.jpg` | Abi Wireman | square | 600 × 600 |
| `teachers/scott-heather-turnbow.jpg` | The Turnbows | square | 600 × 600 |
| `teachers/moriah-summers.jpg` | Moriah Summers | square | 600 × 600 |
| `teachers/josiah-ashley-jaworski.jpg` | The Jaworskis | square | 600 × 600 |

The `teachers/` photos also appear in the automatic welcome email sent to
visiting families — the email skips any photo that isn't there yet.

**Event graphics** (uploaded in /keystatic when creating an event): use
**1920 × 1080 (16:9)** — the same size as projection/Church Center slides.
Other shapes work, but 16:9 displays without any cropping. Keep important
text away from the very edges.

## Environment variables

| Variable | What it does | Where to set it |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | The site's public URL. Used to build absolute links for Facebook/social previews. Optional — falls back to the production URL baked into `app/layout.tsx`. | Vercel → project → Settings → Environment Variables |
| `PCO_APP_ID` | Planning Center Personal Access Token — the Application ID half. | Vercel env vars + `.env.local` |
| `PCO_SECRET` | Planning Center Personal Access Token — the Secret half. Server-side only; never sent to browsers. | Vercel env vars + `.env.local` |
| `RESEND_API_KEY` | Lets form submissions send email. Without it, forms still record people in Planning Center but staff get no email (red on /admin/health). | Vercel env vars + `.env.local` |
| `YOUTUBE_API_KEY` | Optional upgrade: verified "We're live" banner + sermon grid with titles/dates. Without it everything still works in keyless mode. | Vercel env vars + `.env.local` |
| `GOOGLE_PLACES_API_KEY` | Pulls the church's Google reviews for the homepage (Maps Platform API key). | Vercel env vars + `.env.local` |
| `ANTHROPIC_API_KEY` | Powers the visitor question bubble and the /admin plain-English editor. Without it the bubble is hidden and /admin is disabled. | Vercel env vars + `.env.local` |
| `ADMIN_PASSWORD` | The password volunteers type on /admin. Pick something long; share it only with people allowed to change the site. | Vercel env vars + `.env.local` |
| `GITHUB_TOKEN` | Lets /admin commit content changes to the repo. Fine-grained personal access token, ONLY the `fbc_website` repo, ONLY Contents read/write permission. | Vercel env vars + `.env.local` |

## The visitor question bubble

Every page has a chat bubble (bottom-right) where visitors can ask questions
("What should I wear?", "Do you have a nursery?"). It answers using ONLY the
church's own content — service times, the statement of faith, staff bios,
announcements, and `content/chat-facts.md`. It refuses off-topic questions and
points personal/pastoral matters to the pastors.

**If it can't answer something people keep asking:** add the fact to
`content/chat-facts.md` (editable via /admin too) and push.

**Cost:** it runs on Claude (Anthropic's API). A typical question costs a few
cents at most — usually under a cent once caching kicks in. At small-church
traffic that's a few dollars a month. Set a spending limit in the Anthropic
console for peace of mind.

## The /admin plain-English editor

`yoursite/admin` lets anyone with the admin password type a change in plain
English ("move the Wednesday service to 6:30"), preview exactly what will
change, and apply it. Under the hood: Claude edits the same `content/` files
Keystatic edits, the server validates the result (only content files, JSON
must stay valid, the statement of faith can't silently lose sections), and the
change is committed to GitHub → auto-deploys in ~2 minutes.

**Undoing a change:** every change is a git commit. `git revert <sha>` and
push, or ask Claude Code. The commit message starts with "Admin panel:".

**What it can't do:** new pages, design changes, photos — those still go
through the code (and Steven).

## How the contact form works

One form on `/contact` handles questions, visit heads-ups, prayer requests
(with a confidential checkbox), and choir/orchestra interest. Each submission:

1. **Emails** everyone listed in `/keystatic` → Church Info → **Form
   recipients** — add or remove staff there, no code involved.
2. **Creates or finds the person in Planning Center People** (by email), so
   follow-up happens where the church already works. Confidential prayer
   content is never written to People — email only.

Spam protection is a hidden honeypot field plus a 5-per-hour-per-IP rate
limit. No CAPTCHA, on purpose.

Until `fbcchelsea.org` is verified as a sending domain in Resend, emails come
from `onboarding@resend.dev` (Resend's shared test sender) — fine for
testing, but verify the domain before launch so emails come from
`website@fbcchelsea.org` and land reliably in inboxes.

## Setting up the two remaining API keys

**Resend (email):** create a free account at resend.com (100 emails/day free,
far more than we need) → API Keys → Create. Add it as `RESEND_API_KEY`.

**YouTube (optional):** console.cloud.google.com → create a project ("FBC
Website") → APIs & Services → Library → enable **YouTube Data API v3** →
Credentials → Create credentials → API key. Restrict the key to the YouTube
Data API. Add it as `YOUTUBE_API_KEY`.

## Sermon audio podcast (not built — here's what it would take)

We want one eventually. The pieces:

1. **Audio extraction** — each week, pull the sermon audio out of the YouTube
   upload (or better: export the audio directly from whatever records the
   service). A small script can automate the YouTube route.
2. **Hosting** — podcast audio needs a host that serves MP3s and generates an
   RSS feed. The boring, cheap answers: Transistor.fm (~$19/mo),
   Spotify for Creators (free), or self-hosting MP3s in this repo's public/
   folder with a generated feed (free, more fiddly).
3. **RSS feed** — the host usually provides this. Self-hosted, we'd generate
   `/podcast.xml` from a JSON list of episodes — half a day of work.
4. **Directories** — submit the feed once to Apple Podcasts and Spotify;
   both take a few days to approve, then update automatically.

Realistic total: one afternoon of setup plus a 10-minute weekly routine
(upload audio, title it). The weekly routine is the real commitment — decide
who owns it before building anything.

## How the Events page works

Upcoming events come from two places, merged on the page:

1. **Planning Center Registrations** — every open, non-archived signup shows
   automatically with its date, description, image, and Register button.
   Cached for 15 minutes; if Planning Center is unreachable the section
   quietly disappears rather than erroring (last-known-good stays up until
   the next successful refresh).
2. **Announcements** (`/keystatic` → Announcements) — for anything that isn't
   a registration: potlucks, schedule changes, etc.

**Is something broken?** Open `/admin/health` on the live site — it probes
each Planning Center product live and tells you exactly what's wrong.

## Known notes

- `npm audit` reports a `brace-expansion` advisory inside ESLint's dependencies. That's
  a development-only tool — it never ships to the live site. Don't run
  `npm audit fix --force`; it would break the linter. `sharp` (the image processor that
  *does* ship) is pinned to a patched version via the `overrides` field in `package.json`.

## Future ideas

- Sermon audio podcast (see the section above)
- Volunteer editing through the live site (Keystatic GitHub mode — see
  "Letting volunteers edit content")
- Surface individual missionaries on /missions (needs manual content or a
  Church Center change; their custom pages aren't in the API)
- Sermon archive browsable by speaker (needs consistent YouTube title
  format like "Title — Speaker — Date", or Publishing episodes)
- Custom domain cutover: point fbcchelsea.org at Vercel when ready — DNS
  change + update NEXT_PUBLIC_SITE_URL + verify domain in Resend
