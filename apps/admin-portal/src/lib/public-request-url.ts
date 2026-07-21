import type { NextRequest } from "next/server";

/** Public URL for redirects (Render sets x-forwarded-*; request.url may be 0.0.0.0). */
export function publicRequestUrl(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  return `${proto}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`;
}
