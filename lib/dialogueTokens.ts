/**
 * The four substitution tokens the SD text-stamper replaces at generation time.
 * Must match the Prisma schema comment on Bubble.dialogue exactly.
 * When the backend worker is built, import this (or replicate) — mismatch = silent breakage.
 */
export const DIALOGUE_TOKENS = [
  "{name}",
  "{pronoun_subject}",
  "{pronoun_object}",
  "{pronoun_possessive}",
] as const;

export type DialogueToken = typeof DIALOGUE_TOKENS[number];

export const DIALOGUE_TOKEN_SET = new Set<string>(DIALOGUE_TOKENS);

export const DIALOGUE_TOKEN_LABELS: Record<DialogueToken, string> = {
  "{name}": "Name",
  "{pronoun_subject}": "Subject",
  "{pronoun_object}": "Object",
  "{pronoun_possessive}": "Possessive",
};

/** Sample substitution values for preview. */
export const SAMPLE_NAMES = {
  short: "Aarav",
  long: "Ramanujan",
};

/**
 * Hard cap on a child's name in the customer-facing personalization forms.
 *
 * The name is stamped into speech bubbles at generation time, so a long one is
 * auto-shrunk or clipped in the printed book. Capping the input is what stops
 * that from reaching print.
 *
 * The backend independently allows up to 50 characters
 * (session.schema.ts) — this is a stricter product rule layered on top, not a
 * mirror of it. Raising this alone will not break anything server-side.
 *
 * Shared by ComicPersonalizeForm and NewPhotoForm, which duplicate each other's
 * field set by design. A second copy of this number would inevitably drift.
 */
export const MAX_NAME_LENGTH = 9;

export const SAMPLE_PRONOUNS: Record<string, string> = {
  "{pronoun_subject}": "he",
  "{pronoun_object}": "him",
  "{pronoun_possessive}": "his",
};

/** Pronoun sets — mirrors PRONOUN_TABLE in the backend's sd/tokens.ts. */
export const PRONOUN_TABLE: Record<
  "HE" | "SHE" | "THEY",
  { subject: string; object: string; possessive: string }
> = {
  HE: { subject: "he", object: "him", possessive: "his" },
  SHE: { subject: "she", object: "her", possessive: "her" },
  THEY: { subject: "they", object: "them", possessive: "their" },
};

/**
 * One piece of substituted dialogue. `isName` is true only for text that came
 * from a {name} token — what Bubble.nameColor paints.
 */
export type DialogueSegment = {
  text: string;
  isName: boolean;
};

const TOKEN_PATTERN =
  /(\{name\}|\{pronoun_subject\}|\{pronoun_object\}|\{pronoun_possessive\})/;

/**
 * MIRROR of substituteTokensToSegments in the backend's sd/tokens.ts — the
 * canvas and the print renderer must substitute identically. Change both.
 *
 * Substitutes every token but keeps the result as pieces, so the renderer
 * still knows which characters are the child's name. Every {name} is marked;
 * pronouns are ordinary dialogue.
 */
export function substituteTokensToSegments(
  template: string,
  childName: string,
  pronounKey: "HE" | "SHE" | "THEY",
): DialogueSegment[] {
  const pronouns = PRONOUN_TABLE[pronounKey];

  return template
    .split(TOKEN_PATTERN)
    .filter((part) => part.length > 0)
    .map((part) => {
      switch (part) {
        case "{name}":
          return { text: childName, isName: true };
        case "{pronoun_subject}":
          return { text: pronouns.subject, isName: false };
        case "{pronoun_object}":
          return { text: pronouns.object, isName: false };
        case "{pronoun_possessive}":
          return { text: pronouns.possessive, isName: false };
        default:
          return { text: part, isName: false };
      }
    });
}

/**
 * Finds any `{...}` string that is not a valid token.
 */
export function findInvalidTokens(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/\{[^}]*\}/g);
  if (!matches) return [];
  return matches.filter((token) => !DIALOGUE_TOKEN_SET.has(token));
}

/**
 * Replaces tokens with sample values for preview.
 */
export function substituteTokens(
  text: string,
  name: string,
  pronouns: Record<string, string>
): string {
  if (!text) return "";
  let result = text.replace(/\{name\}/g, name);
  for (const [token, value] of Object.entries(pronouns)) {
    result = result.replace(new RegExp(token, "g"), value);
  }
  return result;
}
