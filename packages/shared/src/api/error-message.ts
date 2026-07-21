/** Extract human-readable message from NestJS API error JSON. */
export function nestApiErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: string | string[] }).message;
    if (typeof message === "string" && message.trim()) return message;
    if (Array.isArray(message)) {
      const joined = message.filter((part) => typeof part === "string" && part.trim()).join(" ");
      if (joined) return joined;
    }
  }
  return fallback;
}
