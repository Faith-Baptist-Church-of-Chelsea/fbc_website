import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import RichText from "@/components/RichText";
import LiteYouTube from "@/components/LiteYouTube";
import Photo from "@/components/Photo";
import ContactForm from "@/components/ContactForm";
import { FaqJsonLd } from "@/components/JsonLd";
import { richTextToPlainText, safeUrl } from "@/lib/richtext";
import type { PageSection } from "@/lib/pages";
import site from "@/content/site.json";
import sof from "@/content/statement-of-faith.json";

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
      const { heading, body, tint } = section.value;
      return (
        <section className={`px-4 py-10 ${tint ? "bg-slate-50" : ""}`}>
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
      const { heading, body, image, imageSide, tint } = section.value;
      return (
        <section className={`px-4 py-10 ${tint ? "bg-slate-50" : ""}`}>
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

    case "highlight": {
      const { eyebrow, heading, body, look } = section.value;
      const soft = look === "soft";
      return (
        <section className="px-4 py-10">
          <div
            className={`mx-auto rounded-2xl ${
              soft ? "max-w-2xl bg-slate-50 p-6" : "max-w-4xl bg-brand-500 p-8 text-white sm:p-10"
            }`}
          >
            {eyebrow && (
              <p className={`text-sm font-semibold uppercase tracking-wider ${soft ? "text-brand-700" : "text-sky-100"}`}>
                {eyebrow}
              </p>
            )}
            {heading && (
              <h2 className={`mt-2 text-2xl font-bold sm:text-3xl ${soft ? "text-slate-900" : ""}`}>
                {heading}
              </h2>
            )}
            <RichText
              source={body}
              className={
                soft
                  ? "[&_p]:text-slate-700 [&_strong]:text-slate-900"
                  : "mt-4 max-w-2xl [&_p]:text-sky-50 [&_a]:text-white [&_strong]:text-white"
              }
            />
          </div>
        </section>
      );
    }

    case "cards": {
      const { heading, cards, tint } = section.value;
      return (
        <section className={`px-4 py-10 ${tint ? "bg-slate-50" : ""}`}>
          <div className="mx-auto max-w-4xl">
            {heading && (
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{heading}</h2>
            )}
            <div className={`grid gap-4 sm:grid-cols-2 ${heading ? "mt-8" : ""}`}>
              {cards.map((c, i) => (
                <div key={i} className={`rounded-xl p-5 ${tint ? "bg-white shadow-sm" : "bg-slate-50"}`}>
                  {c.eyebrow && (
                    <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{c.eyebrow}</p>
                  )}
                  {c.title && <p className="mt-1 text-lg font-bold text-slate-900">{c.title}</p>}
                  <RichText source={c.body} className="mt-1 [&_p]:text-sm [&_p]:text-slate-600 [&_p]:mt-1" />
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "faq": {
      const { googleResults, items, tint } = section.value;
      return (
        <section className={`px-4 py-10 ${tint ? "bg-slate-50" : ""}`}>
          {googleResults && (
            <FaqJsonLd
              faqs={items.map((i) => ({ q: i.question, a: richTextToPlainText(i.answer) }))}
            />
          )}
          <div className="mx-auto max-w-3xl space-y-12">
            {items.map((item, i) => (
              <div key={i}>
                <h2 className="text-2xl font-bold text-slate-900">{item.question}</h2>
                <RichText source={item.answer} className="mt-3" />
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "gallery": {
      const { heading, photos } = section.value;
      return (
        <section className="bg-slate-50 px-4 py-14">
          <div className="mx-auto max-w-5xl">
            {heading && (
              <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">{heading}</h2>
            )}
            <div
              className={`grid gap-6 ${photos.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} ${heading ? "mt-8" : ""}`}
            >
              {photos.map((p, i) =>
                p.image ? (
                  <figure key={i}>
                    <PagePhoto src={p.image} alt={p.caption || "Photo"} sizes="(max-width: 640px) 100vw, 320px" />
                    {p.caption && (
                      <figcaption className="mt-2 text-sm text-slate-600">{p.caption}</figcaption>
                    )}
                  </figure>
                ) : null
              )}
            </div>
          </div>
        </section>
      );
    }

    case "timeline": {
      const { heading, intro, steps, tint } = section.value;
      return (
        <section className={`px-4 py-10 ${tint ? "bg-slate-50" : ""}`}>
          <div className="mx-auto max-w-2xl">
            {heading && (
              <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">{heading}</h2>
            )}
            {intro && <p className="mt-3 text-center text-slate-600">{intro}</p>}
            <ol className="mt-10 space-y-0">
              {steps.map((step, i) => (
                <li key={i} className="relative flex gap-5 pb-8 last:pb-0">
                  {i < steps.length - 1 && (
                    <span aria-hidden="true" className="absolute left-[2.15rem] top-10 h-full w-0.5 bg-slate-200" />
                  )}
                  <span className="z-10 flex h-[4.3rem] w-[4.3rem] shrink-0 items-center justify-center rounded-full bg-slate-900 font-display text-lg text-white">
                    {step.label}
                  </span>
                  <p className="pt-5 text-slate-700">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      );
    }

    case "staffGrid":
      return <StaffSection heading={section.value.heading} />;

    case "statementOfFaith": {
      const { heading, intro } = section.value;
      return (
        <section id="statement-of-faith" className="scroll-mt-20 px-4 py-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{heading}</h2>
            {intro && <p className="mt-3 text-slate-600">{intro}</p>}
            <div className="mt-8 space-y-10">
              {sof.sections
                .filter((s) => s.body.length > 0)
                .map((s) => (
                  <div key={s.title}>
                    <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                    {s.body.map((p, i) => (
                      <p key={i} className="mt-3 text-slate-700">
                        {p}
                      </p>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </section>
      );
    }

    case "serviceTimes": {
      const { note, whereNote } = section.value;
      return (
        <section className="px-4 py-10">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-8">
              <h2 className="text-xl font-bold text-slate-900">When we meet</h2>
              <ul className="mt-4 space-y-3">
                {site.services.map((s) => (
                  <li
                    key={`${s.day}-${s.time}`}
                    className="flex justify-between gap-4 border-b border-slate-200 pb-2 text-slate-700 last:border-0"
                  >
                    <span>
                      {s.day} — {s.name}
                    </span>
                    <span className="font-semibold text-slate-900">{s.time}</span>
                  </li>
                ))}
              </ul>
              {note && <p className="mt-4 text-slate-600">{note}</p>}
            </div>
            <div className="rounded-xl bg-slate-50 p-8">
              <h2 className="text-xl font-bold text-slate-900">Where we are</h2>
              <p className="mt-4 text-slate-700">
                <a href={site.address.mapsUrl} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                  {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}
                </a>
              </p>
              <p className="mt-2 text-slate-600">
                Just off {site.address.directionsNote} — a few minutes from downtown Chelsea.
              </p>
              {whereNote && <p className="mt-4 text-slate-600">{whereNote}</p>}
            </div>
          </div>
        </section>
      );
    }

    case "mapHours": {
      const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
        `${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`
      )}&output=embed`;
      return (
        <section className="bg-slate-50 px-4 py-14">
          <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl">
              <iframe
                src={mapSrc}
                title={`Map to ${site.name}, ${site.address.street}, ${site.address.city}`}
                className="h-80 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Office hours</h2>
              <ul className="mt-4 space-y-2">
                {site.officeHours.map((h) => (
                  <li
                    key={h.days}
                    className="flex justify-between gap-4 border-b border-slate-200 pb-2 text-slate-700"
                  >
                    <span>{h.days}</span>
                    <span className="font-semibold text-slate-900">{h.hours}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-slate-600">
                {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip} —{" "}
                {site.address.directionsNote}.
              </p>
              <a
                href={site.address.mapsUrl}
                className="mt-3 inline-block font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </section>
      );
    }

    case "contactForm":
      return (
        <section className="px-4 py-10">
          <div className="mx-auto max-w-2xl">
            <ContactForm initialKind={section.value.kind} />
            {section.value.note && (
              <p className="mt-4 text-sm text-slate-500">{section.value.note}</p>
            )}
          </div>
        </section>
      );

    case "embed": {
      const { url, heightRem, title, fallbackLabel, fallbackLink } = section.value;
      const src = safeUrl(url);
      if (!src || !src.startsWith("https://")) return null;
      const fallbackHref = safeUrl(fallbackLink);
      return (
        <section className="px-4 py-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <iframe
                src={src}
                title={title || "Embedded form"}
                className="w-full border-0"
                style={{ height: `${heightRem}rem` }}
                loading="lazy"
              />
            </div>
            {fallbackLabel && fallbackHref && (
              <p className="mt-3 text-sm text-slate-500">
                Form not loading?{" "}
                <a href={fallbackHref} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                  {fallbackLabel}
                </a>
              </p>
            )}
          </div>
        </section>
      );
    }

    case "signupFeature":
      return <SignupFeature {...section.value} />;

    default:
      return null;
  }
}

/** Staff grid, filled from the Staff & Leaders collection. */
async function StaffSection({ heading }: { heading: string }) {
  const { getStaff, reader } = await import("@/lib/content");
  const staff = await getStaff();
  const bios = await Promise.all(
    staff.map(async ({ slug }) => {
      const entry = await reader.collections.staff.read(slug);
      return entry ? await entry.bio() : "";
    })
  );
  return (
    <section className="bg-slate-50 px-4 py-14">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">{heading}</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {staff.map(({ slug, entry }, i) => (
            <div key={slug} className="flex gap-5 rounded-xl bg-white p-6 shadow-sm">
              <div className="w-28 shrink-0">
                <Photo
                  src={entry.photo ?? `/images/staff/${slug}.jpg`}
                  alt={`${entry.name}, ${entry.role}`}
                  width={300}
                  height={300}
                  className="aspect-square"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{entry.name}</h3>
                <p className="text-sm font-semibold text-brand-700">{entry.role}</p>
                <RichText
                  source={bios[i]}
                  className="mt-2 text-sm text-slate-600 [&>p]:mt-2 [&>p]:text-slate-600"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Dark spotlight card for an open Planning Center registration. */
async function SignupFeature({
  keyword,
  eyebrow,
  fallbackTitle,
  fallbackText,
  registerLabel,
  fallbackRegisterLink,
  secondaryLabel,
  secondaryLink,
}: {
  keyword: string;
  eyebrow: string;
  fallbackTitle: string;
  fallbackText: string;
  registerLabel: string;
  fallbackRegisterLink: string;
  secondaryLabel: string;
  secondaryLink: string;
}) {
  const { getUpcomingSignups } = await import("@/lib/pco");
  const { htmlToParagraphs } = await import("@/lib/html");
  const needle = keyword.trim().toLowerCase();
  const signup = needle
    ? (await getUpcomingSignups()).find((s) => s.name.toLowerCase().includes(needle))
    : undefined;
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Detroit",
  });
  const registerHref = safeUrl(signup?.registrationUrl ?? fallbackRegisterLink);
  const secondaryHref = safeUrl(secondaryLink);
  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-slate-900 text-white">
        {signup?.logoUrl && (
          /* eslint-disable-next-line @next/next/no-img-element --
             remote Planning Center image with unknown dimensions */
          <img src={signup.logoUrl} alt="" className="max-h-80 w-full bg-slate-950 object-contain" loading="lazy" />
        )}
        <div className="p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-400">
            {eyebrow}
            {signup?.startsAt ? ` · ${dateFmt.format(new Date(signup.startsAt))}` : ""}
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{signup?.name ?? fallbackTitle}</h2>
          {signup?.description ? (
            htmlToParagraphs(signup.description).map((p, i) => (
              <p key={i} className="mt-4 max-w-2xl text-slate-300">
                {p}
              </p>
            ))
          ) : (
            <p className="mt-4 max-w-2xl text-slate-300">{fallbackText}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-4">
            {(!signup || !signup.atCapacity) && registerHref && registerLabel && (
              <a
                href={registerHref}
                className="rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
              >
                {registerLabel}
              </a>
            )}
            {secondaryLabel && secondaryHref && (
              <a
                href={secondaryHref}
                className="rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                {secondaryLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
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
