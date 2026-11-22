/**
 * The address of a comic's page.
 *
 * Comics are reached at /comic/<slug>. The slug is nullable only until the
 * migration backfill has run (and on snapshots that carry no slug, such as a
 * saved personalisation session), so the id is the fallback: /comic/<id> is
 * answered with a permanent redirect to the slug address by the comic layout.
 * Every place that builds a comic link goes through here so the rule exists once.
 */
export function comicHref(comic: { id: string; slug?: string | null }): string {
  return `/comic/${comic.slug || comic.id}`;
}
