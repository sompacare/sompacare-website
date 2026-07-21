function clerkSatelliteOptions() {
  const isSatellite = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === "true";
  const domain = process.env.NEXT_PUBLIC_CLERK_DOMAIN?.trim();
  return isSatellite && domain ? { isSatellite: true as const, domain } : {};
}

/** Clerk middleware options (paths from NEXT_PUBLIC_CLERK_* env vars on Render). */
export function clerkMiddlewareOptions() {
  return {
    signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in",
    signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up",
    ...clerkSatelliteOptions(),
  };
}

/** Props for root `ClerkProvider` — keep in sync with middleware. */
export function clerkPublishableKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  return key || undefined;
}

export function clerkProviderProps() {
  return {
    publishableKey: clerkPublishableKey(),
    signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in",
    signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up",
    afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? "/home",
    afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ?? "/home",
    ...clerkSatelliteOptions(),
  };
}
