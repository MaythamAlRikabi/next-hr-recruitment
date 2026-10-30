import { PageHeader, Section } from "@/components/ui/PageHeader";
import { SubNav } from "@/components/layout/SubNav";
import type { ops } from "@/content/ops";

export function EmployerShell({ L, active, title, intro, children }: { L: (typeof ops)["en"]; active: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <PageHeader title={title} intro={intro} />
      <Section className="space-y-8">
        <SubNav label={L.emp.dash} active={active} items={[
          { href: "/employer", label: L.emp.nav.overview }, { href: "/employer/jobs/new", label: L.emp.nav.newJob }, { href: "/employer/request", label: L.emp.nav.request },
        ]} />
        {children}
      </Section>
    </>
  );
}
