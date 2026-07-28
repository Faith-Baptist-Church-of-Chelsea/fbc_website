// Church Center integrations.
import "server-only";

const CC = "https://fbcchelsea.churchcenter.com";

// Guest token for Church Center's public API — the same anonymous
// handshake its own website performs. Cached per server instance.
let tokenCache: { token: string; expires: number } | null = null;
async function ccToken(): Promise<string | null> {
  if (tokenCache && Date.now() < tokenCache.expires - 60_000) return tokenCache.token;
  try {
    const res = await fetch(`${CC}/sessions/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { attributes?: { token?: string; expires_at?: string } };
    };
    const token = json.data?.attributes?.token;
    if (!token) return null;
    const expires = json.data?.attributes?.expires_at
      ? Date.parse(json.data.attributes.expires_at)
      : Date.now() + 30 * 60_000;
    tokenCache = { token, expires };
    return token;
  } catch {
    return null;
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * The Church Center link for a calendar event (used on /events), with NO
 * broken links possible:
 *   1. A URL pasted in the calendar event's description always wins.
 *   2. Otherwise the title's slug (and progressively shortened variants,
 *      so "Sounds & Sights Church Booth" finds /pages/sounds-and-sights)
 *      is VERIFIED against Church Center's page API — cached an hour.
 *   3. If nothing verifies, link to the upcoming-events page.
 */
export async function churchCenterEventLink(
  title: string,
  description?: string | null
): Promise<string> {
  const explicit = description?.match(/https?:\/\/[^\s"'<>)]+/)?.[0];
  if (explicit) return explicit;

  const token = await ccToken();
  if (token) {
    const words = slugify(title).split("-");
    const candidates = [words.join("-")];
    if (words.length > 2) candidates.push(words.slice(0, -1).join("-"));
    if (words.length > 3) candidates.push(words.slice(0, -2).join("-"));
    for (const slug of candidates) {
      try {
        const res = await fetch(
          `https://api.churchcenter.com/publishing/v2/pages/${slug}@published`,
          { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 3600 } }
        );
        if (res.ok) return `${CC}/pages/${slug}`;
      } catch {
        break;
      }
    }
  }
  return `${CC}/pages/upcoming-events`;
}

// ---------- The homepage "Coming up" carousel ----------
//
// Source of truth: the church-curated Church Center page at
// /pages/upcoming-events — one graphic per event, each linking to its
// detail page. Church Center's public page API needs a guest token
// (the same anonymous handshake its own website performs); everything
// fails soft to [] so the homepage simply hides the section.

export type CcFeaturedEvent = { title: string; href: string; image: string };

type CcImageBlock = {
  type: string;
  attributes?: {
    src?: string;
    alt?: string;
    link_url?: string;
    link_url_enabled?: boolean;
  };
};

function titleFor(a: NonNullable<CcImageBlock["attributes"]>): string {
  // Prefer the linked page's slug ("pop-can-drive" → "Pop Can Drive") —
  // image alt text is often just a filename.
  const slug = a.link_url?.match(/\/pages\/([a-z0-9-]+)/)?.[1];
  if (slug && slug !== "upcoming-events") {
    return slug
      .split("-")
      .map((w) => (w === "and" ? "&" : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(" ");
  }
  const alt = (a.alt ?? "")
    .replace(/\.(png|jpe?g|webp)$/i, "")
    .replace(/\b(slide|graphic)\b/gi, "")
    .replace(/\b\d{2,4}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return alt || "Upcoming event";
}

export async function getChurchCenterFeaturedEvents(): Promise<CcFeaturedEvent[]> {
  try {
    const tokRes = await fetch(`${CC}/sessions/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!tokRes.ok) return [];
    const token = ((await tokRes.json()) as { data?: { attributes?: { token?: string } } })
      .data?.attributes?.token;
    if (!token) return [];

    const pageRes = await fetch(
      "https://api.churchcenter.com/publishing/v2/pages/upcoming-events@published",
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!pageRes.ok) {
      console.warn(`[churchcenter] page fetch HTTP ${pageRes.status}`);
      return [];
    }
    const json = (await pageRes.json()) as {
      data?: { attributes?: { blocks?: CcImageBlock[] } };
    };
    const blocks = json.data?.attributes?.blocks ?? [];

    const out: CcFeaturedEvent[] = [];
    for (const b of blocks) {
      if (b.type !== "Image" || !b.attributes?.src) continue;
      const a = b.attributes;
      const href =
        a.link_url_enabled && a.link_url
          ? a.link_url.startsWith("http")
            ? a.link_url
            : `${CC}${a.link_url}`
          : `${CC}/pages/upcoming-events`;
      out.push({ title: titleFor(a), href, image: a.src });
    }
    return out;
  } catch (err) {
    console.warn("[churchcenter] featured events failed:", err instanceof Error ? err.message : err);
    return [];
  }
}
