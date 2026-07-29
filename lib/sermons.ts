// Turns the church's real-world YouTube titles into structured sermons
// the browser on /sermons can search and filter.
//
// Titles in the wild look like:
//   July 19, 2026 A.M Acts 7:38-39 "But Their Hearts Turned Back Again..."
//   July 19, 2026 P.M. "The Fall Of Man" "Genesis 3"
//   June 28, 2026 Family School
//   May 20, 2026 "Thou Shalt Surely Die" "Genesis 2:17"   (a Wednesday)
//   Picnic Announcement / His Life for Mine                (specials)
// Parsing is best-effort: anything unrecognized still shows, just under
// the "Special" tab with its raw title.
import type { SermonVideo } from "@/lib/youtube";

export type SermonKind = "Sunday AM" | "Sunday PM" | "Family School" | "Midweek" | "Special";

export type ParsedSermon = {
  videoId: string;
  publishedAt: string;
  thumbnail: string | null;
  raw: string;
  title: string;
  passage: string | null;
  kind: SermonKind;
};

const BOOKS = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
  "Nehemiah","Esther","Job","Psalm","Psalms","Proverbs","Ecclesiastes",
  "Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea",
  "Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai",
  "Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans",
  "1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians",
  "Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy",
  "Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John",
  "3 John","Jude","Revelation","Revelations",
];
// Longest names first so "1 Corinthians" wins over "Corinthians"-less noise.
const BOOK_ALTERNATION = BOOKS.sort((a, b) => b.length - a.length)
  .map((b) => b.replace(/ /g, "\\s+"))
  .join("|");
const PASSAGE_RE = new RegExp(
  `\\b(${BOOK_ALTERNATION})\\s+(\\d{1,3})(?::(\\d{1,3}(?:\\s*-\\s*\\d{1,3})?))?`,
  "i"
);

const WEEKDAY_FMT = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "America/Detroit" });

function detectKind(raw: string, publishedAt: string): SermonKind {
  if (/family\s+school/i.test(raw)) return "Family School";
  if (/\bA\.?\s?M\b/i.test(raw)) return "Sunday AM";
  if (/\bP\.?\s?M\b/i.test(raw)) return "Sunday PM";
  // No tag: use the date IN the title when present (more reliable than
  // the upload timestamp), falling back to the publish date.
  const dated = raw.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
  const when = dated ? new Date(`${dated[1].replace(",", "")} 12:00`) : new Date(publishedAt);
  if (!Number.isNaN(when.getTime())) {
    const day = WEEKDAY_FMT.format(when);
    if (day === "Wed") return "Midweek";
  }
  return "Special";
}

export function parseSermon(v: SermonVideo): ParsedSermon {
  const raw = v.title.trim();
  const passageMatch = raw.match(PASSAGE_RE);
  const passage = passageMatch
    ? `${passageMatch[1].replace(/\s+/g, " ")} ${passageMatch[2]}${passageMatch[3] ? `:${passageMatch[3].replace(/\s/g, "")}` : ""}`
    : null;

  // Quoted segment(s) are usually the sermon title; drop any quote that is
  // itself just the passage reference.
  const quotes = [...raw.matchAll(/["“]([^"”]+)["”]/g)]
    .map((m) => m[1].trim())
    .filter((q) => q && !(passage && PASSAGE_RE.test(q) && q.length <= passage.length + 4));
  let title = quotes.join(" · ");

  if (!title) {
    // Strip the leading date and AM/PM tag; whatever remains is the title.
    title = raw
      .replace(/^[A-Za-z]+\s+\d{1,2},?\s+\d{4}\s*/, "")
      .replace(/^(Sunday\s+)?[AP]\.?\s?M\.?\s*/i, "")
      .replace(PASSAGE_RE, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  if (!title) title = passage ?? raw;

  return {
    videoId: v.videoId,
    publishedAt: v.publishedAt,
    thumbnail: v.thumbnail,
    raw,
    title,
    passage,
    kind: detectKind(raw, v.publishedAt),
  };
}
