import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

/** Reference number shown to the visitor: NX-YYYYMMDD-XXXXXX. Matches the DB check constraint. */
export function newReference(now: Date = new Date()): string {
  const d = now.toISOString().slice(0, 10).replaceAll("-", "");
  let tail = "";
  for (let i = 0; i < 6; i++) tail += ALPHABET[randomInt(ALPHABET.length)];
  return `NX-${d}-${tail}`;
}
