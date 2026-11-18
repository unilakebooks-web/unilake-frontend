"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PageFileInfoProps {
  kind: "artwork" | "mask";
  url: string | null;
  fileName: string | null;
  storedWidth?: number | null;
  storedHeight?: number | null;
}

// The file a page currently has: a small preview, its original file name and
// its size. The parent keys this on the file URL, so the measured size resets
// when the file is replaced.
export function PageFileInfo({
  kind,
  url,
  fileName,
  storedWidth,
  storedHeight,
}: PageFileInfoProps) {
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!url) {
    return (
      <p className="text-xs font-medium text-neutral-500">No {kind} uploaded</p>
    );
  }

  // Artwork size is stored; the mask size (and the size of older artwork) is
  // measured from the loaded image.
  const size =
    storedWidth && storedHeight
      ? { w: storedWidth, h: storedHeight }
      : measured;

  return (
    <div className="flex gap-3 min-w-0 rounded-xl border border-neutral-200 bg-white p-2">
      <div className="relative w-20 h-20 shrink-0 rounded-lg bg-neutral-100 overflow-hidden flex items-center justify-center">
        {failed ? (
          <ImageIcon
            className="w-6 h-6 text-neutral-400 opacity-50"
            aria-hidden
          />
        ) : (
          <>
            {!loaded && (
              <Skeleton className="absolute inset-0 rounded-lg pointer-events-none" />
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open current ${kind}`}
              className="w-full h-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Current ${kind}`}
                className="w-full h-full object-contain"
                onLoad={(e) => {
                  setLoaded(true);
                  setMeasured({
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  });
                }}
                onError={() => setFailed(true)}
              />
            </a>
          </>
        )}
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
        {fileName ? (
          <p
            title={fileName}
            className="text-xs font-semibold text-neutral-900 truncate"
          >
            {fileName}
          </p>
        ) : (
          <p className="text-xs font-medium text-neutral-500">
            File name not saved
          </p>
        )}
        <p className="text-[10px] text-neutral-500">
          {size
            ? `${size.w} x ${size.h} px`
            : failed
              ? "Size unknown"
              : "Reading size..."}
        </p>
        {failed && (
          <p className="text-[10px] text-neutral-500">
            Image could not be loaded
          </p>
        )}
      </div>
    </div>
  );
}
