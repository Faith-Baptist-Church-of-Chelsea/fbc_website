import Link from "next/link";

// Temporary shell for pages that get their real content in phase 4.
// Keeps nav links from 404ing and gives each route its title/OG tags early.
export default function PageStub({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex-1">
      <section className="bg-slate-900 px-4 py-16 text-center text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
          {description}
        </p>
      </section>
      <section className="px-4 py-16 text-center">
        <p className="text-slate-600">
          This page is being built. In the meantime, we&rsquo;d love to see you
          in person.
        </p>
        <Link
          href="/plan-your-visit"
          className="mt-6 inline-block rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Plan Your Visit
        </Link>
      </section>
    </main>
  );
}
