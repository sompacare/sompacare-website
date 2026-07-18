/** Clerk config for production portals on *.sompacare.com (satellite mode off). */
export function clerkProviderProps() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isSatellite = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === "true";
  const domain = process.env.NEXT_PUBLIC_CLERK_DOMAIN;

  return {
    publishableKey,
    ...(isSatellite && domain ? { isSatellite: true as const, domain } : {}),
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
    afterSignInUrl: "/home",
    afterSignUpUrl: "/home",
  };
}

export function clerkMiddlewareOptions() {
  const isSatellite = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === "true";
  const domain = process.env.NEXT_PUBLIC_CLERK_DOMAIN;

  return {
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
    ...(isSatellite && domain ? { isSatellite: true, domain } : {}),
  };
}
