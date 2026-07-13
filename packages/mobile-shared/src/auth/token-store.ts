type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export function registerAuthTokenGetter(getter: TokenGetter) {
  tokenGetter = getter;
}

export async function resolveAuthToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  try {
    return await tokenGetter();
  } catch {
    return null;
  }
}
