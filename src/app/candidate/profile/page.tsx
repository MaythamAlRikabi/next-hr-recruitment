import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import { cityList } from "@/lib/jobs";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { SubNav } from "@/components/layout/SubNav";
import { CandidateProfileForm } from "@/components/forms/OpForms";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function CandidateProfilePage() {
  const { viewer } = await requireRole(["candidate"], "/candidate/profile");
  const locale = await getLocale();
  const L = ops[locale];
  const supabase = await createClient();
  const { data: cp } = await supabase.from("candidate_profiles")
    .select("headline, summary, years_experience, seniority, preferred_functions, preferred_locations").eq("user_id", viewer.id).maybeSingle();
  return (
    <>
      <PageHeader title={L.cand.profileTitle} intro={L.cand.profileIntro} />
      <Section className="max-w-3xl space-y-8">
        <SubNav label={L.cand.dash} active="/candidate/profile" items={[
          { href: "/candidate", label: L.cand.dash }, { href: "/candidate/profile", label: L.cand.links.profile },
          { href: "/candidate/cv", label: L.cand.links.cv }, { href: "/account", label: L.cand.links.account },
        ]} />
        <CandidateProfileForm L={L} cities={cityList(locale)} initial={{
          headline: cp?.headline ?? "", summary: cp?.summary ?? "", years: cp?.years_experience != null ? String(cp.years_experience) : "",
          seniority: cp?.seniority ?? "", functions: (cp?.preferred_functions ?? []).join(", "), locations: cp?.preferred_locations ?? [],
        }} />
      </Section>
    </>
  );
}
