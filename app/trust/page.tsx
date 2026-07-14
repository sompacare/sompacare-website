import Link from "next/link";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container, Section } from "@/components/ui/Primitives";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Trust, Security & Compliance",
  description:
    "How Sompacare protects facility and clinician data with tenant isolation, audit logging, credential verification, and background screening.",
  path: "/trust",
});

const pillars = [
  {
    title: "Tenant isolation",
    body: "Facility and organization data is scoped by membership. Managers only access facilities and records tied to their organization — not the broader platform.",
  },
  {
    title: "Credential verification",
    body: "Licenses and certifications are verified before clinicians book shifts. Expiration monitoring and compliance scoring help facilities staff with confidence.",
  },
  {
    title: "Background screening",
    body: "Employment background checks are conducted through Checkr with FCRA disclosures and authorizations. Status is tracked in the compliance engine.",
  },
  {
    title: "Audit & access control",
    body: "Role-based permissions, authentication via Clerk, and audit logs for sensitive actions support accountability across recruiters, facilities, and administrators.",
  },
  {
    title: "Data protection",
    body: "Encryption in transit, least-privilege access, and documented privacy practices aligned with healthcare workforce operations.",
  },
];

export default function TrustPage() {
  return (
    <SiteLayout>
      <main>
        <Section className="bg-white">
          <Container className="max-w-3xl py-16 lg:py-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue">
              Trust
            </p>
            <h1 className="mt-3 text-3xl font-bold text-brand-navy sm:text-4xl">
              Security, compliance & data trust
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              Sompacare is built for healthcare staffing at scale. Facilities, clinicians, and
              internal teams rely on clear legal terms, isolated tenant data, and verified
              compliance workflows.
            </p>

            <div className="mt-10 space-y-8">
              {pillars.map((item) => (
                <section key={item.title}>
                  <h2 className="text-lg font-bold text-brand-navy">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.body}</p>
                </section>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="font-bold text-brand-navy">Legal documents</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="font-semibold text-brand-blue hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="font-semibold text-brand-blue hover:underline">
                    Terms of Service
                  </Link>
                </li>
              </ul>
              <p className="mt-4 text-sm text-slate-600">
                Security questions:{" "}
                <a href="mailto:privacy@sompacare.com" className="text-brand-blue hover:underline">
                  privacy@sompacare.com
                </a>
              </p>
            </div>
          </Container>
        </Section>
      </main>
    </SiteLayout>
  );
}
