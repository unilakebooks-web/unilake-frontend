"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useComics } from "@/hooks/useComics";
import { ComicStatus, type ComicListItem } from "@/app/types/comic";

/** Same cap as the backend validator (featuredComicIds). */
export const MAX_FEATURED_COMICS = 6;

interface FeaturedComicsPickerProps {
  /** Chosen comic ids, in the order they are shown at the end of the post. */
  value: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
}

function Cover({ comic }: { comic: ComicListItem }) {
  const url = comic.coverThumbnailUrls?.[0];
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="h-12 w-9 rounded-md border border-gray-200 object-cover bg-gray-100 shrink-0"
    />
  ) : (
    <div className="h-12 w-9 rounded-md border border-gray-200 bg-gray-100 shrink-0" />
  );
}

/**
 * Up to six published books shown at the end of a post. Ordering uses up and down buttons rather than drag
 * and drop: six rows at most, and the buttons work with a keyboard and on a phone with no extra code.
 */
export function FeaturedComicsPicker({
  value,
  onChange,
  disabled,
}: FeaturedComicsPickerProps) {
  const { data: comics = [], isLoading, isError } = useComics();
  const [adding, setAdding] = useState("");

  // Only published, not retired books can be featured: the public API shows nothing else.
  const choosable = comics.filter(
    (c) => c.status === ComicStatus.PUBLISHED && !c.retiredAt
  );
  const byId = new Map(comics.map((c) => [c.id, c]));
  const available = choosable.filter((c) => !value.includes(c.id));
  const isFull = value.length >= MAX_FEATURED_COMICS;

  const move = (index: number, delta: number) => {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = (id: string) => {
    if (!id || value.includes(id) || isFull) return;
    onChange([...value, id]);
    setAdding("");
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
          <span>Featured Books (Optional)</span>
          <span className="text-xs font-medium text-gray-400">
            {value.length} / {MAX_FEATURED_COMICS}
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Published books linked at the end of the post, in this order. A book
          that is later unpublished is simply left out of the post.
        </p>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((id, index) => {
            const comic = byId.get(id);
            return (
              <li
                key={id}
                className="flex items-center gap-3 p-2 rounded-xl border border-gray-200 bg-gray-50"
              >
                {comic ? (
                  <Cover comic={comic} />
                ) : (
                  <div className="h-12 w-9 rounded-md border border-gray-200 bg-gray-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {comic ? comic.title : isLoading ? "Loading..." : "Book no longer available"}
                  </p>
                  {comic && comic.status !== ComicStatus.PUBLISHED && (
                    <p className="text-xs text-amber-600">
                      Not published, so it is hidden on the post.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={disabled || index === 0}
                    className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Move up"
                    aria-label={`Move ${comic?.title ?? "book"} up`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={disabled || index === value.length - 1}
                    className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Move down"
                    aria-label={`Move ${comic?.title ?? "book"} down`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((v) => v !== id))}
                    disabled={disabled}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                    title="Remove"
                    aria-label={`Remove ${comic?.title ?? "book"}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex gap-2">
        <select
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          disabled={disabled || isFull || isLoading || available.length === 0}
          aria-label="Choose a book to feature"
          className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#914A8C] focus:ring-2 focus:ring-[#914A8C]/20 disabled:opacity-50"
        >
          <option value="">
            {isFull
              ? "Maximum reached"
              : isLoading
                ? "Loading books..."
                : available.length === 0
                  ? "No more published books"
                  : "Choose a published book..."}
          </option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => add(adding)}
          disabled={disabled || !adding || isFull}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#914A8C] hover:bg-[#7a3e7e] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
      {isError && (
        <p className="text-xs text-red-600">Could not load the list of books.</p>
      )}
    </div>
  );
}
