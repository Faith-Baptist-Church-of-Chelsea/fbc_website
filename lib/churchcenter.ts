// Builds the Church Center link for a calendar event.
//
// Church Center's custom pages have predictable URLs: "Pop Can Drive"
// lives at /pages/pop-can-drive. Their site can't be probed server-side
// (it's a JS app that answers 200 for everything), so the convention is:
//   1. If the calendar event's DESCRIPTION contains a link, that wins —
//      paste any URL into the Google Calendar event to control this.
//   2. Otherwise we link to the slug guessed from the title.
export function churchCenterEventLink(
  title: string,
  description?: string | null
): string {
  const explicit = description?.match(/https?:\/\/[^\s"'<>)]+/)?.[0];
  if (explicit) return explicit;
  const slug = title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return `https://fbcchelsea.churchcenter.com/pages/${slug}`;
}
