/**
 * Indian pincode → city/state lookup, backed by data/pincodes.json (generated
 * by scripts/build-pincodes.mjs — see that file for the encoded shape).
 *
 * The data is loaded with a dynamic import, so Next.js ships it as its own
 * content-hashed chunk: nobody downloads it until they actually type a pincode,
 * it is cached immutably after that, and a regenerated file busts the cache on
 * its own. The import promise is memoised, so it is fetched at most once.
 *
 * "City" is the source's district — the file has no city column.
 */

type PincodeData = {
  s: string[];
  d: string[];
  p: Record<string, [number[], number[]]>;
};

export type PincodeMatch = {
  /** Candidate cities, best first. Always at least one. */
  cities: string[];
  /** Candidate states, best first. Always at least one. */
  states: string[];
};

export const INDIAN_PINCODE = /^\d{6}$/;

let dataPromise: Promise<PincodeData> | null = null;

function loadData(): Promise<PincodeData> {
  if (!dataPromise) {
    dataPromise = import("@/data/pincodes.json")
      .then((mod) => mod.default as unknown as PincodeData)
      .catch((err) => {
        // Don't memoise a failure — let the next keystroke retry the download.
        dataPromise = null;
        throw err;
      });
  }
  return dataPromise;
}

/** Starts the download early (e.g. on focus) so the first lookup feels instant. */
export function preloadPincodes(): void {
  loadData().catch(() => {
    // Swallowed: the real lookup will retry and surface it.
  });
}

/** Resolves to the match for a 6-digit pincode, or null if it isn't in the data. */
export async function lookupPincode(pin: string): Promise<PincodeMatch | null> {
  if (!INDIAN_PINCODE.test(pin)) return null;

  const data = await loadData();
  const entry = data.p[pin];
  if (!entry) return null;

  return {
    states: entry[0].map((i) => data.s[i]),
    cities: entry[1].map((i) => data.d[i]),
  };
}
