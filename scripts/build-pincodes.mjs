// Builds data/pincodes.json from data/pincodes-source.csv.
//
// Run with `npm run build:pincodes` whenever the source CSV changes, then commit
// the regenerated JSON. It is NOT run during `next build` on purpose: the output
// is checked in, so a deploy never depends on this script succeeding.
//
// Source columns: pincode,state,district,blocks,state_lgd,district_lgd
// Only the first three are used. The source has no "city" column — district
// stands in for city in the address form (an agreed product decision).
//
// Output shape (dictionary-encoded to keep the browser download small):
//   {
//     s: string[],                          // every distinct state, Title Case
//     d: string[],                          // every distinct district, Title Case
//     p: { [pin]: [stateIdx[], districtIdx[]] }
//   }
// Index order within a pin follows the source file, so the first entry is the
// one the form auto-fills; the rest are offered as suggestions.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const sourcePath = join(dataDir, "pincodes-source.csv");
const outputPath = join(dataDir, "pincodes.json");

// Small words stay lowercase unless they open the name ("The Nilgiris").
const LOWERCASE_WORDS = new Set(["and", "of"]);

/**
 * "JAMMU AND KASHMIR" → "Jammu and Kashmir", "BENGALURU (URBAN)" → "Bengaluru (Urban)",
 * "Y.S.R." → "Y.S.R.", "GAURELA-PENDRA-MARWAHI" → "Gaurela-Pendra-Marwahi".
 * A letter is capitalised at the start and after a space, "(", "-" or ".".
 */
function toTitleCase(upper) {
  const capitalised = upper
    .trim()
    .toLowerCase()
    .replace(/(^|[\s(\-.])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());

  return capitalised
    .split(" ")
    .map((word, i) =>
      i > 0 && LOWERCASE_WORDS.has(word.toLowerCase()) ? word.toLowerCase() : word
    )
    .join(" ");
}

const ROW = /^(\d{6}),([^,"]+),([^,"]+),/;

const lines = readFileSync(sourcePath, "utf8").trim().split(/\r?\n/);
const header = lines.shift();
if (!header?.startsWith("pincode,state,district,")) {
  throw new Error(`Unexpected header in ${sourcePath}: ${header}`);
}

/** pin → { states: string[], districts: string[] }, insertion-ordered */
const byPin = new Map();

lines.forEach((line, i) => {
  const match = line.match(ROW);
  if (!match) {
    // Fail loudly — a silently skipped row is a pincode customers can't auto-fill.
    throw new Error(`Unparseable row ${i + 2}: ${line}`);
  }
  const [, pin, rawState, rawDistrict] = match;
  const state = toTitleCase(rawState);
  const district = toTitleCase(rawDistrict);

  const entry = byPin.get(pin) ?? { states: [], districts: [] };
  if (!entry.states.includes(state)) entry.states.push(state);
  if (!entry.districts.includes(district)) entry.districts.push(district);
  byPin.set(pin, entry);
});

const states = [...new Set([...byPin.values()].flatMap((e) => e.states))].sort();
const districts = [...new Set([...byPin.values()].flatMap((e) => e.districts))].sort();
const stateIndex = new Map(states.map((s, i) => [s, i]));
const districtIndex = new Map(districts.map((d, i) => [d, i]));

const pins = {};
for (const [pin, entry] of byPin) {
  pins[pin] = [
    entry.states.map((s) => stateIndex.get(s)),
    entry.districts.map((d) => districtIndex.get(d)),
  ];
}

const json = JSON.stringify({ s: states, d: districts, p: pins });
writeFileSync(outputPath, json);

console.log(
  `Wrote ${outputPath}\n` +
    `  ${lines.length} source rows → ${byPin.size} pincodes, ` +
    `${states.length} states, ${districts.length} districts, ` +
    `${(json.length / 1024).toFixed(0)} KB`
);
