import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import { cityList, industryList } from "@/lib/jobs";
import { EmployerShell } from "@/components/layout/EmployerShell";
import { JobForm } from "@/components/forms/EmpForms";
import { btnPrimary } from "@/components/ui/styles";
import { deadlineWindow } from "@/lib/jobs";

export const metadata: Metadata = { title: "Post a job", robots: { index: false } };

export default async function NewJobPage() {
  await requireRole(["employer"], "/employer/jobs/new");
  const locale = await getLocale();
  const L = ops[locale];
  const supabase = await createClient();
  // Closing date window: today .. +180 days (same rule as the database). Page is dynamic (auth), so the clock is safe here.
  const { min: minDeadline, max: maxDeadline } = deadlineWindow();
  const { data: companies } = await supabase.from("companies").select("id, name").order("created_at");
  return (
    <EmployerShell L={L} active="/employer/jobs/new" title={L.emp.jobForm}>
      {companies?.length ? <JobForm L={L} companies={companies} cities={cityList(locale)} industries={industryList(locale)} minDeadline={minDeadline} maxDeadline={maxDeadline} /> : (
        <div className="space-y-3"><p className="text-sm text-muted">{L.emp.noCompany}</p><Link href="/employer" className={btnPrimary}>{L.emp.companyForm}</Link></div>
      )}
    </EmployerShell>
  );
}
