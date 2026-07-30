// Parsing for the rich-text (`fields.mdx`) content Keystatic stores.
//
// Keystatic's Reader API hands back the RAW markdown source for an mdx field —
// not HTML, and not anything React can render. Printing that string straight
// into JSX is what put literal "**Monday, October 12**" and "![](photo.png)"
// on the live event pages. Everything here turns that source into a syntax
// tree; components/RichText.tsx turns the tree into React elements.
//
// We deliberately stop at the syntax tree and never build an HTML string, so
// there is no HTML to sanitize and no `dangerouslySetInnerHTML` anywhere:
// React escapes every text node it renders. Raw HTML embedded in the markdown
// is dropped rather than trusted (see RichText's `html` case).
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfm } from "micromark-extension-gfm";
import { gfmFromMarkdown } from "mdast-util-gfm";
import type { Root, RootContent } from "mdast";

/** URL schemes we're willing to put in an href or src. */
const SAFE_SCHEME = /^(?:https?:|mailto:|tel:)/i;

/**
 * Returns the URL if it's safe to emit, otherwise null. Blocks `javascript:`,
 * `data:` and friends — cheap insurance, since anyone who can edit content
 * could otherwise plant a script URL in an ordinary-looking link.
 */
export function safeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Site-relative links and same-page anchors.
  if (/^[/#?]/.test(trimmed) && !trimmed.startsWith("//")) return trimmed;
  return SAFE_SCHEME.test(trimmed) ? trimmed : null;
}

/**
 * MDX expression blocks — `{/* a note to ourselves *\/}` — are authoring
 * comments (some of our content files carry TODOs) and must never reach the
 * page. Stripping them before parsing keeps the tree free of MDX-only nodes.
 */
function stripMdxComments(source: string): string {
  return source.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");
}

/** Parse Keystatic rich-text source into an mdast tree (GitHub-flavoured). */
export function parseRichText(source: string): Root {
  return fromMarkdown(stripMdxComments(source), {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
}

/** True when the field is empty or held nothing but comments/whitespace. */
export function isRichTextEmpty(source: string): boolean {
  return parseRichText(source).children.length === 0;
}

/**
 * The visible words with all formatting removed — for `<meta>` descriptions
 * and structured data, which must never contain markdown punctuation.
 */
export function richTextToPlainText(source: string): string {
  const out: string[] = [];

  // Only block-level nodes get a separator after them. Inline runs are
  // concatenated as-is, so unwrapping bold doesn't leave "October 12 ,".
  const BLOCK = new Set([
    "paragraph",
    "heading",
    "listItem",
    "blockquote",
    "code",
    "table",
    "tableRow",
    "tableCell",
    "thematicBreak",
  ]);

  const walk = (nodes: RootContent[]) => {
    for (const node of nodes) {
      switch (node.type) {
        case "text":
        case "inlineCode":
        case "code":
          out.push(node.value);
          break;
        case "image":
          if (node.alt) out.push(node.alt);
          break;
        case "break":
          out.push(" ");
          break;
        case "html":
          break; // never surface raw markup as "text"
        default:
          if ("children" in node) walk(node.children as RootContent[]);
      }
      if (BLOCK.has(node.type)) out.push(" ");
    }
  };

  walk(parseRichText(source).children);
  return out.join("").replace(/\s+/g, " ").trim();
}
