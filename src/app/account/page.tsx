import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authCtx } from "@/lib/page";
import { getRoles, getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { setLocale } from "@/app/actions";
import { DeletionForm, ProfileForm } from "@/components/forms/AuthForms";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { btnSecondary, cardCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/account");
  const { L, locale } = await authCtx();
  const supabase = await createClient();
  const [{ data: profile }, { data: pending }, roles] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", viewer.id).maybeSingle(),
    supabase.from("account_deletion_requests").select("id").eq("user_id", viewer.id).eq("status", "pending").maybeSingle(),
    getRoles(viewer.id),
  ]);
  const other = locale === "ar" ? "en" : "ar";
  return (
    <>
      <PageHeader title={L.accountTitle} intro={L.accountIntro} />
      <Section className="max-w-2xl space-y-8">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-brand-dark">{L.profileTitle}</h2>
          <ProfileForm L={L} email={viewer.email ?? ""} fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} />
          <p className="mt-3 text-xs text-muted">{L.role}: <span dir="ltr">{roles.join(", ")}</span></p>
        </div>
        <div className={`${cardCls} flex flex-wrap items-center gap-3`}>
          <form action={setLocale}>
            <input type="hidden" name="locale" value={other} />
            <button className={btnSecondary}>{L.language}: {other === "ar" ? "العربية" : "English"}</button>
          </form>
          <form action={signOut}><button className={btnSecondary}>{L.signOut}</button></form>
        </div>
        <div className={`${cardCls} space-y-3`}>
          <h2 className="text-lg font-semibold text-danger">{L.deleteTitle}</h2>
          <p className="text-sm text-muted">{L.deleteIntro}</p>
          <DeletionForm L={L} pending={!!pending} />
        </div>
      </Section>
    </>
  );
}
