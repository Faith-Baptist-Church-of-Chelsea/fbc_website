import SiteChrome from "@/components/SiteChrome";

// Spanish route group: same header/footer/banner/bubble as the rest of the
// site, in Spanish. Links still lead to the English pages — the labels tell
// a Spanish speaker what's behind them. `lang` here overrides the document's
// lang="en" for screen readers and translation tools.
export default function SpanishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div lang="es" className="contents">
      <SiteChrome locale="es">{children}</SiteChrome>
    </div>
  );
}
