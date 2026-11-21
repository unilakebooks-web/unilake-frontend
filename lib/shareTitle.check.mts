// Run: npx tsx lib/shareTitle.check.mts (exits non-zero on failure). The frontend has no test runner.
import assert from "node:assert/strict";
import { firstName, shareTitle } from "./shareTitle";

const count = (s: string) => Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)).length;

// 30 / 31 characters
assert.equal(firstName("a".repeat(30)), "a".repeat(30));
assert.equal(firstName("a".repeat(31)), "a".repeat(30));
// surrogate pairs: 31 astral characters must cut to 30 whole ones, never half a pair
const astral = "\u{1D4D0}".repeat(31);
assert.equal(firstName(astral), "\u{1D4D0}".repeat(30));
assert.doesNotThrow(() => encodeURIComponent(firstName(astral))); // throws on a lone surrogate
// emoji (including a ZWJ family sequence counts as one)
assert.equal(firstName("😀".repeat(40)), "😀".repeat(30));
const fam = "👨‍👩‍👧";
assert.equal(firstName(fam.repeat(31)), fam.repeat(30));
// Devanagari conjunct: a combining mark is never left behind or cut off
const ksha = "क्ष"; // क + virama + ष
assert.equal(firstName(ksha.repeat(31)), ksha.repeat(30));
assert.equal(count(firstName("क्षत्रिय")), count("क्षत्रिय"));
assert.equal(firstName("क्षत्रिय"), "क्षत्रिय");
assert.equal(count(firstName("नमस्ते".repeat(10))), 30);
// empty-ish
assert.equal(firstName(""), "");
assert.equal(firstName(null), "");
assert.equal(firstName(undefined), "");
assert.equal(firstName("   \t\n "), "");
// first word only, leading spaces
assert.equal(firstName("   Aarav Kumar"), "Aarav");
assert.equal(firstName("Aarav Kumar"), "Aarav");
// left as is (React escapes it)
assert.equal(firstName("<script>"), "<script>");
assert.equal(shareTitle("Space Trip", "<script>"), "<script>'s book: Space Trip");

// titles
assert.equal(shareTitle("Space Trip"), "Space Trip: a personalised book");
assert.equal(shareTitle("Space Trip", null), "Space Trip: a personalised book");
assert.equal(shareTitle("Space Trip", "  "), "Space Trip: a personalised book");
assert.equal(shareTitle("Space Trip", " Aarav Kumar "), "Aarav's book: Space Trip");

console.log("shareTitle checks passed");
