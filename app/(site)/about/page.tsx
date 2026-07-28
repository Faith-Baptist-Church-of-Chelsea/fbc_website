import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import NextStep from "@/components/NextStep";
import { getStaff } from "@/lib/content";
import sof from "@/content/statement-of-faith.json";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The history, leadership, and beliefs of Faith Baptist Church of Chelsea, Michigan — established 1996, preaching the Bible expositionally.",
};

export default async function About() {
  const staff = await getStaff();

  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Who we are"
        title="An extremely friendly church that digs into the Word"
        intro="We preach the Bible in an expository style — working through the text rather than skimming over it — and we do it among people who will genuinely be glad you came."
      />

      {/* History */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Our story</h2>
          <p className="mt-4 text-slate-700">
            Faith Baptist Church was established in 1996 by the Whitaker family
            and a handful of others who wanted a Bible-preaching church in
            Chelsea. Pastor Adam Summers has led the congregation since 2008 —
            his wife Melody grew up in that founding family, saved at age five
            right here in Chelsea.
          </p>
          <p className="mt-4 text-slate-700">
            Nearly thirty years later we&rsquo;re still doing the same things:
            preaching through the Scriptures, singing together, supporting
            missionaries around the world, and welcoming whoever walks through
            the door.
          </p>
        </div>
      </section>

      {/* Staff */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Staff
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {staff.map(({ slug, entry }) => (
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
                  <StaffBio slug={slug} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statement of faith */}
      <section id="statement-of-faith" className="px-4 py-14 scroll-mt-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Statement of Faith
          </h2>
          <p className="mt-3 text-slate-600">
            This is what we believe, in full — not a summary. Take your time
            with it; it&rsquo;s worth knowing exactly where a church stands.
          </p>
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

      <NextStep
        title="The best way to know us is to meet us"
        text="Doctrine matters — and so does whether you're welcome. Come find out."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "Common Questions", href: "/common-questions" }}
      />
    </main>
  );
}

// Renders a staff member's bio as plain paragraphs. Keystatic's reader
// hands back the raw MDX source string; bios are simple prose, so we strip
// MDX comments and split on blank lines. Revisit if bios ever need rich
// formatting (bold, links).
async function StaffBio({ slug }: { slug: string }) {
  const { reader } = await import("@/lib/content");
  const entry = await reader.collections.staff.read(slug);
  if (!entry) return null;
  const source = await entry.bio();
  const paragraphs = source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "") // drop MDX comments (our TODOs)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return (
    <div className="mt-2 space-y-2 text-sm text-slate-600">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
