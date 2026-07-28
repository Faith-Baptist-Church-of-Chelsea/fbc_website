// Church Center / Planning Center descriptions arrive as HTML; flatten to
// plain paragraphs so pages control their own styling and nothing raw leaks.
export function htmlToParagraphs(html: string): string[] {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>/gi, "") // links: keep the text, drop the tag
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
