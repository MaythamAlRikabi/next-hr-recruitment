/**
 * Owner rule (2026-10-31): channel signature / watermark lines never appear on an ad.
 * Example (Medical Field): "▓▓▓▓▓˹𝐌𝗙˼▒▒▒▒▒▒▒▒ @Medical_Field #علي_احمد_الجنابي".
 *  - a run of 3+ block/shade characters (▓ ▒ █ …, U+2580–U+259F) starts a decoration: it is removed up to the end of its line;
 *  - the owner-name hashtag "#علي_احمد_الجنابي" (also written with spaces) is removed wherever it is.
 * `raw_text` keeps the original post (staff-only, used for de-duplication); every other field and every view goes through this.
 */
const BLOCK_RUN = /[▀-▟]{3,}[^\n]*/gu;
const OWNER_NAME = /#?علي[_ \t]+احمد[_ \t]+الجنابي/gu;

export function stripSignature(s: string): string {
  return s
    .replace(BLOCK_RUN, "")
    .replace(OWNER_NAME, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
