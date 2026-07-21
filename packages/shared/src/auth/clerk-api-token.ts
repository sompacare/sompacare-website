export type ClerkGetTokenOptions = {
  skipCache?: boolean;
  template?: string;
};

export type ClerkGetToken = (options?: ClerkGetTokenOptions) => Promise<string | null>;

function clerkJwtTemplate(): string | undefined {
  if (typeof process === "undefined") return undefined;
  const template = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE?.trim();
  return template || undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Wait for Clerk session JWT — retries when getToken is briefly null after sign-in. */
export async function fetchClerkApiToken(
  getToken: ClerkGetToken,
  attempts = 6
): Promise<string | null> {
  const template = clerkJwtTemplate();

  for (let i = 0; i < attempts; i++) {
    try {
      const token = await getToken({
        skipCache: true,
        ...(template ? { template } : {}),
      });
      if (token) return token;
    } catch {
      // Clerk may throw while the session is still hydrating.
    }
    await sleep(150 * (i + 1));
  }

  return null;
}
