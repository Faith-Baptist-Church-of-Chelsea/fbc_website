import Link from "next/link";
import site from "@/content/site.json";
import {
  ministries,
  planYourVisit,
  primaryLinks,
  secondaryLinks,
} from "@/lib/nav";

// Site-wide footer: service times, address, contact, nav, socials.
// Everything factual comes from content/site.json.
export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
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
            <p>
              <a href={`mailto:${site.emails.office}`} className="hover:text-white">
                {site.emails.office}
              </a>
            </p>
          </address>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Pages
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[planYourVisit, ...primaryLinks, ...ministries.links, ...secondaryLinks].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Connect
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={site.social.facebook} className="hover:text-white">
                Facebook
              </a>
            </li>
            <li>
              <a href={site.social.instagram} className="hover:text-white">
                Instagram
              </a>
            </li>
            <li>
              <a href={site.social.youtube} className="hover:text-white">
                YouTube
              </a>
            </li>
            <li>
              <a href={site.links.churchCenter} className="hover:text-white">
                Church Center
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <p className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {site.name} of Chelsea ·{" "}
          {site.address.street}, {site.address.city}, {site.address.state}{" "}
          {site.address.zip}
        </p>
      </div>
    </footer>
  );
}
