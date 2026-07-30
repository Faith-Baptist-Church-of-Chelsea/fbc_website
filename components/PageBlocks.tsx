import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import RichText from "@/components/RichText";
import LiteYouTube from "@/components/LiteYouTube";
import { safeUrl } from "@/lib/richtext";
import type { PageSection } from "@/lib/pages";

// Renders the section stack of a build-your-own page (the "Pages"
// collection in /keystatic). Each block becomes its own <section>, so
// ScrollReveal animates them one by one as the visitor scrolls — same
// feel as the hand-built pages.

/**
 * Keystatic stores block photos under a nested per-field path, e.g.
 * public/images/pages/<page>/sections/2/value/image.png. A static import
 * gets next/image the real dimensions and blur placeholder, so a volunteer
 * can upload a phone photo without shipping 4 MB to visitors.
 */
async function importPageImage(src: string): Promise<StaticImageData | null> {
  const PREFIX = "/images/pages/";
  if (!src.startsWith(PREFIX)) return null;
  const file = decodeURIComponent(src.slice(PREFIX.length));
  // Any depth Keystatic wants, but nothing that walks out of the directory.
  if (file.split("/").some((part) => part === "" || part === "." || part === "..")) return null;
  try {
    return (await import(`@/public/images/pages/${file}`)).default;
  } catch {
    return null;
  }
}

async function PagePhoto({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  const imported = await importPageImage(src);
  if (imported) {
    return (
      <Image
        src={imported}
        alt={alt}
        sizes={sizes}
        className="h-auto w-full rounded-2xl shadow-lg"
      />
    );
  }
  // Fallback for a file the build couldn't resolve (renamed, external).
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className="h-auto w-full rounded-2xl shadow-lg" />;
}

/** Pulls the video id out of any normal YouTube link. */
function youTubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (!/(^|\.)youtube(-nocookie)?\.com$|(^|\.)youtu\.be$/.test(u.hostname)) return null;
    if (u.hostname.endsWith("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function BlockButton({
  label,
  link,
  style,
}: {
  label: string;
  link: string;
  style: "primary" | "secondary";
}) {
  const href = safeUrl(link);
  if (!href || !label) return null;
  const className =
    style === "primary"
      ? "hover-lift rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
      : "rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50";
  return href.startsWith("/") ? (
    <Link href={href} className={className}>
      {label}
    </Link>
  ) : (
    <a href={href} className={className}>
      {label}
    </a>
  );
}

function Section({ section, index }: { section: PageSection; index: number }) {
  switch (section.discriminant) {
    case "text": {
      const { heading, body } = section.value;
      return (
        <section className="px-4 py-10">
          <div className="mx-auto max-w-3xl">
            {heading && (
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{heading}</h2>
            )}
            <RichText source={body} className={heading ? "mt-4" : ""} />
          </div>
        </section>
      );
    }

    case "imageText": {
      const { heading, body, image, imageSide } = section.value;
      return (
        <section className="px-4 py-10">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
            <div className={imageSide === "left" ? "md:order-2" : ""}>
              {heading && (
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{heading}</h2>
              )}
              <RichText source={body} className={heading ? "mt-4" : ""} />
            </div>
            {image && (
              <div className={imageSide === "left" ? "md:order-1" : ""}>
                <PagePhoto
                  src={image}
                  alt={heading || "Photo"}
                  sizes="(max-width: 768px) 100vw, 480px"
                />
              </div>
            )}
          </div>
        </section>
      );
    }

    case "image": {
      const { image, caption } = section.value;
      if (!image) return null;
      return (
        <section className="px-4 py-10">
          <figure className="mx-auto max-w-4xl">
            <PagePhoto src={image} alt={caption || "Photo"} sizes="(max-width: 896px) 100vw, 896px" />
            {caption && (
              <figcaption className="mt-3 text-center text-sm text-slate-500">{caption}</figcaption>
            )}
          </figure>
        </section>
      );
    }

    case "buttons":
      return (
        <section className="px-4 py-6">
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-4">
            {section.value.buttons.map((b, i) => (
              <BlockButton key={i} {...b} />
            ))}
          </div>
        </section>
      );

    case "video": {
      const id = youTubeId(section.value.url);
      if (!id) return null;
      return (
        <section className="px-4 py-10">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl shadow-lg">
            <LiteYouTube videoId={id} title={`Video ${index + 1}`} />
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}

export default function PageBlocks({ sections }: { sections: readonly PageSection[] }) {
  return (
    <>
      {sections.map((s, i) => (
        <Section key={i} section={s} index={i} />
      ))}
    </>
  );
}
