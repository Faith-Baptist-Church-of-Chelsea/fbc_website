import Link from "next/link";
import site from "@/content/site.json";

// Site-wide footer, kept deliberately light: service times, address/contact,
// and a short list of the links people actually look for. The full page list
// lives in the header menu — repeating all of it here just adds noise.
const quickLinks = [
  { label: "Plan Your Visit", href: "/plan-your-visit" },
  { label: "Common Questions", href: "/common-questions" },
  { label: "Sermons", href: "/sermons" },
  { label: "Events", href: "/events" },
  { label: "Give", href: "/give" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Service Times
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {site.services.map((s) => (
              <li key={`${s.day}-${s.time}`}>
                <span className="font-medium text-white">
                  {s.day} {s.time}
                </span>{" "}
                — {s.name}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Find Us
          </h2>
          <address className="mt-4 space-y-2 text-sm not-italic">
            <p>
              <a href={site.address.mapsUrl} className="hover:text-white">
                {site.address.street}
                <br />
                {site.address.city}, {site.address.state} {site.address.zip}
              </a>
            </p>
            <p className="text-slate-400">{site.address.directionsNote}</p>
            <p>
              <a href={`tel:${site.phone.replace(/\D/g, "")}`} className="hover:text-white">
                {site.phone}
              </a>
            </p>
          </address>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Quick Links
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} {site.name} of Chelsea — an
            independent Baptist church in Chelsea, Michigan. Expository
            preaching, KJV, and a warm welcome.
          </p>
          <p className="flex gap-5 text-xs">
            <a href={site.social.facebook} className="text-slate-400 hover:text-white">
              Facebook
            </a>
            <a href={site.social.instagram} className="text-slate-400 hover:text-white">
              Instagram
            </a>
            <a href={site.social.youtube} className="text-slate-400 hover:text-white">
              YouTube
            </a>
            <a href={site.links.churchCenter} className="text-slate-400 hover:text-white">
              Church Center
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
