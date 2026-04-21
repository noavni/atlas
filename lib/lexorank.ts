/**
 * Fractional (LexoRank-style) ordering — client mirror of api/_core/lexorank.py.
 * Keep these in sync: any change here needs the matching Python change.
 */

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BUCKET_PREFIX = "0|";
const MIN_CHAR = ALPHABET[0]!;
const MAX_CHAR = ALPHABET[ALPHABET.length - 1]!;
const MID_CHAR = ALPHABET[Math.floor(ALPHABET.length / 2)]!;

function body(rank: string): string {
  const i = rank.indexOf("|");
  return i === -1 ? rank : rank.slice(i + 1);
}

function idx(c: string): number {
  const i = ALPHABET.indexOf(c);
  if (i === -1) throw new Error(`invalid rank char ${c}`);
  return i;
}

function midBetween(a: string, b: string): string {
  const ai = idx(a);
  const bi = idx(b);
  if (ai > bi) throw new Error(`rank chars out of order: ${a} > ${b}`);
  return ALPHABET[Math.floor((ai + bi) / 2)]!;
}

export function between(before: string | null | undefined, after: string | null | undefined): string {
  const lo = before ? body(before) : "";
  const hi = after ? body(after) : "";
  if (before && after && lo >= hi) throw new Error(`ranks out of order: ${before} >= ${after}`);

  const out: string[] = [];
  let i = 0;
  while (true) {
    const loC = i < lo.length ? lo[i]! : MIN_CHAR;
    const hiC = i < hi.length ? hi[i]! : MAX_CHAR;
    const midC = midBetween(loC, hiC);
    if (midC !== loC) {
      out.push(midC);
      return BUCKET_PREFIX + out.join("");
    }
    out.push(loC);
    i++;
    if (i > 64) throw new Error("lexorank exhausted precision; rebalance needed");
  }
}

export function initialRank(): string {
  return BUCKET_PREFIX + MID_CHAR;
}
