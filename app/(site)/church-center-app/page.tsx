import type { Metadata } from "next";
import Image from "next/image";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Church Center App",
  description:
    "The Church Center app is Faith Baptist Church in your pocket — events, sign-ups, groups, directory, and check-in. Free on iPhone and Android.",
};

const features = [
  { title: "Events & sign-ups", text: "See what's coming and register in a couple of taps — no paper forms." },
  { title: "Faster kids check-in", text: "Pre-check your children from your phone and skip the line at the station." },
  { title: "Our missionaries", text: "Browse the missionaries we support, with updates from the field." },
  { title: "Directory & groups", text: "Find people, join groups, and stay connected between Sundays." },
];

export default function ChurchCenterApp() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Free · iPhone & Android"
        title="The Church Center App"
        intro="Most of our church family already lives in this app. If you're around Faith Baptist for more than a week or two, it's worth the two minutes it takes to set up."
      />

      {/* QR + store links */}
      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-4xl items-center gap-10 md:grid-cols-2">
          <div className="text-center">
            <Image
              src="/images/qr-churchcenter.png"
              alt="QR code — scan to open Faith Baptist Church on Church Center"
              width={400}
              height={400}
              className="mx-auto w-64 rounded-xl border border-slate-200 sm:w-80"
            />
            <p className="mt-3 font-semibold text-slate-900">
              Scan with your phone camera
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Get the app</h2>
            <p className="mt-3 text-slate-700">
              Download Church Center, search for{" "}
              <span className="font-semibold text-slate-900">
                Faith Baptist Church, Chelsea MI
              </span>{" "}
              (or scan the QR code and skip the search), and you&rsquo;re in.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={site.links.appStoreChurchCenter}
                className="rounded-lg bg-slate-900 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-slate-800"
              >
                 App Store
              </a>
              <a
                href={site.links.googlePlayChurchCenter}
                className="rounded-lg bg-slate-900 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-slate-800"
              >
                ▶ Google Play
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            What you&rsquo;ll actually use it for
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Photo
              src="/images/church-center-screenshots.png"
              alt="Screenshots of the Church Center app showing events and check-in"
              width={1600}
              height={900}
            />
          </div>
        </div>
      </section>

      <NextStep
        title="Prefer a browser?"
        text="Everything in the app also works at our Church Center website."
        primary={{ label: "Open Church Center", href: site.links.churchCenter }}
        secondary={{ label: "Back to planning a visit", href: "/plan-your-visit" }}
      />
    </main>
  );
}
