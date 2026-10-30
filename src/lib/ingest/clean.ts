/** Everything that must never reach a public ad: channel signature lines and Telegram links/handles. */
import { stripSignature } from "./signature.ts";
import { stripTelegram } from "./telegram.ts";

export const cleanAdText = (s: string): string => stripTelegram(stripSignature(s));

export const cleanAdTextOrNull = (s: string | null | undefined): string | null => {
  if (!s) return null;
  const v = cleanAdText(s);
  return v || null;
};
