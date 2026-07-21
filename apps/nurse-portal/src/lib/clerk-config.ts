/** Clerk middleware options (paths from NEXT_PUBLIC_CLERK_* env vars on Render). */
export function clerkMiddlewareOptions() {
  const isSatellite = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === "true";
  const domain = process.env.NEXT_PUBLIC_CLERK_DOMAIN;

  return {
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
    ...(isSatellite && domain ? { isSatellite: true, domain } : {}),
  };
}
