import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { clerkMiddlewareOptions } from "@/lib/clerk-config";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/forgot-password(.*)"]);

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
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
