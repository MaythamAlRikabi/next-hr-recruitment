/**
 * Outgoing application e-mail (Resend REST API). The feature "apply via NEXT" is OFF until all three settings exist:
 *   RESEND_API_KEY, NEXT_MAIL_FROM (an address on NEXT's own verified domain), SUPABASE_SERVICE_ROLE_KEY (to record delivery).
 * While it is off, no button is shown, so nobody is told their CV was sent when it was not.
 */
export const applyViaNextEnabled = () =>
  !!process.env.RESEND_API_KEY && !!process.env.NEXT_MAIL_FROM && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export type MailAttachment = { filename: string; content: string /* base64 */ };

export async function sendMail(m: { to: string; replyTo?: string; subject: string; text: string; attachments?: MailAttachment[] }): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY; const from = process.env.NEXT_MAIL_FROM;
  if (!key || !from) return { ok: false, error: "not_configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [m.to], reply_to: m.replyTo, subject: m.subject, text: m.text, attachments: m.attachments }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return { ok: false, error: `mail_${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "mail_network" };
  }
}
