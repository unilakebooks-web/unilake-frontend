import sanitizeHtml from "sanitize-html";

interface BlogBodyRendererProps {
  html: string;
  /** Turn standalone YouTube links into embedded players. Blog posts only. */
  embedYouTube?: boolean;
}

/**
 * Renders admin-authored rich-text HTML (blog articles and the legal pages).
 *
 * Sanitising is deliberately done at render time rather than on write: a post
 * sanitised only on save stays dangerous forever if a bad row ever lands in the
 * database, whereas this runs on every read.
 *
 * ⚠️ DO NOT switch this back to `isomorphic-dompurify`.
 *
 * It was used here until Sep 2026 and took the whole page down in production.
 * DOMPurify needs a DOM, so on the server `isomorphic-dompurify` pulls in
 * `jsdom` — and jsdom depends on seven ESM-only packages while Next.js treats
 * jsdom as an *external* package, meaning it is `require()`d at runtime rather
 * than bundled. On Vercel's Node that throws ERR_REQUIRE_ESM before a single
 * line of our code runs, crashing the function with FUNCTION_INVOCATION_FAILED.
 * Every page rendering this component 500'd: /blog/[slug], /privacy, /terms and
 * /refund.
 *
 * It never reproduced locally, and it never will: `next dev` resolves modules
 * differently, and Node 22.12+ allows require() of ESM anyway, so a developer
 * machine hides the fault entirely.
 *
 * `sanitize-html` is plain JavaScript with no DOM, so there is no jsdom and
 * nothing to fake. It is also not in Next's default external list, so it is
 * bundled at build time instead of required at runtime — which is what makes it
 * immune to this whole class of failure regardless of the Node version Vercel
 * happens to run.
 */

/**
 * The allowlist is built from what the TipTap editor can actually produce, not
 * from what the toolbar has buttons for — markdown shortcuts create code blocks
 * (```) and horizontal rules (---) with no button, and pasted content can carry
 * both. Anything absent is dropped.
 *
 * `class` is kept on `a` and `img` because the editor bakes Tailwind classes
 * into them at insert time (rounded, centred images; purple underlined links).
 * Stripping it would silently restyle every post already published. The values
 * come from admins only and are inert — a class name cannot execute.
 *
 * `allowedSchemes` is the line doing the real security work: it is what stops a
 * `javascript:` URL surviving inside an href.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    // structure — h1 is deliberately absent, the page owns it for the title
    "p",
    "br",
    "hr",
    "h2",
    "h3",
    "h4",
    // inline marks
    "strong",
    "b",
    "em",
    "i",
    "s",
    "code",
    "pre",
    // blocks
    "blockquote",
    "ul",
    "ol",
    "li",
    // media
    "a",
    "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "class"],
    img: ["src", "alt", "title", "width", "height", "class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** "90", "90s", "1m30s", "1h2m3s" → seconds; anything else → 0. */
function parseStartSeconds(value: string | null): number {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return 0;
  const [, h = "0", m = "0", s = "0"] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

/**
 * Extracts a YouTube video id (plus optional start time) from a watch, short,
 * youtu.be, embed or live URL. Returns null for anything else, including
 * channel/playlist links, so those stay ordinary links.
 */
function parseYouTubeUrl(href: string): { id: string; start: number } | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, first, second] = url.pathname.split("/");
    if (first === "watch") id = url.searchParams.get("v");
    else if (first === "shorts" || first === "embed" || first === "live") id = second ?? null;
  }

  if (!id || !YOUTUBE_ID.test(id)) return null;
  return {
    id,
    start: parseStartSeconds(url.searchParams.get("t") ?? url.searchParams.get("start")),
  };
}

// sanitize-html strips every <p> attribute, so after sanitizing a paragraph is
// always a bare `<p>` — that is what makes these patterns exact.
const PARAGRAPH = /<p>([\s\S]*?)<\/p>/g;
const LINE_BREAK = /<br\s*\/?>/;
// One line that is nothing but a single link.
const LINK_ONLY_LINE = /^\s*<a\s[^>]*?href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*$/;

function youTubePlayer(video: { id: string; start: number }, linkText: string): string {
  const title =
    linkText.replace(/<[^>]*>/g, "").replace(/"/g, "&quot;").trim() || "YouTube video";
  const src =
    `https://www.youtube-nocookie.com/embed/${video.id}` +
    (video.start > 0 ? `?start=${video.start}` : "");

  return (
    `<div class="not-prose my-8 aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg">` +
    `<iframe src="${src}" title="${title}" loading="lazy" ` +
    `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ` +
    `referrerpolicy="strict-origin-when-cross-origin" allowfullscreen class="h-full w-full border-0"></iframe>` +
    `</div>`
  );
}

/**
 * Turns every LINE that is only a YouTube link into a player. Works per line,
 * not per paragraph: TipTap often keeps a link that looks like it's on its
 * own line inside the next paragraph, split off with <br> (Shift+Enter or
 * pasted text) — e.g. `<p><a>Watch</a><br><br>Next paragraph…</p>`. The
 * paragraph is split around the player and the text on either side stays as
 * normal paragraphs. Links inside a sentence share their line with other
 * text, so they never match and sentences are never broken apart.
 *
 * Runs on already-sanitized HTML. The iframe is built only from a validated
 * 11-character id and a numeric start time — never from the admin's markup —
 * so it cannot carry anything the sanitizer removed. youtube-nocookie.com is
 * YouTube's privacy-enhanced player (no tracking cookies until play).
 */
function embedYouTubeLinks(html: string): string {
  return html.replace(PARAGRAPH, (paragraph, inner: string) => {
    const lines = inner.split(LINE_BREAK);
    let foundVideo = false;
    let output = "";
    let textRun: string[] = [];

    // Emits pending text lines as a paragraph, dropping the blank lines that
    // separated them from a player so no empty gap is left behind.
    const flushText = () => {
      while (textRun.length && !textRun[0].trim()) textRun.shift();
      while (textRun.length && !textRun[textRun.length - 1].trim()) textRun.pop();
      if (textRun.length) output += `<p>${textRun.join("<br>")}</p>`;
      textRun = [];
    };

    for (const line of lines) {
      const link = line.match(LINK_ONLY_LINE);
      const video = link ? parseYouTubeUrl(link[1].replace(/&amp;/g, "&")) : null;
      if (link && video) {
        foundVideo = true;
        flushText();
        output += youTubePlayer(video, link[2]);
      } else {
        textRun.push(line);
      }
    }

    if (!foundVideo) return paragraph;
    flushText();
    return output;
  });
}

export default function BlogBodyRenderer({ html, embedYouTube = false }: BlogBodyRendererProps) {
  const cleanHtml = sanitizeHtml(html, SANITIZE_OPTIONS);
  const sanitizedHtml = embedYouTube ? embedYouTubeLinks(cleanHtml) : cleanHtml;

  return (
    <div
      className="prose prose-purple max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
