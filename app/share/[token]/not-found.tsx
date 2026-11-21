import Link from "next/link";

// Shown for every dead link (unknown, stopped, expired) and says nothing about which it was.
export default function SharedBookNotFound() {
  return (
    <main className="min-h-screen bg-[#FFF8EE] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8 text-center">
        <h1 className="text-xl font-bold text-neutral-900">This book is no longer available</h1>
        <p className="text-sm text-neutral-600 mt-3">
          The link may have expired, or sharing was stopped.
        </p>
        <Link
          href="/comic"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#914A8C] hover:bg-[#7d3f79] text-white font-semibold px-6"
        >
          Make your own book
        </Link>
      </div>
    </main>
  );
}
