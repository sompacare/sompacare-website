import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddlewareOptions } from "@/lib/clerk-config";
import { PORTAL_CANONICAL_ORIGIN } from "@/lib/portal-canonical-origin";
import { publicRequestUrl } from "@/lib/public-request-url";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/forgot-password(.*)"]);
const isAuthEntryRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

function redirectVercelPreviewHost(request: NextRequest): NextResponse | null {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!host.endsWith(".vercel.app")) return null;

  const canonical = new URL(PORTAL_CANONICAL_ORIGIN);
  const target = new URL(request.url);
  target.protocol = canonical.protocol;
  target.host = canonical.host;
  return NextResponse.redirect(target, 308);
}

export default clerkMiddleware(
  async (auth, request) => {
    const previewRedirect = redirectVercelPreviewHost(request);
    if (previewRedirect) return previewRedirect;

    if (process.env.NEXT_PUBLIC_ADMIN_PORTAL_FORCE_DEV_TOKEN === "true") {
      return;
    }

    const authState = await auth();
    const origin = publicRequestUrl(request);

    if (authState.userId && isAuthEntryRoute(request)) {
      return NextResponse.redirect(new URL("/home", origin));
    }

    if (!isPublicRoute(request)) {
      if (!authState.userId) {
        return authState.redirectToSignIn({ returnBackUrl: origin });
      }
    }
  },
  clerkMiddlewareOptions()
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
