import type { MetadataRoute } from "next";
import { blogPosts, siteConfig } from "@/lib/data";

const routes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/services", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/home-care", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/staffing", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/hr-solutions", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/case-studies", priority: 0.85, changeFrequency: "monthly" as const },
  { path: "/resources", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/careers", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    ...routes.map((route) => ({
      url: `${siteConfig.url}${route.path === "/" ? "" : route.path}`,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...blogPosts.map((post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
