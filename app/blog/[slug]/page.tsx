import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ConversionCTASection } from "@/components/sections/ConversionCTASection";
import { Container, OutlineButton, Section } from "@/components/ui/Primitives";
import { blogPostContent, blogPosts } from "@/lib/data";
import { createMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};

  return createMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    keywords: [post.category, "Healthcare Staffing", "Healthcare Recruitment"],
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const content = blogPostContent[slug]?.content ?? [];

  return (
    <SiteLayout>
      <main>
        <section className="bg-brand-navy pb-12 pt-8 sm:pb-16 sm:pt-12">
          <Container>
            <Link href="/blog" className="text-sm font-medium text-brand-green-light hover:underline">
              ← Back to Blog
            </Link>
            <span className="mt-6 inline-flex rounded-full bg-brand-green/10 px-4 py-1.5 text-[11px] font-bold tracking-wide text-brand-green-light uppercase">
              {post.category}
            </span>
            <h1 className="mt-5 max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/60">
              <span>{post.author}</span>
              <span>·</span>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>
          </Container>
        </section>

        <Section className="bg-background">
          <Container>
            <article className="prose prose-slate mx-auto max-w-3xl dark:prose-invert">
              {content.map((paragraph) => (
                <p key={paragraph.slice(0, 50)} className="mb-6 text-base leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </article>
            <div className="mx-auto mt-12 max-w-3xl text-center">
              <OutlineButton href="/contact">Discuss Your Staffing Needs</OutlineButton>
            </div>
          </Container>
        </Section>
        <ConversionCTASection />
      </main>
    </SiteLayout>
  );
}
