// One nav structure shared by the header, mobile menu, footer, and 404 page.
// Add or reorder pages here, not in the components.

export type NavLink = { label: string; href: string; external?: boolean };
export type NavGroup = { label: string; links: NavLink[] };

// NOTE: Missions is not listed here — it's a CMS-built page now
// (content/pages/missions.yaml with menu: ministries), so it joins this
// dropdown through the layout. Custom pages append after these.
export const ministries: NavGroup = {
  label: "Ministries",
  links: [
    { label: "Family School", href: "/family-school" },
    { label: "FBC Kids", href: "/fbc-kids" },
    { label: "Youth Group", href: "/youth-group" },
    { label: "Young Adults", href: "/young-adults" },
    { label: "Special Music", href: "/special-music" },
    // Sibling ministries — separate organizations, separate websites.
    { label: "Throughly Furnished Ministries", href: "https://tfmchelsea.org/", external: true },
    { label: "Great Lakes Seedline", href: "https://glseedline.com/", external: true },
    { label: "Berean Armed Forces Ministries", href: "https://bereanarmedforcesministries.com/", external: true },
  ],
};

// Top-level links shown in the desktop header (Ministries renders as a dropdown).
export const primaryLinks: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Sermons", href: "/sermons" },
  { label: "Live", href: "/live" },
  { label: "Events", href: "/events" },
  { label: "Give", href: "/give" },
];

// The single most important link on the site — rendered as a button.
export const planYourVisit: NavLink = {
  label: "Plan Your Visit",
  href: "/plan-your-visit",
};

// Shown in the footer (and the mobile menu) but not the desktop bar.
export const secondaryLinks: NavLink[] = [
  { label: "Contact", href: "/contact" },
  { label: "Common Questions", href: "/common-questions" },
  { label: "Church Center App", href: "/church-center-app" },
];
