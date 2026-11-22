"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SharedBook } from "@/app/types/share";
import { API_BASE } from "@/components/share/shareUrl";
import { firstName } from "@/lib/shareTitle";
import { comicHref } from "@/lib/comicUrl";

// The view-only viewer of a shared book (feature 14). Makes no request of its own except the page images: no
// auth, no polling, no hooks that call the API. Plain <img> on purpose: next/image would let Vercel cache the
// pictures of a book whose share was stopped.
const RETRY_DELAY_MS = 1500;

function SharedPageImage({ src, alt, eager }: { src: string; alt: string; eager: boolean }) {
  const retried = useRef(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div className="w-full aspect-[4/3] rounded-2xl bg-white border border-[#914A8C]/15 flex items-center justify-center px-4 text-center text-sm text-neutral-500">
        This page could not be loaded
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={(e) => {
        // One retry after a short wait (a cold backend or a slow network), then the fallback tile.
        if (retried.current) {
          setFailed(true);
          return;
        }
        retried.current = true;
        const img = e.currentTarget;
        setTimeout(() => {
          img.src = src;
        }, RETRY_DELAY_MS);
      }}
      className={`block w-full h-auto rounded-2xl bg-white shadow-sm ${loaded ? "" : "min-h-40"}`}
    />
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-neutral-600 text-center">{children}</p>;
}

export default function SharedBookViewer({ token, book }: { token: string; book: SharedBook }) {
  const { comic, childName, pages, lockedCount, ready, complete } = book;
  const showPages = ready && pages.length > 0;

  return (
    <div className="min-h-screen bg-[#FFF8EE] flex flex-col">
      <header className="w-full bg-[#914A8C] shadow-md px-4 py-3 flex items-center justify-center sm:justify-start sm:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/assets/home_page/logoImg.png"
            alt="UniLake Logo"
            width={170}
            height={60}
            style={{ width: "auto", height: "auto" }}
            priority
            className="h-10 w-auto"
          />
        </Link>
      </header>

      <main className="flex-1 w-full max-w-[720px] mx-auto px-4 py-6 sm:py-10 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 break-words">{comic.title}</h1>
          {firstName(childName) && (
            <p className="text-base text-neutral-600 mt-1 break-words">for {firstName(childName)}</p>
          )}
        </div>

        {showPages ? (
          <>
            {pages.map((p, i) => (
              <SharedPageImage
                key={p.pageNumber}
                src={`${API_BASE}/api/public/shares/${token}/pages/${p.pageNumber}/image`}
                alt={`Page ${p.pageNumber} of ${comic.title}`}
                eager={i === 0}
              />
            ))}
            {lockedCount > 0 ? (
              <Notice>
                {lockedCount} more {lockedCount === 1 ? "page is" : "pages are"} in the full book.
              </Notice>
            ) : (
              !complete && <Notice>Some pages are still being prepared.</Notice>
            )}
          </>
        ) : (
          <div className="bg-white rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8 text-center">
            <h2 className="text-lg font-bold text-neutral-900">This book is still being made</h2>
            <p className="text-sm text-neutral-600 mt-2">Please check back a little later.</p>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href={comicHref(comic)}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#914A8C] hover:bg-[#7d3f79] text-white font-semibold px-6"
          >
            Make your own book
          </Link>
        </div>
      </main>

      <footer className="w-full px-4 py-6 text-center text-xs text-neutral-500">
        Made with Unilake Kids
      </footer>
    </div>
  );
}
