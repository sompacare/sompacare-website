import Link from "next/link";
import type { LegalDocumentContent } from "@sompacare/shared";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container, Section } from "@/components/ui/Primitives";
import { createMetadata } from "@/lib/seo";

type Props = {
  document: LegalDocumentContent;
  path: string;
};

export function legalPageMetadata(document: LegalDocumentContent, path: string) {
  return createMetadata({
    title: document.title,
    description: document.summary,
    path,
  });
}

export function LegalDocumentView({ document, path }: Props) {
  return (
    <SiteLayout>
      <main>
        <Section className="bg-white">
          <Container className="max-w-3xl py-16 lg:py-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue">
              Legal
            </p>
            <h1 className="mt-3 text-3xl font-bold text-brand-navy sm:text-4xl">
              {document.title}
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Effective {document.effectiveDate} · Version {document.version}
            </p>
            <p className="mt-6 text-base leading-relaxed text-slate-700">{document.summary}</p>

            <div className="mt-10 space-y-10">
              {document.sections.map((section) => (
                <section key={section.id} id={section.id}>
                  <h2 className="text-lg font-bold text-brand-navy">{section.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">{section.body}</p>
                </section>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap gap-4 border-t border-slate-200 pt-8 text-sm">
              {path !== "/privacy" && (
                <Link href="/privacy" className="font-semibold text-brand-blue hover:underline">
                  Privacy Policy
                </Link>
              )}
              {path !== "/terms" && (
                <Link href="/terms" className="font-semibold text-brand-blue hover:underline">
                  Terms of Service
                </Link>
              )}
              <Link href="/trust" className="font-semibold text-brand-blue hover:underline">
                Trust & Security
              </Link>
              <Link href="/contact" className="font-semibold text-brand-blue hover:underline">
                Contact
              </Link>
            </div>
          </Container>
        </Section>
      </main>
    </SiteLayout>
  );
}
