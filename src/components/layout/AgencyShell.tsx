import { PageHeader, Section } from "@/components/ui/PageHeader";
import { SubNav } from "@/components/layout/SubNav";
import type { ops } from "@/content/ops";

export function AgencyShell({ L, active, title, intro, children }: { L: (typeof ops)["en"]; active: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <PageHeader title={title} intro={intro} />
      <Section className="space-y-8">
        <SubNav label={L.staff.nav.overview} active={active} items={[
          { href: "/agency", label: L.staff.nav.overview }, { href: "/agency/requests", label: L.staff.nav.requests }, { href: "/agency/jobs", label: L.staff.nav.jobs }, { href: "/agency/external-jobs", label: L.staff.nav.external },
        ]} />
        {children}
      </Section>
    </>
  );
}
