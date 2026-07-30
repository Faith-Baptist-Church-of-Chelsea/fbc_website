import type { ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { RootContent } from "mdast";
import { parseRichText } from "@/lib/richtext";

// Renders the rich text volunteers write in Keystatic (event descriptions,
// staff bios, announcements) so the live page matches the editor: bold,
// headings, links, lists and images all come out as real elements.
//
// SAFETY: this walks the markdown syntax tree and returns React elements
// directly. It never assembles an HTML string, so there is nothing to
// sanitize and no `dangerouslySetInnerHTML` — React escapes every text node.
// The two things markdown can smuggle in are handled explicitly below:
// raw `html` nodes are dropped, and link/image URLs go through `safeUrl`.

/** URL schemes we're willing to put in an href or src. */
const SAFE_SCHEME = /^(?:https?:|mailto:|tel:)/i;

/**
 * Returns the URL if it's safe to emit, otherwise null. Blocks `javascript:`,
 * `data:` and friends — cheap insurance, since anyone who can edit content
 * could otherwise plant a script URL in an ordinary-looking link.
 */
function safeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Site-relative links and same-page anchors.
  if (/^[/#?]/.test(trimmed) && !trimmed.startsWith("//")) return trimmed;
  return SAFE_SCHEME.test(trimmed) ? trimmed : null;
}

/** Where Keystatic drops images pasted into a rich-text field. */
const CONTENT_IMAGE_PREFIX = "/images/content/";

/**
 * An image from the CMS.
 *
 * `next/image` needs the real pixel dimensions to reserve space and to resize
 * the file — and the markdown only gives us a URL. For images in the folder
 * Keystatic writes to, a dynamic import gets us the intrinsic width, height
 * and blur placeholder (the pattern Next documents for CMS images), which
 * matters here: these headshots are 1.4 MB PNGs straight off a phone.
 * Anything else — a hand-written path, an external URL — falls back to a
 * plain img, which still displays correctly, just unoptimized.
 */
async function ContentImage({ src, alt }: { src: string; alt: string }) {
  const imported = await importContentImage(src);
  if (imported) {
    return (
      <Image
        src={imported}
        alt={alt}
        sizes="(max-width: 640px) 50vw, 320px"
        className="h-auto w-full rounded-lg"
      />
    );
  }
  // No intrinsic dimensions available, so next/image can't be used here.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className="h-auto w-full rounded-lg" />;
}

/**
 * Resolves a CMS image URL to its static import, which carries the real
 * width, height and blur placeholder. Returns null for anything that isn't a
 * file sitting in the rich-text image folder — an external URL, or a path
 * left over from before the content moved.
 */
async function importContentImage(src: string): Promise<StaticImageData | null> {
  if (!src.startsWith(CONTENT_IMAGE_PREFIX)) return null;
  const file = decodeURIComponent(src.slice(CONTENT_IMAGE_PREFIX.length));
  // Guard the import path: stay inside the images folder.
  if (file.includes("/") || file.includes("..")) return null;
  try {
    return (await import(`@/public/images/content/${file}`)).default;
  } catch {
    // Renamed or removed since the content was written.
    return null;
  }
}

const HEADING_CLASS: Record<number, string> = {
  2: "mt-8 text-2xl font-bold text-slate-900",
  3: "mt-6 text-xl font-bold text-slate-900",
  4: "mt-6 text-lg font-bold text-slate-900",
  5: "mt-4 text-base font-bold text-slate-900",
  6: "mt-4 text-sm font-bold uppercase tracking-wide text-slate-900",
};

function renderAll(nodes: RootContent[]): ReactNode[] {
  return nodes.map((node, i) => renderNode(node, i));
}

function renderNode(node: RootContent, key: number): ReactNode {
  switch (node.type) {
    case "paragraph": {
      // A paragraph holding nothing but images is a picture row — the three
      // speaker headshots on the Bible Conference page. Lay it out as a grid
      // instead of a line of text so it looks like it does in the editor.
      const images = node.children.filter((c) => c.type === "image");
      const isGallery =
        images.length > 0 &&
        node.children.every(
          (c) => c.type === "image" || (c.type === "text" && !c.value.trim())
        );
      if (isGallery) {
        return (
          <div
            key={key}
            className={`mt-4 grid gap-4 ${
              images.length === 1
                ? "grid-cols-1"
                : images.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2 sm:grid-cols-3"
            }`}
          >
            {renderAll(images)}
          </div>
        );
      }
      return (
        <p key={key} className="mt-4 text-slate-700">
          {renderAll(node.children)}
        </p>
      );
    }

    case "heading": {
      const depth = Math.min(Math.max(node.depth, 2), 6) as 2 | 3 | 4 | 5 | 6;
      // Content headings start at h2: the page title already owns the h1.
      const Tag = `h${depth}` as const;
      return (
        <Tag key={key} className={HEADING_CLASS[depth]}>
          {renderAll(node.children)}
        </Tag>
      );
    }

    case "text":
      return node.value;

    case "strong":
      return (
        <strong key={key} className="font-bold text-slate-900">
          {renderAll(node.children)}
        </strong>
      );

    case "emphasis":
      return <em key={key}>{renderAll(node.children)}</em>;

    case "delete":
      return <del key={key}>{renderAll(node.children)}</del>;

    case "inlineCode":
      return (
        <code key={key} className="rounded bg-slate-100 px-1 py-0.5 text-sm">
          {node.value}
        </code>
      );

    case "code":
      return (
        <pre key={key} className="mt-4 overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm">
          <code>{node.value}</code>
        </pre>
      );

    case "link": {
      const href = safeUrl(node.url);
      // Unsafe scheme: keep the words, drop the link.
      if (!href) return <span key={key}>{renderAll(node.children)}</span>;
      const className = "font-semibold text-brand-600 underline hover:text-brand-700";
      if (href.startsWith("/")) {
        return (
          <Link key={key} href={href} className={className}>
            {renderAll(node.children)}
          </Link>
        );
      }
      const external = /^https?:/i.test(href);
      return (
        <a
          key={key}
          href={href}
          className={className}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {renderAll(node.children)}
        </a>
      );
    }

    case "image": {
      const src = safeUrl(node.url);
      if (!src) return null;
      return <ContentImage key={key} src={src} alt={node.alt ?? ""} />;
    }

    case "list": {
      const Tag = node.ordered ? "ol" : "ul";
      return (
        <Tag
          key={key}
          className={`mt-4 space-y-1 pl-6 text-slate-700 ${
            node.ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {renderAll(node.children)}
        </Tag>
      );
    }

    case "listItem":
      return (
        <li key={key} className="[&>p]:mt-0">
          {renderAll(node.children)}
        </li>
      );

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="mt-4 border-l-4 border-slate-200 pl-4 italic text-slate-600"
        >
          {renderAll(node.children)}
        </blockquote>
      );

    case "thematicBreak":
      return <hr key={key} className="mt-8 border-slate-200" />;

    case "break":
      return <br key={key} />;

    case "table":
      return (
        <div key={key} className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-slate-700">
            <tbody>{renderAll(node.children)}</tbody>
          </table>
        </div>
      );

    case "tableRow":
      return (
        <tr key={key} className="border-b border-slate-200">
          {renderAll(node.children)}
        </tr>
      );

    case "tableCell":
      return (
        <td key={key} className="px-3 py-2">
          {renderAll(node.children)}
        </td>
      );

    // Raw HTML in the source is dropped rather than trusted — rendering it
    // would mean injecting unsanitized markup. The editor can't produce it.
    case "html":
      return null;

    default:
      return null;
  }
}

/**
 * Renders Keystatic rich-text source.
 *
 * `className` styles the wrapper; the first block's top margin is removed so
 * it sits flush with whatever comes above it.
 */
export default function RichText({
  source,
  className = "",
}: {
  source: string;
  className?: string;
}) {
  const tree = parseRichText(source);
  if (tree.children.length === 0) return null;
  return (
    <div className={`${className} [&>*:first-child]:mt-0`}>
      {renderAll(tree.children)}
    </div>
  );
}
