"use client";

/**
 * Recommended lengths, shared by the site-settings, comic and blog SEO fields.
 *
 * These are the points at which Google typically truncates, NOT the maximums —
 * the validators allow 120 / 320 so that passing these stays a warning the
 * admin can knowingly ignore.
 */
export const SEO_TITLE_LIMIT = 60;
export const SEO_DESCRIPTION_LIMIT = 160;

interface CharCounterProps {
  value: string;
  /**
   * The point past which search engines start truncating. This is a WARNING
   * threshold, not a maximum — the admin can still save a longer value, and the
   * API accepts it. Google cuts titles around 60 characters and descriptions
   * around 160, but both are measured in pixels rather than characters, so a
   * hard limit here would be false precision.
   */
  limit: number;
}

/**
 * "42 / 60" counter that turns amber once the recommended length is passed.
 *
 * Shared by the site settings, comic and blog SEO fields so the warning
 * behaviour is defined once rather than three times.
 */
export function CharCounter({ value, limit }: CharCounterProps) {
  const count = value.trim().length;
  const isOver = count > limit;

  return (
    <span
      className={`text-xs font-medium tabular-nums ${
        isOver ? "text-amber-600" : "text-neutral-400"
      }`}
      // Announced only when it becomes a warning — a counter that reads itself
      // out on every keystroke is worse than silence for screen-reader users.
      aria-live={isOver ? "polite" : "off"}
    >
      {count} / {limit}
      {isOver && " — may be shortened by Google"}
    </span>
  );
}
