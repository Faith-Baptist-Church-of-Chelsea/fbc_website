// One nav structure shared by the header, mobile menu, footer, and 404 page.
// Add or reorder pages here, not in the components.

export type NavLink = { label: string; href: string };
export type NavGroup = { label: string; links: NavLink[] };

export const ministries: NavGroup = {
  label: "Ministries",
  links: [
    { label: "Family School", href: "/family-school" },
    { label: "FBC Kids", href: "/fbc-kids" },
    { label: "Youth Group", href: "/youth-group" },
    { label: "Young Adults", href: "/young-adults" },
    { label: "Special Music", href: "/special-music" },
  ],
};

// Top-level links shown in the desktop header (Ministries renders as a dropdown).
export const primaryLinks: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Sermons", href: "/sermons" },
  { label: "Events", href: "/events" },
  { label: "Missions", href: "/missions" },
  { label: "Give", href: "/give" },
  { label: "Contact", href: "/contact" },
];

// The single most important link on the site — rendered as a button.
export const planYourVisit: NavLink = {
  label: "Plan Your Visit",
  href: "/plan-your-visit",
};

// Shown in the footer (and the mobile menu) but not the desktop bar.
export const secondaryLinks: NavLink[] = [
  { label: "Common Questions", href: "/common-questions" },
  { label: "Church Center App", href: "/church-center-app" },
];
