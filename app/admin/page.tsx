import type { Metadata } from "next";
import Link from "next/link";
import AdminEditor from "@/components/AdminEditor";

export const metadata: Metadata = {
  title: "Website Admin",
  robots: { index: false, follow: false },
};

// The volunteer-friendly admin page: describe a change in plain English,
// review it, apply it. No website experience required. The password gate
// lives in the API route; this page is just the form.
export default function AdminPage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-4 py-14">
      <h1 className="text-3xl font-bold text-slate-900">Update the website</h1>
      <p className="mt-2 text-slate-600">
        Type what should change, in your own words. You&rsquo;ll see exactly
        what will change before anything goes live, and every change can be
        undone (ask Steven).
      </p>
      <div className="mt-8">
        <AdminEditor />
      </div>
      <div className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
        <p>
          Other tools:{" "}
          <Link href="/admin/health" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            integration health
          </Link>{" "}
          · <span className="font-mono">/keystatic</span> (structured editor,
          runs on Steven&rsquo;s computer)
        </p>
        <p className="mt-2">
          This editor changes church info, staff, and announcements. New pages,
          photos, and design changes still go through Steven.
        </p>
      </div>
    </main>
  );
}
