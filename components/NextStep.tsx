import Link from "next/link";

// Every page ends with a natural next click — never a dead end.
export default function NextStep({
  title,
  text,
  primary,
  secondary,
}: {
  title: string;
  text?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  const external = (href: string) => href.startsWith("http");
  return (
    <section className="bg-slate-900 px-4 py-14 text-center text-white">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        {text && <p className="mt-3 text-lg text-slate-300">{text}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {external(primary.href) ? (
            <a
              href={primary.href}
              className="rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
            >
              {primary.label}
            </a>
          ) : (
            <Link
              href={primary.href}
              className="rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
            >
              {primary.label}
            </Link>
          )}
          {secondary &&
            (external(secondary.href) ? (
              <a
                href={secondary.href}
                className="rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                {secondary.label}
              </a>
            ) : (
              <Link
                href={secondary.href}
                className="rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                {secondary.label}
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
