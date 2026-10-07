"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ContentHealth } from "@/app/types/stats";
import { cn } from "@/lib/utils";

/**
 * Is the public site correctly configured right now?
 *
 * Every row is a boolean with a link to the screen that fixes it. Not a chart —
 * booleans are not magnitudes.
 *
 * The How It Works row is the reason this panel exists. Its real publish rule
 * (active AND a video AND at least one step) is stricter than the `isActive`
 * toggle shown in its own editor, so a section can look live in admin and still
 * return null to the homepage. The backend evaluates the true rule; this just
 * displays the verdict, so the two can never drift.
 */

type Row = {
  label: string;
  ok: boolean;
  detail: string;
  href: string;
  /** false = informational; a warning here is not worth an amber flag. */
  blocking?: boolean;
};

function HealthRow({ row }: { row: Row }) {
  return (
    <Link
      href={row.href}
      className="flex items-start gap-2.5 py-2 group"
      title={row.detail}
    >
      {row.ok ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle
          className={cn(
            "w-4 h-4 shrink-0 mt-0.5",
            row.blocking ? "text-amber-600" : "text-neutral-400"
          )}
        />
      )}
      <div className="min-w-0">
        <div className="text-sm font-semibold text-neutral-900 group-hover:text-[#914A8C] transition-colors truncate">
          {row.label}
        </div>
        <div
          className={cn(
            "text-xs truncate",
            row.ok ? "text-neutral-500" : "text-amber-700"
          )}
        >
          {row.detail}
        </div>
      </div>
    </Link>
  );
}

export function StorefrontHealth({ health }: { health: ContentHealth }) {
  const { comics, homepage, content, legal, settings, countries } = health;

  const legalLive =
    [legal.privacyActive, legal.termsActive, legal.refundActive].filter(Boolean)
      .length;

  const rows: Row[] = [
    {
      label: "Published comics",
      ok: comics.published > 0,
      detail:
        comics.published > 0
          ? `${comics.published} live · ${comics.draft} draft`
          : "Nothing is published — the catalogue is empty",
      href: "/admin/comics",
      blocking: true,
    },
    {
      label: "Comic pricing",
      ok:
        comics.publishedMissingPricing === 0 &&
        comics.publishedWithIncompleteMrp === 0,
      detail:
        comics.publishedMissingPricing > 0
          ? `${comics.publishedMissingPricing} published comic(s) have no pricing at all`
          : comics.publishedWithIncompleteMrp > 0
            ? `${comics.publishedWithIncompleteMrp} published comic(s) have a rule with no MRP — the strike-through price won't show`
            : "Every published comic is priced",
      href: "/admin/comics",
      blocking: true,
    },
    {
      label: "Active countries",
      ok: countries.active > 0,
      detail:
        countries.active > 0
          ? `${countries.active} active`
          : "No active country — nobody can check out",
      href: "/admin/countries",
      blocking: true,
    },
    {
      label: "Hero slides",
      ok: homepage.activeHeroImages > 0,
      detail:
        homepage.activeHeroImages > 0
          ? `${homepage.activeHeroImages} active`
          : "No active slide — the homepage hero is empty",
      href: "/admin/hero-slides",
      blocking: true,
    },
    {
      label: "How It Works",
      ok: homepage.howItWorksReady,
      detail: homepage.howItWorksReady
        ? "Live on the homepage"
        : "Hidden — needs to be active, with a video and at least one step",
      href: "/admin/how-it-works",
      blocking: true,
    },
    {
      label: "Announcement bar",
      ok: homepage.activeAnnouncements > 0,
      detail:
        homepage.activeAnnouncements > 0
          ? `${homepage.activeAnnouncements} rotating`
          : "None active — the bar is hidden",
      href: "/admin/announcement-bar",
    },
    {
      label: "FAQs",
      ok: content.activeFaqsHome > 0 && content.activeFaqsComic > 0,
      detail: `${content.activeFaqsHome} on home · ${content.activeFaqsComic} on comic pages`,
      href: "/admin/faqs",
    },
    {
      label: "Legal pages",
      ok: legalLive === 3,
      detail:
        legalLive === 3
          ? "Privacy, terms and refund all published"
          : `${legalLive} of 3 published`,
      href: "/admin/pages",
      blocking: true,
    },
    {
      label: "Site settings",
      ok:
        settings.siteSettingsSaved &&
        settings.contactEmailSet &&
        settings.contactPhoneSet,
      detail: !settings.siteSettingsSaved
        ? "Never saved — the footer and contact page have no details"
        : !settings.contactEmailSet || !settings.contactPhoneSet
          ? "Missing a contact email or phone number"
          : "Brand and contact details are set",
      href: "/admin/settings",
    },
    {
      label: "Social proof",
      ok:
        homepage.activeGoogleReviews > 0 ||
        homepage.activeCustomerReviews > 0,
      detail: `${homepage.activeGoogleReviews} Google · ${homepage.activeCustomerReviews} video · ${homepage.activeTeamMembers} team · ${content.publishedBlogs} blog`,
      href: "/admin/google-reviews",
    },
  ];

  const problems = rows.filter((row) => !row.ok).length;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 divide-y md:divide-y-0 divide-neutral-100">
        {rows.map((row) => (
          <HealthRow key={row.label} row={row} />
        ))}
      </div>

      <p className="text-[11px] text-neutral-400 pt-3 border-t border-neutral-100 mt-2">
        {problems === 0
          ? "Everything on the storefront is configured."
          : `${problems} item${problems === 1 ? "" : "s"} need attention.`}
      </p>
    </div>
  );
}
