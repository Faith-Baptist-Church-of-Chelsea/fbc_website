import Link from "next/link";
import site from "@/content/site.json";
import SubscribeForm from "@/components/SubscribeForm";

// Simple monochrome footer icons (currentColor, so hover states just work).
// Facebook/Instagram/YouTube are the recognizable brand shapes; Sermon
// Audio and Church Center don't have a universally known mark, so they're
// deliberately generic (headphones / app grid) rather than an imitation.
function FacebookIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">
        f
      </text>
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}
function YouTubeIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <polygon points="10,8.5 16,12 10,15.5" fill="currentColor" />
    </svg>
  );
}
function HeadphonesIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" fill="currentColor" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" fill="currentColor" />
    </svg>
  );
}
function AppGridIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.8" fill="currentColor" />
      <rect x="14" y="3" width="7" height="7" rx="1.8" fill="currentColor" />
      <rect x="3" y="14" width="7" height="7" rx="1.8" fill="currentColor" />
      <rect x="14" y="14" width="7" height="7" rx="1.8" fill="currentColor" />
    </svg>
  );
}

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

// extraLinks: menu entries from volunteer-created pages ("Pages" in
// /keystatic set to "Footer links") — passed in by the layout.
export default function Footer({ extraLinks = [] }: { extraLinks?: { label: string; href: string }[] }) {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              This Week at Faith
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              One email every Monday — that week&rsquo;s events and the latest message.
            </p>
          </div>
          <SubscribeForm dark />
        </div>
      </div>
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
            {[...quickLinks, ...extraLinks].map((l) => (
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
            © {new Date().getFullYear()} {site.name}
          </p>
          <p className="flex items-center gap-4">
            <a href={site.social.facebook} aria-label="Facebook" className="text-slate-400 hover:text-white">
              <FacebookIcon />
            </a>
            <a href={site.social.instagram} aria-label="Instagram" className="text-slate-400 hover:text-white">
              <InstagramIcon />
            </a>
            <a href={site.social.youtube} aria-label="YouTube" className="text-slate-400 hover:text-white">
              <YouTubeIcon />
            </a>
            {site.social.sermonAudio && (
              <a href={site.social.sermonAudio} aria-label="Sermon Audio" className="text-slate-400 hover:text-white">
                <HeadphonesIcon />
              </a>
            )}
            <a href={site.links.churchCenter} aria-label="Church Center app" className="text-slate-400 hover:text-white">
              <AppGridIcon />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
